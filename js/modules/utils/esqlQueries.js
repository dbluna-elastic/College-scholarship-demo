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

import { fetchElasticsearchSearch, fetchElasticsearchUpdate, fetchESQLQuery } from './elasticApi.js';

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
