/**
 * Elasticsearch Query Helpers
 * 
 * Provides helper functions to build Elasticsearch queries for common operations:
 * - Scholarship search (using RRF - Reciprocal Rank Fusion)
 * - Student data queries
 * - Analytics queries
 * 
 * All queries are template-aware (can filter by state if template has stateName)
 */

import {
    fetchElasticsearchSearch,
    fetchElasticsearchSearchWithAgent,
    fetchElasticsearchUpdate,
    fetchESQLQuery,
} from './elasticApi.js';

/**
 * Search scholarships by major/keyword using RRF (Reciprocal Rank Fusion)
 * 
 * @param {Object} criteria - Search criteria
 * @param {string} criteria.keyword - Search keyword (major, field of study, etc.)
 * @param {string} criteria.index - Elasticsearch index (default: 'scholarship_index_elser')
 * @param {number} criteria.size - Result limit (default: 50)
 * @returns {Promise<Object>} Search results with mapped scholarship data
 */
export async function searchScholarships(criteria = {}) {
    const {
        keyword = '',
        index = 'scholarship_index_elser',
        size = 50,
    } = criteria;

    if (!keyword || keyword.trim() === '') {
        return {
            scholarships: [],
            total: 0,
        };
    }

    // Build RRF query structure
    const queryBody = {
        retriever: {
            rrf: {
                retrievers: [
                    {
                        standard: {
                            query: {
                                multi_match: {
                                    query: keyword,
                                    fields: ['title', 'award', 'headings'],
                                },
                            },
                        },
                    },
                    {
                        standard: {
                            query: {
                                semantic: {
                                    field: 'scholarship_name',
                                    query: keyword,
                                },
                            },
                        },
                    },
                    {
                        standard: {
                            query: {
                                semantic: {
                                    field: 'purpose',
                                    query: keyword,
                                },
                            },
                        },
                    },
                    {
                        standard: {
                            query: {
                                semantic: {
                                    field: 'scholarship_criteria',
                                    query: keyword,
                                },
                            },
                        },
                    },
                ],
                rank_window_size: 100,
                rank_constant: 60,
            },
        },
        size: size,
        _source: ['scholarship_name', 'award', 'deadline', 'title', 'amount', 'url'],
    };

    try {
        const result = await fetchElasticsearchSearch(index, queryBody);
        
        // Map Elasticsearch hits to scholarship objects
        const scholarships = (result.hits?.hits || [])
            .map((hit) => {
                const source = hit._source || {};
                const name = source.scholarship_name || source.title || 'Unknown Scholarship';
                
                // Filter out scholarships with names > 200 characters
                if (name.length > 200) {
                    return null;
                }
                
                return {
                    id: hit._id,
                    name: name,
                    amount: source.award || source.amount || 'N/A',
                    deadline: source.deadline || 'N/A',
                    url: source.url || null,
                    title: source.title,
                    award: source.award,
                    score: hit._score,
                };
            })
            .filter((scholarship) => scholarship !== null); // Remove filtered items

        return {
            scholarships,
            total: result.hits?.total?.value || result.hits?.total || 0,
        };
    } catch (error) {
        console.error('Scholarship search error:', error);
        throw error;
    }
}

/**
 * Get student/application data using ESQL queries
 * Searches the 'students' index by full name
 * 
 * @param {string} studentId - Student full name (searches by full_name field)
 * @param {string} preferredIndex - Index to search (default: 'students')
 * @returns {Promise<Object>} Student data with index information
 */
export async function getStudentData(studentId, preferredIndex = 'students') {
    if (!studentId) {
        throw new Error('Student name is required');
    }

    // Escape quotes in studentId to prevent ESQL injection
    const escapedStudentId = studentId.replace(/"/g, '\\"');

    // Build ESQL query
    // ESQL uses == for equality comparison (not =)
    // Uses full_name field to search by name
    const buildESQLQuery = (index) => {
        if (!index || index.trim() === '') {
            throw new Error('Index name is required for ESQL query');
        }
        return `FROM ${index} | WHERE full_name == "${escapedStudentId}" | LIMIT 1`;
    };

    // Helper function to map ESQL response to student object
    const mapESQLResponse = (result, index) => {
        if (!result.columns || !result.values || result.values.length === 0) {
            return null;
        }

        const row = result.values[0];
        const student = {};
        let documentId = null;

        // Map columns to student object
        result.columns.forEach((col, index) => {
            const value = row[index];
            if (col.name === '_id') {
                documentId = value;
            } else {
                student[col.name] = value;
            }
        });

        return {
            student,
            found: true,
            index,
            documentId,
        };
    };

    // Query the students index
    try {
        console.log(`Attempting to fetch student data from index '${preferredIndex}' using ESQL`);
        const esqlQuery = buildESQLQuery(preferredIndex);
        const result = await fetchESQLQuery(esqlQuery);
        
        const mapped = mapESQLResponse(result, preferredIndex);
        if (mapped) {
            console.log(`Student found in index '${preferredIndex}'`);
            return mapped;
        }

        // Fallback: numeric login / student_id
        if (/^\d+$/.test(String(studentId).trim())) {
            const idQuery = `FROM ${preferredIndex} | WHERE student_id == ${String(studentId).trim()} | LIMIT 1`;
            const idResult = await fetchESQLQuery(idQuery);
            const idMapped = mapESQLResponse(idResult, preferredIndex);
            if (idMapped) return idMapped;
        }

        // Fallback: case-insensitive partial name
        const likeQuery = `FROM ${preferredIndex} | WHERE full_name LIKE "*${escapedStudentId}*" | LIMIT 1`;
        try {
            const likeResult = await fetchESQLQuery(likeQuery);
            const likeMapped = mapESQLResponse(likeResult, preferredIndex);
            if (likeMapped) return likeMapped;
        } catch {
            /* LIKE may not match all field types — ignore */
        }

        // No results found
        console.log(`No student found in index '${preferredIndex}'`);
        return {
            student: null,
            found: false,
            index: null,
            documentId: null,
        };
    } catch (error) {
        // Check if it's a 404 (index not found)
        if (error.isIndexNotFound || error.status === 404) {
            console.warn(`Index '${preferredIndex}' not found (404). Student data not available.`);
            // Return not found instead of throwing
            return {
                student: null,
                found: false,
                index: null,
                documentId: null,
            };
        }
        // For non-404 errors (auth, network, etc.), throw the error
        console.error('Student data query error (non-404):', error);
        throw error;
    }
}

/**
 * Get analytics and reporting data
 * 
 * @param {Object} options - Analytics options
 * @param {string} options.timeRange - Time range (e.g., "30d", "1y")
 * @param {string[]} options.metrics - Metrics to calculate
 * @param {string} options.state - Optional state filter
 * @param {string} options.index - Elasticsearch index (default: 'scholarship_index_elser')
 * @returns {Promise<Object>} Analytics data
 */
export async function getAnalytics(options = {}) {
    const {
        timeRange = '30d',
        metrics = ['count', 'total_amount'],
        state,
        index = 'scholarship_index_elser',
    } = options;

    // Build time filter
    const now = new Date();
    let startDate;
    if (timeRange === '30d') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeRange === '1y') {
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    } else {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Default: 7 days
    }

    const startDateStr = startDate.toISOString().split('T')[0];

    // Build query with filters
    const mustClauses = [
        {
            range: {
                created_date: {
                    gte: startDateStr,
                },
            },
        },
    ];

    if (state) {
        mustClauses.push({
            bool: {
                should: [
                    { term: { state: state } },
                    { term: { state: 'ALL' } },
                ],
            },
        });
    }

    // Build aggregations
    const aggs = {};
    if (metrics.includes('count')) {
        aggs.total_scholarships = { value_count: { field: '_id' } };
    }
    if (metrics.includes('total_amount')) {
        aggs.total_amount_awarded = { sum: { field: 'amount' } };
    }
    if (metrics.includes('avg_amount')) {
        aggs.average_amount = { avg: { field: 'amount' } };
    }

    const queryBody = {
        query: {
            bool: {
                must: mustClauses,
            },
        },
        size: 0, // We only want aggregations
        aggs: Object.keys(aggs).length > 0 ? aggs : undefined,
    };

    try {
        const result = await fetchElasticsearchSearch(index, queryBody);
        const aggregations = result.aggregations || {};
        
        return {
            analytics: {
                total_scholarships: aggregations.total_scholarships?.value || 0,
                total_amount_awarded: aggregations.total_amount_awarded?.value || 0,
                average_amount: aggregations.average_amount?.value || 0,
            },
            timeRange,
            metrics,
        };
    } catch (error) {
        console.error('Analytics query error:', error);
        throw error;
    }
}

