/**
 * OJA juvenile justice ESQL helpers (youth_profiles, case_notes, assessments, outcomes).
 */

import { fetchESQLQuery } from './elasticApi.js';

export const OJA_AGENT = 'ok-oja-data';

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

async function runOjaEsql(query) {
    try {
        const result = await fetchESQLQuery(query, {}, OJA_AGENT);
        return mapEsqlRows(result);
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) return [];
        throw error;
    }
}

/** @returns {Promise<{activeYouth: number|null, pendingYouth: number|null, avgRisk: number|null, recidivism12mo: number|null}>} */
export async function getOjaOverviewStats() {
    const youthRows = await runOjaEsql(`FROM youth_profiles | STATS active_youth = COUNT(*) WHERE case_status == "Active", pending_youth = COUNT(*) WHERE case_status == "Pending" | LIMIT 1`);

    const riskRows = await runOjaEsql(`FROM assessments | STATS avg_risk = AVG(overall_risk_score) | LIMIT 1`);
    const recidRows = await runOjaEsql(
        'FROM outcomes | EVAL recid_flag = CASE(recidivism_12mo == true, 1, 0) | STATS recid_12 = AVG(recid_flag) | LIMIT 1'
    );

    const y = youthRows[0] || {};
    const r = riskRows[0] || {};
    const o = recidRows[0] || {};

    return {
        activeYouth: y.active_youth != null ? Number(y.active_youth) : null,
        pendingYouth: y.pending_youth != null ? Number(y.pending_youth) : null,
        avgRisk: r.avg_risk != null ? Number(r.avg_risk) : null,
        recidivism12mo: o.recid_12 != null ? Number(o.recid_12) : null,
    };
}

/** @returns {Promise<Array<Object>>} */
export async function getOjaHighPriorityYouth(limit = 15) {
    const query = `FROM youth_profiles
| WHERE case_status IN ("Active", "Pending") AND supervision_level IN ("Intensive", "Moderate")
| SORT intake_date DESC
| KEEP youth_id, first_name, last_name, case_status, supervision_level, primary_offense, county, assigned_officer, mental_health_flag, substance_abuse_flag
| LIMIT ${Math.min(limit, 25)}`;
    return runOjaEsql(query);
}

/** @returns {Promise<Array<Object>>} */
export async function getOjaHighRiskYouth(limit = 10) {
    const query = `FROM assessments
| WHERE risk_level IN ("High", "Very High", "Moderate")
| SORT overall_risk_score DESC
| KEEP youth_id, assessment_type, assessment_date, overall_risk_score, risk_level, recommended_supervision
| LIMIT ${Math.min(limit, 20)}`;
    return runOjaEsql(query);
}

/** @returns {Promise<Array<Object>>} */
export async function getOjaRecentCaseNotes(limit = 8) {
    const query = `FROM case_notes
| WHERE follow_up_required == true OR sentiment IN ("Negative", "Concerning")
| SORT note_date DESC
| KEEP note_id, youth_id, note_date, note_type, subject, sentiment, author, follow_up_required
| LIMIT ${Math.min(limit, 15)}`;
    return runOjaEsql(query);
}

/** @param {string} youthId @returns {Promise<Object|null>} */
export async function getOjaYouthById(youthId) {
    if (!youthId) return null;
    const escaped = String(youthId).replace(/"/g, '\\"');
    const rows = await runOjaEsql(`FROM youth_profiles | WHERE youth_id == "${escaped}" | LIMIT 1`);
    return rows[0] || null;
}

/** @param {string} youthId @returns {Promise<Array<Object>>} */
export async function getOjaYouthNotes(youthId, limit = 10) {
    if (!youthId) return [];
    const escaped = String(youthId).replace(/"/g, '\\"');
    return runOjaEsql(`FROM case_notes | WHERE youth_id == "${escaped}" | SORT note_date DESC | LIMIT ${limit}`);
}

/** @param {string} youthId @returns {Promise<Array<Object>>} */
export async function getOjaYouthAssessments(youthId, limit = 5) {
    if (!youthId) return [];
    const escaped = String(youthId).replace(/"/g, '\\"');
    return runOjaEsql(`FROM assessments | WHERE youth_id == "${escaped}" | SORT assessment_date DESC | LIMIT ${limit}`);
}

/** @param {string} youthId @returns {Promise<Object|null>} */
export async function getOjaYouthOutcome(youthId) {
    if (!youthId) return null;
    const escaped = String(youthId).replace(/"/g, '\\"');
    const rows = await runOjaEsql(`FROM outcomes | WHERE youth_id == "${escaped}" | SORT discharge_date DESC | LIMIT 1`);
    return rows[0] || null;
}

/** @returns {Promise<Array<Object>>} */
export async function getOjaCountyBreakdown(limit = 10) {
    const query = `FROM youth_profiles
| WHERE case_status == "Active"
| STATS caseload = COUNT(*) BY county
| SORT caseload DESC
| LIMIT ${limit}`;
    return runOjaEsql(query);
}
