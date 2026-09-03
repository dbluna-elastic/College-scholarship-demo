/**
 * Wyoming data classification ES|QL helpers (wyo-classified-*, wyo-public-share, wyo-spillage-alerts).
 */

import { fetchESQLQuery } from './elasticApi.js';

export const WYO_CLASSIFY_ES_AGENT = 'wyo-classify';

const CORPUS_FROM = 'FROM wyo-classified-*, wyo-public-share';

/**
 * @param {Object} result
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
 * @param {string} query
 * @returns {Promise<Array<Object>>}
 */
async function runWyoEsql(query) {
    try {
        const result = await fetchESQLQuery(query, {}, WYO_CLASSIFY_ES_AGENT);
        return mapEsqlRows(result);
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) return [];
        const details = String(error.errorDetails || error.message || '');
        if (/unknown index|no such index|index_not_found/i.test(details)) return [];
        throw error;
    }
}

/**
 * @returns {Promise<{totalDocs: number|null, restricted: number|null, pendingReview: number|null, spillageAlerts: number|null}>}
 */
export async function getWyoOverviewStats() {
    const [totalRows, restrictedRows, pendingRows, alertRows] = await Promise.all([
        runWyoEsql(`${CORPUS_FROM} | STATS total_docs = COUNT(*) | LIMIT 1`),
        runWyoEsql(`${CORPUS_FROM} | WHERE classification.level == "restricted" | STATS restricted = COUNT(*) | LIMIT 1`),
        runWyoEsql(`${CORPUS_FROM} | WHERE classification.review.status == "pending" | STATS pending_review = COUNT(*) | LIMIT 1`),
        runWyoEsql('FROM wyo-spillage-alerts | STATS spillage_alerts = COUNT(*) | LIMIT 1'),
    ]);

    const total = totalRows[0] || {};
    const restricted = restrictedRows[0] || {};
    const pending = pendingRows[0] || {};
    const alerts = alertRows[0] || {};

    return {
        totalDocs: total.total_docs != null ? Number(total.total_docs) : null,
        restricted: restricted.restricted != null ? Number(restricted.restricted) : null,
        pendingReview: pending.pending_review != null ? Number(pending.pending_review) : null,
        spillageAlerts: alerts.spillage_alerts != null ? Number(alerts.spillage_alerts) : null,
    };
}

/**
 * @returns {Promise<Array<{level: string, count: number}>>}
 */
export async function getWyoCountsByLevel() {
    const rows = await runWyoEsql(
        `${CORPUS_FROM} | STATS count = COUNT(*) BY classification.level | SORT count DESC`
    );
    return rows.map((row) => ({
        level: row['classification.level'] || row.level || 'unknown',
        count: row.count != null ? Number(row.count) : 0,
    }));
}

/**
 * @param {number} [limit]
 * @returns {Promise<Array<Object>>}
 */
export async function getWyoPendingQueue(limit = 20) {
    const size = Math.min(Math.max(limit, 1), 50);
    const rows = await runWyoEsql(
        `${CORPUS_FROM}`
        + ' | WHERE classification.review.status == "pending"'
        + ' | SORT classification.confidence ASC'
        + ' | KEEP file.name, data.owner_agency, classification.level, classification.confidence, classification.categories, data.storage_zone'
        + ` | LIMIT ${size}`
    );
    return rows.map((row) => ({
        fileName: row['file.name'] || row.file_name || '—',
        agency: row['data.owner_agency'] || row.owner_agency || '—',
        level: row['classification.level'] || row.level || 'unknown',
        confidence: row['classification.confidence'] != null ? Number(row['classification.confidence']) : null,
        categories: row['classification.categories'] || row.categories || [],
        zone: row['data.storage_zone'] || row.storage_zone || '—',
    }));
}

/**
 * @returns {Promise<Array<{agency: string, count: number}>>}
 */
export async function getWyoCountsByAgency() {
    const rows = await runWyoEsql(
        `${CORPUS_FROM} | STATS count = COUNT(*) BY data.owner_agency | SORT count DESC | LIMIT 15`
    );
    return rows.map((row) => ({
        agency: row['data.owner_agency'] || row.owner_agency || 'unknown',
        count: row.count != null ? Number(row.count) : 0,
    }));
}

/**
 * @param {number} [limit]
 * @returns {Promise<Array<Object>>}
 */
export async function getWyoPublicShareSpillage(limit = 10) {
    const size = Math.min(Math.max(limit, 1), 20);
    const rows = await runWyoEsql(
        'FROM wyo-public-share'
        + ' | WHERE classification.level == "restricted"'
        + ' | KEEP file.name, data.owner_agency, classification.level, data.storage_zone, classification.categories'
        + ` | LIMIT ${size}`
    );
    return rows.map((row) => ({
        fileName: row['file.name'] || row.file_name || '—',
        agency: row['data.owner_agency'] || row.owner_agency || '—',
        level: row['classification.level'] || row.level || 'restricted',
        zone: row['data.storage_zone'] || row.storage_zone || 'public_share',
        categories: row['classification.categories'] || row.categories || [],
    }));
}