/**
 * Template-aware scholarship search
 * Uses template state if available
 * 
 * @param {Object} template - Current template object
 * @param {Object} criteria - Search criteria (merged with template state)
 * @returns {Promise<Object>} Search results
 */
export async function searchScholarshipsWithTemplate(template, criteria = {}) {
    const templateCriteria = { ...criteria };

    // Add state filter from template if available
    if (template?.content?.stateName) {
        templateCriteria.state = template.content.stateName;
    }

    return searchScholarships(templateCriteria);
}

/**
 * Get Total Potential Fraud Detected YTD from ok-fraud-phantom-billing (gawdzilla).
 * ESQL: FROM ok-fraud-phantom-billing | STATS total_loss = SUM(Total_Loss_Value)
 *
 * @param {string} [agentId] - Use 'ok-fraud' to use OK_KIBANA_API_KEY for gawdzilla
 * @returns {Promise<number|null>} Sum of Total_Loss_Value or null if no data/error
 */
export async function getFraudYTDTotalLoss(agentId = 'ok-fraud') {
    const query = 'FROM ok-fraud-phantom-billing | STATS total_loss = SUM(Total_Loss_Value)';
    try {
        const result = await fetchESQLQuery(query, {}, agentId);
        if (!result.columns || !result.values || result.values.length === 0) {
            return null;
        }
        const row = result.values[0];
        const colIndex = result.columns.findIndex((c) => c.name === 'total_loss');
        const value = colIndex >= 0 && row[colIndex] != null ? Number(row[colIndex]) : null;
        return value;
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) {
            console.warn('ok-fraud-phantom-billing index not found (404). YTD total not available.');
            return null;
        }
        console.error('Fraud YTD total loss query error:', error);
        throw error;
    }
}

/**
 * Get Total Claims Flagged from ok-fraud-phantom-billing (gawdzilla).
 * ESQL: FROM ok-fraud-phantom-billing | WHERE Flag_Type IS NOT NULL | STATS total_claims_flagged = COUNT(*)
 *
 * @param {string} [agentId] - Use 'ok-fraud' to use OK_KIBANA_API_KEY for gawdzilla
 * @returns {Promise<number|null>} Count of flagged claims or null if no data/error
 */
export async function getFraudTotalClaimsFlagged(agentId = 'ok-fraud') {
    const query = 'FROM ok-fraud-phantom-billing | WHERE Flag_Type IS NOT NULL | STATS total_claims_flagged = COUNT(*)';
    try {
        const result = await fetchESQLQuery(query, {}, agentId);
        if (!result.columns || !result.values || result.values.length === 0) {
            return null;
        }
        const row = result.values[0];
        const colIndex = result.columns.findIndex((c) => c.name === 'total_claims_flagged');
        const value = colIndex >= 0 && row[colIndex] != null ? Number(row[colIndex]) : null;
        return value;
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) {
            console.warn('ok-fraud-phantom-billing index not found (404). Total claims flagged not available.');
            return null;
        }
        console.error('Fraud total claims flagged query error:', error);
        throw error;
    }
}

/** True if column name (lowercase) looks like a Medicaid recipient ID field. */
function columnLooksLikeRecipientId(col) {
    const lower = (col && String(col)).toLowerCase();
    return (lower.includes('medicaid') && lower.includes('recipient')) || (lower.includes('recipient') && lower.includes('id'));
}

/** True if column name (lowercase) looks like a claim ID field. */
function columnLooksLikeClaimId(col) {
    const lower = (col && String(col)).toLowerCase();
    return lower.includes('claim') && (lower.includes('id') || lower.includes('number') || lower.includes('_no') || lower.includes('ref') || lower.includes('num'));
}

/**
 * Get high-priority fraud cases from ok-fraud-* (gawdzilla).
 * ESQL: FROM ok-fraud-* | WHERE Risk_Score >= 80 | EVAL Priority = CASE(...) | KEEP ... | LIMIT 100
 *
 * @param {string} [agentId] - Use 'ok-fraud' to use OK_KIBANA_API_KEY for gawdzilla
 * @returns {Promise<Array<Object>>} Array of row objects (keys: @timestamp, Claim_ID, Patient_ID, Flag_Type, etc.) or [] on empty/404
 */
export async function getFraudHighPriorityCases(agentId = 'ok-fraud') {
    const query = `FROM ok-fraud-*
| WHERE Risk_Score >= 80 AND Medicaid_Recipient_ID IS NOT NULL
| EVAL Priority = CASE(
    Risk_Score >= 90 AND Total_Loss_Value >= 10000, "Critical",
    Risk_Score >= 80 AND Total_Loss_Value >= 5000, "High",
    "Medium")
| KEEP @timestamp, Claim_ID, Patient_ID, Medicaid_Recipient_ID, Flag_Type, Total_Loss_Value, Amount_Submitted, Investigator_Assigned, Agency_Type, Priority
| LIMIT 100`;
    try {
        const result = await fetchESQLQuery(query, {}, agentId);
        if (!result.columns || !result.values) {
            return [];
        }
        const columns = result.columns.map((c) => c.name);
        if (typeof window !== 'undefined' && (window.location?.hostname === 'localhost' || process?.env?.NODE_ENV === 'development')) {
            console.log('ESQL high-priority columns:', columns);
            if (result.values.length > 0) {
                const firstRow = result.values[0];
                const rowKeys = columns.reduce((acc, col, i) => ({ ...acc, [col]: firstRow[i] }), {});
                console.log('ESQL high-priority first row (column -> value):', rowKeys);
            }
        }
        const toCanonicalKey = (name) => {
            const map = {
                medicaid_recipient_id: 'Medicaid_Recipient_ID',
                claim_id: 'Claim_ID',
                claimid: 'Claim_ID',
                ClaimId: 'Claim_ID',
                claim_number: 'Claim_ID',
                Claim_Number: 'Claim_ID',
                claim_no: 'Claim_ID',
                Claim_No: 'Claim_ID',
                flag_type: 'Flag_Type',
                agency_type: 'Agency_Type',
                total_loss_value: 'Total_Loss_Value',
                amount_submitted: 'Amount_Submitted',
                investigator_assigned: 'Investigator_Assigned',
                risk_score: 'Risk_Score',
                patient_id: 'Patient_ID',
                timestamp: '@timestamp',
            };
            return map[name] || name;
        };
        return result.values.map((row) => {
            const obj = {};
            columns.forEach((col, idx) => {
                const val = row[idx];
                obj[col] = val;
                const canonical = toCanonicalKey(col);
                if (canonical !== col) obj[canonical] = val;
                if (val != null && val !== '' && columnLooksLikeRecipientId(col)) obj['Medicaid_Recipient_ID'] = val;
                if (val != null && val !== '' && columnLooksLikeClaimId(col)) obj['Claim_ID'] = val;
            });
            if ((obj['Claim_ID'] == null || obj['Claim_ID'] === '') && columns.length > 0) {
                for (const k of Object.keys(obj)) {
                    if (columnLooksLikeClaimId(k) && obj[k] != null && obj[k] !== '') {
                        obj['Claim_ID'] = obj[k];
                        break;
                    }
                }
            }
            return obj;
        });
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) {
            console.warn('ok-fraud-* index not found (404). High-priority cases not available.');
            return [];
        }
        console.error('Fraud high-priority cases query error:', error);
        throw error;
    }
}

/**
 * Get all records for a Medicaid recipient from ok-fraud-* (gawdzilla) for the detail page.
 *
 * @param {string} medicaidRecipientId - Recipient ID (e.g. OK-MCD-137185)
 * @param {string} [agentId] - Use 'ok-fraud' for gawdzilla
 * @returns {Promise<Array<Object>>} Array of row objects or [] on empty/404
 */
export async function getFraudRecipientDetail(medicaidRecipientId, agentId = 'ok-fraud') {
    if (!medicaidRecipientId || String(medicaidRecipientId).trim() === '') {
        return [];
    }
    const escaped = String(medicaidRecipientId).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

    const buildQuery = (recipientIdField) => `FROM ok-fraud-*
| WHERE ${recipientIdField} == "${escaped}"
| EVAL Priority = CASE(
    Risk_Score >= 90 AND Total_Loss_Value >= 10000, "Critical",
    Risk_Score >= 80 AND Total_Loss_Value >= 5000, "High",
    "Medium")
| KEEP @timestamp, Claim_ID, Patient_ID, ${recipientIdField}, Flag_Type, Total_Loss_Value, Amount_Submitted, Investigator_Assigned, Agency_Type, Priority, Risk_Score
| SORT Risk_Score DESC
| LIMIT 100`;

    const runQuery = (query) => fetchESQLQuery(query, {}, agentId);

    try {
        let result;
        try {
            result = await runQuery(buildQuery('Medicaid_Recipient_ID'));
        } catch (firstErr) {
            if (firstErr.status === 400) {
                result = await runQuery(buildQuery('medicaid_recipient_id'));
            } else {
                throw firstErr;
            }
        }
        if (!result.columns || !result.values) {
            return [];
        }
        const columns = result.columns.map((c) => c.name);
        const toCanonicalKey = (name) => {
            const map = {
                medicaid_recipient_id: 'Medicaid_Recipient_ID',
                claim_id: 'Claim_ID',
                claimid: 'Claim_ID',
                ClaimId: 'Claim_ID',
                claim_number: 'Claim_ID',
                Claim_Number: 'Claim_ID',
                claim_no: 'Claim_ID',
                Claim_No: 'Claim_ID',
                flag_type: 'Flag_Type',
                agency_type: 'Agency_Type',
                total_loss_value: 'Total_Loss_Value',
                amount_submitted: 'Amount_Submitted',
                investigator_assigned: 'Investigator_Assigned',
                risk_score: 'Risk_Score',
                patient_id: 'Patient_ID',
                timestamp: '@timestamp',
            };
            return map[name] || name;
        };
        return result.values.map((row) => {
            const obj = {};
            columns.forEach((col, idx) => {
                const val = row[idx];
                obj[col] = val;
                const canonical = toCanonicalKey(col);
                if (canonical !== col) obj[canonical] = val;
                if (val != null && val !== '' && columnLooksLikeRecipientId(col)) obj['Medicaid_Recipient_ID'] = val;
                if (val != null && val !== '' && columnLooksLikeClaimId(col)) obj['Claim_ID'] = val;
            });
            if ((obj['Claim_ID'] == null || obj['Claim_ID'] === '') && columns.length > 0) {
                for (const k of Object.keys(obj)) {
                    if (columnLooksLikeClaimId(k) && obj[k] != null && obj[k] !== '') {
                        obj['Claim_ID'] = obj[k];
                        break;
                    }
                }
            }
            return obj;
        });
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) {
            console.warn('ok-fraud-* index not found (404). Recipient detail not available.');
            return [];
        }
        console.error('Fraud recipient detail query error:', error);
        throw error;
    }
}

/** First non-empty field from object (multiple possible ES field names). */
function grantField(obj, ...keys) {
    if (!obj) return null;
    for (const k of keys) {
        const v = obj[k];
        if (v != null && v !== '') return v;
    }
    return null;
}

/** Normalize _source hit into StateAgencyGrantsSearch row shape (flexible field names). */
export function mapElasticsearchGrantHitToRow(hit) {
    const s = hit._source || {};
    const id = hit._id || grantField(s, 'Portal_ID', 'portal_id', 'Grant_Program_ID', 'grant_program_id', 'id', 'grant_id');
    const title =
        grantField(s, 'Grant_Title', 'grant_title', 'Title', 'title', 'name', 'Grant_Name') || 'Untitled opportunity';
    const description =
        grantField(s, 'Purpose', 'Description', 'description', 'grant_details', 'Details', 'details') || '';
    const agencyRaw = grantField(
        s,
        'State_Agency',
        'state_agency',
        'Agency',
        'agency',
        'Department',
        'Grantor',
        'grantor'
    );
    const parseDateVal = (val) => {
        if (val == null || val === '') return '';
        if (typeof val === 'number') {
            const d = new Date(val);
            return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
        }
        const str = String(val);
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
        const d = new Date(str);
        return Number.isNaN(d.getTime()) ? str : d.toISOString().slice(0, 10);
    };
    const deadline = parseDateVal(
        grantField(s, 'Deadline', 'deadline', 'Application_Deadline', 'application_deadline', 'Close_Date', 'close_date')
    );
    const openDate = parseDateVal(
        grantField(s, 'Open_Date', 'open_date', 'Posted_Date', 'posted_date', 'Published_Date', '@timestamp')
    );
    const matchRaw = grantField(
        s,
        'Match_Funding',
        'match_funding',
        'Match_Required_Pct',
        'match_required_pct',
        'Match_Funding_Required'
    );
    const matchFunding = matchRaw != null && matchRaw !== '' ? String(matchRaw) : 'No';
    const estRaw = grantField(
        s,
        'Estimated_Total_Funding',
        'estimated_total_funding',
        'Total_Funding',
        'total_funding',
        'Estimated_Funding'
    );
    let estimatedTotal = null;
    if (estRaw != null && estRaw !== '') {
        const n = Number(estRaw);
        estimatedTotal = Number.isFinite(n) ? n : null;
    }
    const rangeLowHigh =
        grantField(s, 'Estimated_Low_High', 'estimated_low_high', 'Funding_Range', 'Award_Range', 'award_range') ||
        'Dependent';
    const disbRaw = grantField(
        s,
        'Funds_Disbursement',
        'funds_disbursement',
        'Disbursement_Method',
        'disbursement_method',
        'disbursement'
    );
    const dr = String(disbRaw || '').toLowerCase();
    let disbursementMethod = '';
    if (dr.includes('reimburs') && dr.includes('advance')) disbursementMethod = 'mixed';
    else if (dr.includes('reimburs')) disbursementMethod = 'reimbursement';
    else if (dr.includes('advance')) disbursementMethod = 'advance';

    const statusRaw = String(
        grantField(s, 'Status', 'status', 'Opportunity_Status', 'opportunity_status', 'Grant_Status', 'grant_status') || ''
    ).toLowerCase();
    let status = 'active';
    if (statusRaw.includes('forecast')) status = 'forecasted';
    else if (statusRaw.includes('closed') || statusRaw.includes('close')) status = 'closed';
    else if (statusRaw.includes('active') || statusRaw.includes('open')) status = 'active';

    const typeStr = String(grantField(s, 'Opportunity_Type', 'opportunity_type', 'type') || '').toLowerCase();
    const isLoan = typeStr.includes('loan');
    const matchRequired =
        String(matchFunding).toLowerCase() !== 'no' &&
        matchFunding !== '0' &&
        matchFunding !== '' &&
        !String(matchFunding).toLowerCase().includes('no match');

    const pa = grantField(s, 'Post_Award_Info', 'post_award_info', 'Has_Post_Award', 'has_post_award');
    const postAwardInfo =
        pa === true ||
        pa === 'true' ||
        pa === 1 ||
        String(pa || '')
            .toLowerCase()
            .includes('yes');

    const code = grantField(s, 'Agency_Code', 'agency_code', 'agency_slug');
    let agency = code ? String(code).toLowerCase().replace(/\s+/g, '_') : '';
    const str = String(agencyRaw || '').toLowerCase();
    if (!agency) {
        const needles = [
            ['commerce', 'commerce'],
            ['transport', 'transport'],
            ['agriculture', 'agriculture'],
            ['education', 'education'],
            ['health', 'health'],
            ['housing', 'housing'],
        ];
        for (const [needle, val] of needles) {
            if (str.includes(needle)) {
                agency = val;
                break;
            }
        }
    }

    const catRaw = grantField(s, 'Category', 'category', 'Funding_Category', 'funding_category');
    const catStr = String(catRaw || '').toLowerCase();
    let category = '';
    const catMap = [
        ['economic', 'economic'],
        ['infrastructure', 'infrastructure'],
        ['education', 'education'],
        ['environment', 'environment'],
        ['health', 'health'],
        ['workforce', 'workforce'],
        ['labor', 'workforce'],
        ['housing', 'economic'],
    ];
    for (const [needle, val] of catMap) {
        if (catStr.includes(needle)) {
            category = val;
            break;
        }
    }

    const appRaw = grantField(
        s,
        'Eligible_Applicant',
        'eligible_applicant',
        'Applicant_Type',
        'applicant_type'
    );
    const appStr = String(appRaw || '').toLowerCase();
    let eligibleApplicant = '';
    if (appStr.includes('business')) eligibleApplicant = 'business';
    else if (appStr.includes('nonprofit') || appStr.includes('non-profit')) eligibleApplicant = 'nonprofit';
    else if (appStr.includes('public') || appStr.includes('local government')) eligibleApplicant = 'public';
    else if (appStr.includes('tribal')) eligibleApplicant = 'tribal';
    else if (appStr.includes('individual')) eligibleApplicant = 'individual';

    return {
        id: String(id || hit._id || Math.random().toString(36).slice(2)),
        title,
        description,
        agency,
        agencyDisplay: agencyRaw || agency || '—',
        category,
        eligibleApplicant,
        disbursementMethod,
        deadline: deadline || openDate,
        openDate: openDate || deadline,
        matchFunding,
        estimatedTotal,
        rangeLowHigh,
        status,
        postAwardInfo,
        isLoan,
        matchRequired,
    };
}

function formatDashboardGrantMoney(n) {
    if (n == null || !Number.isFinite(n)) return '—';
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${Math.round(n).toLocaleString()}`;
}

/**
 * Map a catalog grant row to OkCommerceCompanyDashboard table shape.
 * @param {Object} g - Row from mapElasticsearchGrantHitToRow
 * @param {Object} [template]
 * @returns {{ id: string, program: string, company: string, submitted: string, stateMatch: string, privateMatch: string, status: string }}
 */
function mapGrantRowToDashboardApplication(g, template = {}) {
    const dash = template.content?.dashboard || {};
    const company =
        dash.demoCompanyName ||
        template.branding?.institutionName ||
        'Sample applicant organization';
    const total = g.estimatedTotal;
    const half = total != null && Number.isFinite(total) ? total / 2 : null;
    const stateMatch = formatDashboardGrantMoney(half ?? total);
    const privateMatch = stateMatch;

    let status = 'Under review';
    if (g.status === 'forecasted') status = dash.statusLabelForecasted || 'Forecasted';
    else if (g.status === 'closed') status = dash.statusLabelClosed || 'Closed – disbursed';
    else status = dash.statusLabelActive || 'Under review';

    const ref = String(g.id || '').replace(/\s+/g, '-');
    const refDisplay = ref.length > 18 ? `MG-${ref.slice(-12)}` : ref.startsWith('MG-') ? ref : `MG-${ref}`;

    return {
        id: refDisplay,
        program: g.title || '—',
        company,
        submitted: g.openDate || g.deadline || '—',
        stateMatch,
        privateMatch,
        status,
    };
}

/**
 * Load 2–5 grant rows from ok-grant-data for the company match-grant applications table.
 *
 * @param {Object} [template] - Uses template.elastic.grantsDataIndex, grantsDataAgentId, dashboardGrantsMin, dashboardGrantsMax
 * @returns {Promise<Array<Object>>} Dashboard application rows; empty array on error / no index (caller falls back to demo)
 */
export async function getOkGrantDashboardApplications(template = {}) {
    const elastic = template.elastic || {};
    const index = elastic.grantsDataIndex || 'ok-grant-data';
    const agentId = elastic.grantsDataAgentId || 'ok-fraud';
    const minRows = Math.min(5, Math.max(1, Number(elastic.dashboardGrantsMin) || 1));
    const maxRows = Math.min(10, Math.max(minRows, Number(elastic.dashboardGrantsMax) || 5));
    const fetchSize = maxRows;

    const queryBody = {
        query: { match_all: {} },
        size: fetchSize,
        sort: [{ _doc: 'asc' }],
    };

    try {
        const result = await fetchElasticsearchSearchWithAgent(index, queryBody, agentId);
        const hits = result.hits?.hits || [];
        const catalogRows = hits.map((hit) => mapElasticsearchGrantHitToRow(hit));
        let apps = catalogRows.map((g) => mapGrantRowToDashboardApplication(g, template));
        if (apps.length > maxRows) apps = apps.slice(0, maxRows);
        if (apps.length < minRows) return [];
        return apps;
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) {
            console.warn(`Grant index "${index}" not found (404). Dashboard applications will use demo data.`);
            return [];
        }
        console.error('getOkGrantDashboardApplications error:', error);
        return [];
    }
}

/**
 * Load grant opportunities from ok-grant-data (gawdzilla ES) for the State Agency grants UI.
 *
 * @param {Object} [template] - Current template; uses template.elastic.grantsDataIndex / grantsDataAgentId / grantsSearchSize
 * @returns {Promise<Array<Object>>} Rows for StateAgencyGrantsSearch; empty array on 404 or error (caller may fall back)
 */
export async function getOkGrantDataCatalog(template = {}) {
    const elastic = template.elastic || {};
    const index = elastic.grantsDataIndex || 'ok-grant-data';
    const agentId = elastic.grantsDataAgentId || 'ok-fraud';
    const size = Math.min(Math.max(1, Number(elastic.grantsSearchSize) || 2000), 10000);

    const queryBody = {
        query: { match_all: {} },
        size,
        sort: [{ _doc: 'asc' }],
    };

    try {
        const result = await fetchElasticsearchSearchWithAgent(index, queryBody, agentId);
        const hits = result.hits?.hits || [];
        return hits.map((hit) => mapElasticsearchGrantHitToRow(hit));
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) {
            console.warn(`Grant index "${index}" not found (404). Grants search will fall back if configured.`);
            return [];
        }
        console.error('getOkGrantDataCatalog error:', error);
        throw error;
    }
}

/**
 * Get document ID by searching with standard Elasticsearch query
 * Used when ESQL doesn't return _id
 * 
 * @param {string} studentName - Student full name
 * @param {string} index - Elasticsearch index (default: 'students')
 * @returns {Promise<string|null>} Document ID or null if not found
 */
async function getDocumentIdByName(studentName, index = 'students') {
    try {
        const queryBody = {
            query: {
                term: {
                    full_name: studentName
                }
            },
            size: 1
        };
        
        const result = await fetchElasticsearchSearch(index, queryBody);
        const hits = result.hits?.hits || [];
        if (hits.length > 0) {
            return hits[0]._id;
        }
        return null;
    } catch (error) {
        console.error('Error getting document ID:', error);
        return null;
    }
}

/**
 * Update student data in Elasticsearch
 * 
 * @param {string} studentId - Student full name
 * @param {Object} updateData - Data to update
 * @param {string} index - Elasticsearch index (default: 'students')
 * @param {string} documentId - Optional document ID (if not provided, will search for it)
 * @returns {Promise<Object>} Update result
 */
export async function updateStudentData(studentId, updateData, index = 'students', documentId = null) {
    if (!studentId) {
        throw new Error('Student name is required');
    }

    // If documentId not provided, search for it using standard search (to get _id)
    let docId = documentId;
    if (!docId) {
        docId = await getDocumentIdByName(studentId, index);
        if (!docId) {
            throw new Error(`Student not found in index '${index}'`);
        }
    }

    try {
        // Remove null/undefined values from updateData
        const cleanedData = Object.entries(updateData).reduce((acc, [key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                acc[key] = value;
            }
            return acc;
        }, {});

        if (Object.keys(cleanedData).length === 0) {
            throw new Error('No valid data to update');
        }

        const result = await fetchElasticsearchUpdate(index, docId, cleanedData);
        return {
            success: true,
            result,
            index,
            documentId: docId,
        };
    } catch (error) {
        console.error('Student data update error:', error);
        throw error;
    }
}

/**
 * Run ESQL against students index and return row objects.
 * @param {string} query
 * @returns {Promise<Array<Object>>}
 */
async function runStudentsEsql(query) {
    try {
        const result = await fetchESQLQuery(query);
        if (!result?.columns || !result?.values) return [];
        const columns = result.columns.map((c) => c.name);
        return result.values.map((row) => {
            const obj = {};
            columns.forEach((col, idx) => {
                obj[col] = row[idx];
            });
            return obj;
        });
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) return [];
        throw error;
    }
}

/** @returns {Promise<Array<Object>>} */
export async function searchHighPriorityStudents() {
    const query = `FROM students
| WHERE full_name IS NOT NULL AND (risk_label == "Critical" OR risk_label == "At-Risk")
| SORT risk_score_normalized DESC
| LIMIT 20`;
    const rows = await runStudentsEsql(query);
    return rows.filter((s) => s.full_name?.trim());
}

/** @returns {Promise<Array<Object>>} */
export async function searchPrimeScholarshipCandidates() {
    const query = `FROM students
| WHERE full_name IS NOT NULL AND sai_value < 10000 AND lms_activity_score > 60 AND cumulative_gpa > 2.5
| KEEP full_name, sai_value, lms_activity_score, cumulative_gpa
| LIMIT 8`;
    return runStudentsEsql(query);
}

/** @returns {Promise<Array<Object>>} */
export async function searchCriticalRiskStudents() {
    const query = `FROM students
| WHERE full_name IS NOT NULL AND risk_label == "Critical"
| SORT risk_score_normalized DESC
| KEEP full_name, risk_score_normalized
| LIMIT 10`;
    return runStudentsEsql(query);
}

/** @param {number} [limit] @returns {Promise<Array<Object>>} */
export async function getRandomStudents(limit = 3) {
    const query = `FROM students | WHERE full_name IS NOT NULL | KEEP full_name | LIMIT ${Math.min(limit, 10)}`;
    return runStudentsEsql(query);
}

/** @returns {Promise<Array<Object>>} */
export async function getAllStudentsForNavigation() {
    const query = `FROM students | WHERE full_name IS NOT NULL | KEEP full_name | SORT full_name ASC | LIMIT 500`;
    return runStudentsEsql(query);
}

/**
 * Load a random student profile from Gawdzilla for demo / quick login.
 * @returns {Promise<Object>} Same shape as getStudentData()
 */
export async function getRandomStudentProfile() {
    const pool = await runStudentsEsql(
        `FROM students | WHERE full_name IS NOT NULL | KEEP full_name | LIMIT 50`
    );
    if (!pool.length) {
        return { student: null, found: false, index: null, documentId: null };
    }
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return getStudentData(pick.full_name);
}

/**
 * Resolve login campus ID to a student document (Gawdzilla students index).
 * Quick-login ids like "student" load a random profile from the cluster.
 * @param {string} loginId
 * @returns {Promise<Object>}
 */
export async function resolveStudentForLogin(loginId) {
    const trimmed = String(loginId || '').trim();
    if (!trimmed) {
        return getRandomStudentProfile();
    }

    const direct = await getStudentData(trimmed);
    if (direct.found && direct.student) {
        return direct;
    }

    const genericLogin = /^(student|demo|test|guest)$/i.test(trimmed);
    if (genericLogin || trimmed.length < 3) {
        return getRandomStudentProfile();
    }

    return getRandomStudentProfile();
}

const BOOSTER_GAWDZILLA_AGENT = 'booster-donor-data';

/**
 * Maps ESQL result columns/values to row objects.
 * @param {Object} result - ESQL API response
 * @returns {Array<Object>}
 */
function mapEsqlRows(result) {
    if (!result?.columns || !result?.values) return [];
    const columns = result.columns.map((c) => c.name);
    return result.values.map((row) => {
        const obj = {};
        columns.forEach((col, idx) => {
            obj[col] = row[idx];
        });
        return obj;
    });
}

/**
 * Aggregate booster donor portfolio stats from athletic-boosters (gawdzilla).
 * @param {string} [agentId] - Use 'booster-donor-data' for gawdzilla
 * @returns {Promise<{donorCount: number|null, avgAffinity: number|null, totalLifetimeGiving: number|null}>}
 */
export async function getBoosterDonorStats(agentId = BOOSTER_GAWDZILLA_AGENT) {
    const query = 'FROM athletic-boosters | STATS avg_affinity = AVG(affinity_score), total_lifetime = SUM(giving_history.lifetime_total), donor_count = COUNT(*) | LIMIT 1';
    try {
        const result = await fetchESQLQuery(query, {}, agentId);
        if (!result.columns || !result.values?.length) {
            return { donorCount: null, avgAffinity: null, totalLifetimeGiving: null };
        }
        const row = result.values[0];
        const idx = (name) => result.columns.findIndex((c) => c.name === name);
        return {
            avgAffinity: idx('avg_affinity') >= 0 ? Number(row[idx('avg_affinity')]) : null,
            totalLifetimeGiving: idx('total_lifetime') >= 0 ? Number(row[idx('total_lifetime')]) : null,
            donorCount: idx('donor_count') >= 0 ? Number(row[idx('donor_count')]) : null,
        };
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) {
            console.warn('athletic-boosters index not found (404).');
            return { donorCount: null, avgAffinity: null, totalLifetimeGiving: null };
        }
        throw error;
    }
}

/**
 * At-risk donors (low affinity or low email engagement) from athletic-boosters.
 * @param {string} [agentId]
 * @returns {Promise<Array<Object>>}
 */
export async function getBoosterAtRiskDonors(agentId = BOOSTER_GAWDZILLA_AGENT) {
    const query = `FROM athletic-boosters
| WHERE affinity_score < 40 OR engagement.email_open_rate_90d < 0.2
| SORT affinity_score ASC
| KEEP donor_id, first_name, last_name, affinity_score, giving_history.lifetime_total, engagement.email_open_rate_90d, giving_history.last_gift_date
| LIMIT 25`;
    try {
        const result = await fetchESQLQuery(query, {}, agentId);
        return mapEsqlRows(result);
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) return [];
        throw error;
    }
}

/**
 * At-risk major gift donors (lifetime >= $50k with declining engagement).
 * @param {string} [agentId]
 * @returns {Promise<Array<Object>>}
 */
export async function getBoosterAtRiskMajorGifts(agentId = BOOSTER_GAWDZILLA_AGENT) {
    const query = `FROM athletic-boosters
| WHERE giving_history.lifetime_total >= 50000 AND (affinity_score < 45 OR engagement.email_open_rate_90d < 0.15)
| SORT giving_history.lifetime_total DESC
| KEEP donor_id, first_name, last_name, affinity_score, giving_history.lifetime_total, giving_history.last_gift_date, engagement.email_open_rate_90d
| LIMIT 15`;
    try {
        const result = await fetchESQLQuery(query, {}, agentId);
        return mapEsqlRows(result);
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) return [];
        throw error;
    }
}

/**
 * Top affinity donors for athletic advancement intelligence.
 * @param {string} [agentId]
 * @returns {Promise<Array<Object>>}
 */
export async function getBoosterTopAffinityDonors(agentId = BOOSTER_GAWDZILLA_AGENT) {
    const query = `FROM athletic-boosters
| SORT affinity_score DESC
| KEEP donor_id, first_name, last_name, affinity_score, giving_history.lifetime_total, degree, graduation_year, wealth_signals.estimated_capacity
| LIMIT 10`;
    try {
        const result = await fetchESQLQuery(query, {}, agentId);
        return mapEsqlRows(result);
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) return [];
        throw error;
    }
}

/**
 * Engagement event breakdown from booster-engagement-events.
 * @param {string} [agentId]
 * @returns {Promise<Array<{event_type: string, events: number}>>}
 */
export async function getBoosterEngagementEventSummary(agentId = BOOSTER_GAWDZILLA_AGENT) {
    const query = 'FROM booster-engagement-events | STATS events = COUNT(*) BY event_type | SORT events DESC | LIMIT 8';
    try {
        const result = await fetchESQLQuery(query, {}, agentId);
        return mapEsqlRows(result);
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) return [];
        throw error;
    }
}

/**
 * At-risk case metrics from booster-case-metrics.
 * @param {string} [agentId]
 * @returns {Promise<Array<Object>>}
 */
export async function getBoosterCaseMetrics(agentId = BOOSTER_GAWDZILLA_AGENT) {
    const query = 'FROM booster-case-metrics | KEEP metric_type, count, severity, tags, @timestamp | LIMIT 20';
    try {
        const result = await fetchESQLQuery(query, {}, agentId);
        return mapEsqlRows(result);
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) return [];
        throw error;
    }
}

/**
 * Lookup a single donor by donor_id from athletic-boosters.
 * @param {string} donorId
 * @param {string} [agentId]
 * @returns {Promise<Object|null>}
 */
export async function getBoosterDonorById(donorId, agentId = BOOSTER_GAWDZILLA_AGENT) {
    if (!donorId || String(donorId).trim() === '') return null;
    const escaped = String(donorId).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const query = `FROM athletic-boosters | WHERE donor_id == "${escaped}" | KEEP donor_id, first_name, last_name, email, graduation_year, degree, location.city, location.state, giving_history.lifetime_total, giving_history.last_gift_date, engagement.email_open_rate_90d, engagement.game_attendance_count, engagement.events_attended_ytd, wealth_signals.iwave_score, wealth_signals.estimated_capacity, portfolio_status, affinity_score, bio_text | LIMIT 1`;
    try {
        const result = await fetchESQLQuery(query, {}, agentId);
        const rows = mapEsqlRows(result);
        return rows[0] ?? null;
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) return null;
        throw error;
    }
}

/**
 * Recent engagement events for a donor from booster-engagement-events.
 * @param {string} donorId
 * @param {string} [agentId]
 * @param {number} [limit]
 * @returns {Promise<Array<Object>>}
 */
export async function getBoosterDonorEngagementEvents(donorId, agentId = BOOSTER_GAWDZILLA_AGENT, limit = 8) {
    if (!donorId || String(donorId).trim() === '') return [];
    const escaped = String(donorId).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const query = `FROM booster-engagement-events | WHERE donor_id == "${escaped}" | SORT event_date DESC | KEEP event_type, event_date, event_category, event_label, campaign, signal_value, baseline_value, delta_from_baseline, fiscal_year | LIMIT ${Math.min(limit, 25)}`;
    try {
        const result = await fetchESQLQuery(query, {}, agentId);
        return mapEsqlRows(result);
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) return [];
        throw error;
    }
}

/**
 * Daily engagement timeline for a donor (email, attendance, login signals).
 * @param {string} donorId
 * @param {string} [agentId]
 * @param {string} [startDate] - ISO date lower bound
 * @param {number} [limit]
 * @returns {Promise<Array<Object>>}
 */
export async function getBoosterDonorEngagementTimeline(donorId, agentId = BOOSTER_GAWDZILLA_AGENT, startDate = '2024-03-01', limit = 10000) {
    if (!donorId || String(donorId).trim() === '') return [];
    const escaped = String(donorId).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const query = `FROM booster-engagement-events | WHERE donor_id == "${escaped}" AND event_date >= "${startDate}" | KEEP event_date, event_type, event_category, event_label, signal_value, baseline_value, delta_from_baseline, campaign | SORT event_date ASC | LIMIT ${Math.min(limit, 10000)}`;
    try {
        const result = await fetchESQLQuery(query, {}, agentId);
        return mapEsqlRows(result);
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) return [];
        throw error;
    }
}

const GAMEDAY_AGENT = 'gameday-revenue-data';

/**
 * Combined game-day revenue summary from Paciolan tickets + Square POS.
 * @param {string} [agentId]
 * @returns {Promise<{ticketScans: number|null, ticketRevenue: number|null, avgTicketPrice: number|null, posTransactions: number|null, posRevenue: number|null, avgPosTicket: number|null, combinedRevenue: number|null, resaleScans: number|null}>}
 */
export async function getGamedayRevenueSummary(agentId = GAMEDAY_AGENT) {
    const ticketQuery = 'FROM paciolan-ticket-events | STATS scans = COUNT(*), ticket_revenue = SUM(ticket_price), avg_price = AVG(ticket_price) | LIMIT 1';
    const retailQuery = 'FROM stadium-retail-sales | STATS txns = COUNT(*), retail_revenue = SUM(total_amount), units_sold = SUM(quantity), avg_txn = AVG(total_amount) | LIMIT 1';
    const resaleQuery = 'FROM paciolan-ticket-events | STATS resale = COUNT(*) WHERE is_resale == true | LIMIT 1';

    try {
        const [ticketResult, retailResult, resaleResult] = await Promise.all([
            fetchESQLQuery(ticketQuery, {}, agentId),
            fetchESQLQuery(retailQuery, {}, agentId),
            fetchESQLQuery(resaleQuery, {}, agentId),
        ]);

        const idx = (result, name) => result?.columns?.findIndex((c) => c.name === name) ?? -1;
        const val = (result, name) => {
            const i = idx(result, name);
            return i >= 0 && result?.values?.[0] ? Number(result.values[0][i]) : null;
        };

        const ticketRevenue = val(ticketResult, 'ticket_revenue');
        const retailRevenue = val(retailResult, 'retail_revenue');

        return {
            ticketScans: val(ticketResult, 'scans'),
            ticketRevenue,
            avgTicketPrice: val(ticketResult, 'avg_price'),
            retailTransactions: val(retailResult, 'txns'),
            retailRevenue,
            retailUnits: val(retailResult, 'units_sold'),
            avgRetailTicket: val(retailResult, 'avg_txn'),
            posTransactions: val(retailResult, 'txns'),
            posRevenue: retailRevenue,
            avgPosTicket: val(retailResult, 'avg_txn'),
            combinedRevenue: ticketRevenue != null && retailRevenue != null ? ticketRevenue + retailRevenue : null,
            resaleScans: val(resaleResult, 'resale'),
            catalogItemCount: 100,
        };
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) {
            return {
                ticketScans: null,
                ticketRevenue: null,
                avgTicketPrice: null,
                retailTransactions: null,
                retailRevenue: null,
                retailUnits: null,
                avgRetailTicket: null,
                posTransactions: null,
                posRevenue: null,
                avgPosTicket: null,
                combinedRevenue: null,
                resaleScans: null,
                catalogItemCount: 100,
            };
        }
        throw error;
    }
}

/** @param {string} [agentId] @returns {Promise<Array<Object>>} */
export async function getGamedayTicketRevenueByFanTier(agentId = GAMEDAY_AGENT) {
    const query = 'FROM paciolan-ticket-events | STATS revenue = SUM(ticket_price), scans = COUNT(*) BY fan_tier | SORT revenue DESC | LIMIT 10';
    try {
        const result = await fetchESQLQuery(query, {}, agentId);
        return mapEsqlRows(result);
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) return [];
        throw error;
    }
}

/** @param {string} [agentId] @returns {Promise<Array<Object>>} */
export async function getGamedayTicketRevenueByType(agentId = GAMEDAY_AGENT) {
    const query = 'FROM paciolan-ticket-events | STATS revenue = SUM(ticket_price), scans = COUNT(*) BY ticket_type | SORT revenue DESC | LIMIT 10';
    try {
        const result = await fetchESQLQuery(query, {}, agentId);
        return mapEsqlRows(result);
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) return [];
        throw error;
    }
}

/** @param {string} [agentId] @returns {Promise<Array<Object>>} */
export async function getGamedayGateTraffic(agentId = GAMEDAY_AGENT) {
    const query = 'FROM paciolan-ticket-events | STATS scans = COUNT(*), revenue = SUM(ticket_price) BY gate | SORT scans DESC | LIMIT 8';
    try {
        const result = await fetchESQLQuery(query, {}, agentId);
        return mapEsqlRows(result);
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) return [];
        throw error;
    }
}

/** @param {string} [agentId] @returns {Promise<Array<Object>>} */
export async function getGamedayRetailByCategory(agentId = GAMEDAY_AGENT) {
    const query = 'FROM stadium-retail-sales | STATS revenue = SUM(total_amount), units = SUM(quantity), txns = COUNT(*) BY category | SORT revenue DESC | LIMIT 10';
    try {
        const result = await fetchESQLQuery(query, {}, agentId);
        return mapEsqlRows(result);
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) return [];
        throw error;
    }
}

/** @param {string} [agentId] @returns {Promise<Array<Object>>} */
export async function getGamedayTopRetailItems(agentId = GAMEDAY_AGENT, limit = 15) {
    const query = `FROM stadium-retail-sales | STATS revenue = SUM(total_amount), units = SUM(quantity), txns = COUNT(*) BY sku, item_name, category | SORT revenue DESC | LIMIT ${Math.min(limit, 25)}`;
    try {
        const result = await fetchESQLQuery(query, {}, agentId);
        return mapEsqlRows(result);
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) return [];
        throw error;
    }
}

/** Full 100-item stadium retail catalog (campus bookstore / team store SKUs). @param {string} [agentId] */
export async function getGamedayRetailCatalog(agentId = GAMEDAY_AGENT) {
    const query = 'FROM stadium-retail-catalog | KEEP sku, item_name, category, subcategory, unit_price, available_stadium | SORT category ASC, item_name ASC | LIMIT 100';
    try {
        const result = await fetchESQLQuery(query, {}, agentId);
        return mapEsqlRows(result);
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) return [];
        throw error;
    }
}

/** @param {string} [agentId] @returns {Promise<Array<Object>>} */
export async function getGamedayRetailByLocation(agentId = GAMEDAY_AGENT) {
    const query = 'FROM stadium-retail-sales | STATS revenue = SUM(total_amount), units = SUM(quantity), txns = COUNT(*) BY location_name | SORT revenue DESC | LIMIT 8';
    try {
        const result = await fetchESQLQuery(query, {}, agentId);
        return mapEsqlRows(result);
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) return [];
        throw error;
    }
}

/** @deprecated Use getGamedayRetailByCategory — concessions index no longer used in dashboard */
export async function getGamedayPosRevenueByCategory(agentId = GAMEDAY_AGENT) {
    return getGamedayRetailByCategory(agentId);
}

/** @deprecated Use getGamedayRetailByLocation */
export async function getGamedayPosRevenueByZone(agentId = GAMEDAY_AGENT) {
    const query = 'FROM stadium-retail-sales | STATS revenue = SUM(total_amount), txns = COUNT(*) BY location_zone | SORT revenue DESC | LIMIT 8';
    try {
        const result = await fetchESQLQuery(query, {}, agentId);
        return mapEsqlRows(result);
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) return [];
        throw error;
    }
}

/** @deprecated Use getGamedayRetailByLocation */
export async function getGamedayTopConcessionStands(agentId = GAMEDAY_AGENT) {
    return getGamedayRetailByLocation(agentId);
}

/** @param {string} [agentId] @returns {Promise<Array<Object>>} */
export async function getGamedayHourlyGateScans(agentId = GAMEDAY_AGENT) {
    const query = 'FROM paciolan-ticket-events | EVAL hour = DATE_TRUNC(1 hour, scan_timestamp) | STATS scans = COUNT(*) BY hour | SORT hour ASC | LIMIT 24';
    try {
        const result = await fetchESQLQuery(query, {}, agentId);
        return mapEsqlRows(result);
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) return [];
        throw error;
    }
}

const OK_FRAUD_AGENT = 'ok-fraud';

async function runOkFraudEsql(query) {
    try {
        const result = await fetchESQLQuery(query, {}, OK_FRAUD_AGENT);
        return mapEsqlRows(result);
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) return null;
        throw error;
    }
}

/**
 * High-risk fraud claims count (Risk_Score >= 75).
 * @param {string} [agentId]
 * @returns {Promise<number|null>}
 */
export async function getFraudHighRiskClaimCount(agentId = OK_FRAUD_AGENT) {
    const query = 'FROM ok-fraud* | WHERE Risk_Score >= 75 | STATS high_risk = COUNT(*) | LIMIT 1';
    try {
        const result = await fetchESQLQuery(query, {}, agentId);
        if (!result?.values?.length) return null;
        const idx = result.columns.findIndex((c) => c.name === 'high_risk');
        return idx >= 0 ? Number(result.values[0][idx]) : null;
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) return null;
        throw error;
    }
}

/**
 * Loss totals grouped by Flag_Type.
 * @param {string} [agentId]
 * @param {number} [limit]
 * @returns {Promise<Array<{Flag_Type: string, total_loss: number}>>}
 */
export async function getFraudLossByFlagType(agentId = OK_FRAUD_AGENT, limit = 5) {
    const query = `FROM ok-fraud* | WHERE Flag_Type IS NOT NULL | STATS total_loss = SUM(Total_Loss_Value) BY Flag_Type | SORT total_loss DESC | LIMIT ${Math.min(limit, 20)}`;
    const rows = await runOkFraudEsql(query);
    return rows ?? [];
}

/**
 * Investigation resolution rate: share of flagged claims with an assigned investigator.
 * @param {string} [agentId]
 * @returns {Promise<number|null>} 0–100 percent
 */
export async function getFraudInvestigationResolutionRate(agentId = OK_FRAUD_AGENT) {
    const query = `FROM ok-fraud* | WHERE Flag_Type IS NOT NULL
| STATS total = COUNT(*), assigned = COUNT(Investigator_Assigned)
| EVAL resolution_pct = CASE(total > 0, assigned * 100.0 / total, null)
| LIMIT 1`;
    try {
        const result = await fetchESQLQuery(query, {}, agentId);
        if (!result?.values?.length) return null;
        const idx = result.columns.findIndex((c) => c.name === 'resolution_pct');
        const val = idx >= 0 ? Number(result.values[0][idx]) : null;
        return Number.isFinite(val) ? Math.round(val) : null;
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) return null;
        throw error;
    }
}

/**
 * Crisis call center KPIs from ok-* indices.
 * @param {string} [agentId]
 * @returns {Promise<{avgAnswerSeconds: number|null, totalCalls: number|null, avgMcotSeconds: number|null}>}
 */
export async function getCrisisCallCenterStats(agentId = OK_FRAUD_AGENT) {
    const answerQuery = `FROM ok-* | WHERE Call_Start_Timestamp IS NOT NULL AND Call_Answer_Timestamp IS NOT NULL
| EVAL answer_seconds = DATE_DIFF("s", Call_Start_Timestamp, Call_Answer_Timestamp)
| STATS avg_answer = AVG(answer_seconds), calls = COUNT(*)
| LIMIT 1`;
    const mcotQuery = `FROM ok-* | WHERE Arrival_Timestamp IS NOT NULL AND Dispatch_Timestamp IS NOT NULL
| EVAL mcot_seconds = DATE_DIFF("s", Dispatch_Timestamp, Arrival_Timestamp)
| STATS avg_mcot = AVG(mcot_seconds)
| LIMIT 1`;
    try {
        const [answerResult, mcotResult] = await Promise.all([
            fetchESQLQuery(answerQuery, {}, agentId),
            fetchESQLQuery(mcotQuery, {}, agentId),
        ]);
        const aIdx = answerResult.columns?.findIndex((c) => c.name === 'avg_answer') ?? -1;
        const cIdx = answerResult.columns?.findIndex((c) => c.name === 'calls') ?? -1;
        const mIdx = mcotResult.columns?.findIndex((c) => c.name === 'avg_mcot') ?? -1;
        return {
            avgAnswerSeconds: aIdx >= 0 ? Number(answerResult.values?.[0]?.[aIdx]) : null,
            totalCalls: cIdx >= 0 ? Number(answerResult.values?.[0]?.[cIdx]) : null,
            avgMcotSeconds: mIdx >= 0 ? Number(mcotResult.values?.[0]?.[mIdx]) : null,
        };
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) {
            return { avgAnswerSeconds: null, totalCalls: null, avgMcotSeconds: null };
        }
        throw error;
    }
}

/**
 * Call disposition breakdown for crisis operations.
 * @param {string} [agentId]
 * @param {number} [limit]
 * @returns {Promise<Array<{Call_Disposition_Code: string, cnt: number}>>}
 */
export async function getCrisisCallDispositions(agentId = OK_FRAUD_AGENT, limit = 8) {
    const query = `FROM ok-* | WHERE Call_Disposition_Code IS NOT NULL | STATS cnt = COUNT(*) BY Call_Disposition_Code | SORT cnt DESC | LIMIT ${Math.min(limit, 20)}`;
    const rows = await runOkFraudEsql(query);
    return rows ?? [];
}

/**
 * MCOT outcome breakdown.
 * @param {string} [agentId]
 * @param {number} [limit]
 * @returns {Promise<Array<{MCOT_Outcome_Code: string, cnt: number}>>}
 */
export async function getCrisisMcotOutcomes(agentId = OK_FRAUD_AGENT, limit = 8) {
    const query = `FROM ok-* | WHERE MCOT_Outcome_Code IS NOT NULL | STATS cnt = COUNT(*) BY MCOT_Outcome_Code | SORT cnt DESC | LIMIT ${Math.min(limit, 20)}`;
    const rows = await runOkFraudEsql(query);
    return rows ?? [];
}

/**
 * Discharge housing status breakdown.
 * @param {string} [agentId]
 * @param {number} [limit]
 * @returns {Promise<Array<{Discharge_Housing_Status: string, cnt: number}>>}
 */
export async function getCrisisHousingAtDischarge(agentId = OK_FRAUD_AGENT, limit = 8) {
    const query = `FROM ok-* | WHERE Discharge_Housing_Status IS NOT NULL | STATS cnt = COUNT(*) BY Discharge_Housing_Status | SORT cnt DESC | LIMIT ${Math.min(limit, 20)}`;
    const rows = await runOkFraudEsql(query);
    return rows ?? [];
}

/**
 * Statewide relapse rate from ok-* client outcome records.
 * @param {string} [agentId]
 * @returns {Promise<number|null>} 0–100 percent
 */
export async function getClinicalStatewideRelapseRate(agentId = OK_FRAUD_AGENT) {
    const query = `FROM ok-* | WHERE Relapse_Occurred IS NOT NULL
| STATS relapse_rate = AVG(CASE(Relapse_Occurred == true, 1.0, 0.0))
| LIMIT 1`;
    try {
        const result = await fetchESQLQuery(query, {}, agentId);
        if (!result?.values?.length) return null;
        const idx = result.columns.findIndex((c) => c.name === 'relapse_rate');
        const val = idx >= 0 ? Number(result.values[0][idx]) : null;
        return Number.isFinite(val) ? Math.round(val * 100) : null;
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) return null;
        throw error;
    }
}

/**
 * Relapse rate by county (top counties by rate).
 * @param {string} [agentId]
 * @param {number} [limit]
 * @returns {Promise<Array<{County_Of_Relapse: string, relapse_rate: number}>>}
 */
export async function getClinicalRelapseByCounty(agentId = OK_FRAUD_AGENT, limit = 10) {
    const query = `FROM ok-* | WHERE County_Of_Relapse IS NOT NULL
| STATS relapse_rate = AVG(CASE(Relapse_Occurred == true, 1.0, 0.0)) BY County_Of_Relapse
| SORT relapse_rate DESC
| LIMIT ${Math.min(limit, 25)}`;
    const rows = await runOkFraudEsql(query);
    return rows ?? [];
}

/**
 * Primary substance breakdown from ok-client.
 * @param {string} [agentId]
 * @param {number} [limit]
 * @returns {Promise<Array<{primary_substance: string, cnt: number}>>}
 */
export async function getClinicalSubstanceBreakdown(agentId = OK_FRAUD_AGENT, limit = 10) {
    const query = `FROM ok-client | WHERE primary_substance IS NOT NULL | STATS cnt = COUNT(*) BY primary_substance | SORT cnt DESC | LIMIT ${Math.min(limit, 20)}`;
    const rows = await runOkFraudEsql(query);
    return rows ?? [];
}

/**
 * Active client count from ok-client.
 * @param {string} [agentId]
 * @returns {Promise<number|null>}
 */
export async function getClinicalActiveClientCount(agentId = OK_FRAUD_AGENT) {
    const query = 'FROM ok-client | WHERE status == "Active" | STATS active = COUNT(*) | LIMIT 1';
    try {
        const result = await fetchESQLQuery(query, {}, agentId);
        if (!result?.values?.length) return null;
        const idx = result.columns.findIndex((c) => c.name === 'active');
        return idx >= 0 ? Number(result.values[0][idx]) : null;
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) return null;
        throw error;
    }
}

/**
 * Client rows for clinical outcomes table.
 * @param {string} [agentId]
 * @param {number} [limit]
 * @returns {Promise<Array<Object>>}
 */
export async function getClinicalClientList(agentId = OK_FRAUD_AGENT, limit = 25) {
    const query = `FROM ok-client
| KEEP Client_ID, Name, county, primary_substance, status, @timestamp
| SORT @timestamp DESC
| LIMIT ${Math.min(limit, 100)}`;
    const rows = await runOkFraudEsql(query);
    return rows ?? [];
}

/**
 * Client detail and outcome history.
 * @param {string} clientId
 * @param {string} [agentId]
 * @returns {Promise<{profile: Object|null, outcomes: Array<Object>}>}
 */
export async function getClinicalClientDetail(clientId, agentId = OK_FRAUD_AGENT) {
    if (!clientId || String(clientId).trim() === '') {
        return { profile: null, outcomes: [] };
    }
    const escaped = String(clientId).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const profileQuery = `FROM ok-client | WHERE Client_ID == "${escaped}" | LIMIT 1`;
    const outcomesQuery = `FROM ok-* | WHERE Client_ID == "${escaped}" AND Relapse_Occurred IS NOT NULL
| KEEP @timestamp, Client_ID, County_Of_Relapse, Relapse_Occurred, primary_substance, status
| SORT @timestamp DESC
| LIMIT 50`;
    try {
        const [profileResult, outcomesResult] = await Promise.all([
            fetchESQLQuery(profileQuery, {}, agentId),
            fetchESQLQuery(outcomesQuery, {}, agentId),
        ]);
        const profileRows = mapEsqlRows(profileResult);
        return {
            profile: profileRows[0] ?? null,
            outcomes: mapEsqlRows(outcomesResult),
        };
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) {
            return { profile: null, outcomes: [] };
        }
        throw error;
    }
}

/**
 * Grant portfolio stats for health-focused programs (ok-grant-data).
 * @param {Object} [template]
 * @returns {Promise<{active: number|null, forecasted: number|null, closed: number|null, total: number|null}>}
 */
export async function getOkGrantPortfolioStats(template) {
    const elastic = template?.elastic || {};
    const index = elastic.grantsDataIndex || 'ok-grant-data';
    const agentId = elastic.grantsDataAgentId || OK_FRAUD_AGENT;
    const query = `FROM ${index} | STATS total = COUNT(*), active = COUNT(CASE(status == "active", 1, null)), forecasted = COUNT(CASE(status == "forecasted", 1, null)), closed = COUNT(CASE(status == "closed", 1, null)) | LIMIT 1`;
    try {
        const result = await fetchESQLQuery(query, {}, agentId);
        if (!result?.values?.length) {
            return { active: null, forecasted: null, closed: null, total: null };
        }
        const row = result.values[0];
        const idx = (name) => result.columns.findIndex((c) => c.name === name);
        return {
            total: idx('total') >= 0 ? Number(row[idx('total')]) : null,
            active: idx('active') >= 0 ? Number(row[idx('active')]) : null,
            forecasted: idx('forecasted') >= 0 ? Number(row[idx('forecasted')]) : null,
            closed: idx('closed') >= 0 ? Number(row[idx('closed')]) : null,
        };
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) {
            return { active: null, forecasted: null, closed: null, total: null };
        }
        throw error;
    }
}

/**
 * Active health-category grant count (catalog fallback when index fields differ).
 * @param {Object} [template]
 * @returns {Promise<number|null>}
 */
export async function getOkHealthGrantCount(template) {
    const stats = await getOkGrantPortfolioStats(template);
    if (stats.active != null) return stats.active;
    const catalog = template?.grantsCatalog || [];
    return catalog.filter((g) => g.status === 'active' && g.category === 'health').length;
}
