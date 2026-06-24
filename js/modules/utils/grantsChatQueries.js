/**
 * Targeted ok-grant-data lookups for Carey Grant Bot fast path.
 * Uses gawdzilla ES (_search) via ok-fraud proxy; falls back to template catalog.
 */

import { fetchElasticsearchSearchWithAgent } from './elasticApi.js';
import { getOkGrantDataCatalog, mapElasticsearchGrantHitToRow } from './esqlQueries.js';

const CHAT_CATALOG_SIZE = 500;
const CACHE_TTL_MS = 5 * 60 * 1000;

/** @type {{ rows: Array<Object>|null, fetchedAt: number, cacheKey: string }} */
let catalogCache = { rows: null, fetchedAt: 0, cacheKey: '' };

/**
 * @returns {Object}
 */
function getTemplateConfig() {
    if (typeof window !== 'undefined' && window.currentTemplate) {
        return window.currentTemplate;
    }
    return {
        elastic: {
            grantsDataIndex: 'ok-grant-data',
            grantsDataAgentId: 'ok-fraud',
        },
        grantsCatalog: [],
    };
}

/**
 * @param {Object} template
 * @returns {string}
 */
function catalogCacheKey(template) {
    const elastic = template?.elastic || {};
    return `${elastic.grantsDataIndex || 'ok-grant-data'}|${elastic.grantsDataAgentId || 'ok-fraud'}`;
}

/**
 * Load grant rows for chat (cached, larger page size than UI search).
 * @param {Object} [template]
 * @returns {Promise<Array<Object>>}
 */
export async function getOkGrantsCatalogForChat(template = getTemplateConfig()) {
    const key = catalogCacheKey(template);
    if (
        catalogCache.rows
        && catalogCache.cacheKey === key
        && Date.now() - catalogCache.fetchedAt < CACHE_TTL_MS
    ) {
        return catalogCache.rows;
    }

    const elastic = { ...(template.elastic || {}), grantsSearchSize: CHAT_CATALOG_SIZE };
    let rows = await getOkGrantDataCatalog({ ...template, elastic });
    if (!rows.length && Array.isArray(template.grantsCatalog) && template.grantsCatalog.length) {
        rows = template.grantsCatalog;
    }

    catalogCache = { rows, fetchedAt: Date.now(), cacheKey: key };
    return rows;
}

/**
 * @param {Array<Object>} rows
 * @returns {{ total: number, active: number, forecasted: number, closed: number, withMatch: number, loans: number }}
 */
export function summarizeGrantRows(rows) {
    const stats = {
        total: rows.length,
        active: 0,
        forecasted: 0,
        closed: 0,
        withMatch: 0,
        loans: 0,
    };

    for (const row of rows) {
        if (row.status === 'active') stats.active += 1;
        else if (row.status === 'forecasted') stats.forecasted += 1;
        else if (row.status === 'closed') stats.closed += 1;
        if (row.matchRequired) stats.withMatch += 1;
        if (row.isLoan) stats.loans += 1;
    }

    return stats;
}

/**
 * @param {Array<Object>} rows
 * @param {Object} filters
 * @returns {Array<Object>}
 */
export function filterGrantRows(rows, filters = {}) {
    let result = rows;

    if (filters.status) {
        result = result.filter((row) => row.status === filters.status);
    }

    if (filters.category) {
        const cat = String(filters.category).toLowerCase();
        result = result.filter((row) => String(row.category || '').toLowerCase() === cat);
    }

    if (filters.agency) {
        const agency = String(filters.agency).toLowerCase();
        result = result.filter((row) => String(row.agency || '').toLowerCase() === agency);
    }

    if (filters.eligibleApplicant) {
        const app = String(filters.eligibleApplicant).toLowerCase();
        result = result.filter((row) => String(row.eligibleApplicant || '').toLowerCase() === app);
    }

    if (filters.excludeLoans) {
        result = result.filter((row) => !row.isLoan);
    }

    if (filters.noMatchRequired) {
        result = result.filter((row) => !row.matchRequired);
    }

    if (filters.keyword) {
        const terms = String(filters.keyword).toLowerCase().split(/\s+/).filter(Boolean);
        result = result.filter((row) => {
            const haystack = [
                row.title,
                row.description,
                row.agency,
                row.category,
                row.eligibleApplicant,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return terms.every((term) => haystack.includes(term));
        });
    }

    if (filters.upcomingDeadlines) {
        const now = Date.now();
        result = result
            .filter((row) => row.deadline && row.status !== 'closed')
            .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
            .filter((row) => {
                const t = new Date(row.deadline).getTime();
                return !Number.isNaN(t) && t >= now;
            });
    }

    return result;
}

/**
 * Keyword search against ok-grant-data (falls back to catalog filter).
 * @param {string} keyword
 * @param {Object} [template]
 * @param {number} [size=8]
 * @returns {Promise<Array<Object>>}
 */
export async function searchOkGrantsChat(keyword, template = getTemplateConfig(), size = 8) {
    const elastic = template.elastic || {};
    const index = elastic.grantsDataIndex || 'ok-grant-data';
    const agentId = elastic.grantsDataAgentId || 'ok-fraud';
    const trimmed = String(keyword || '').trim();
    if (!trimmed) return [];

    const queryBody = {
        query: {
            multi_match: {
                query: trimmed,
                fields: [
                    'Grant_Title^3',
                    'grant_title^3',
                    'Title^3',
                    'title^3',
                    'Purpose',
                    'Description',
                    'description',
                    'grant_details',
                    'Category',
                    'category',
                    'State_Agency',
                    'state_agency',
                    'Agency',
                    'agency',
                ],
                type: 'best_fields',
                fuzziness: 'AUTO',
            },
        },
        size,
    };

    try {
        const result = await fetchElasticsearchSearchWithAgent(index, queryBody, agentId);
        const hits = result.hits?.hits || [];
        if (hits.length) {
            return hits.map((hit) => mapElasticsearchGrantHitToRow(hit));
        }
    } catch (error) {
        if (!error.isIndexNotFound && error.status !== 404) {
            console.warn('searchOkGrantsChat ES failed, using catalog filter:', error.message);
        }
    }

    const catalog = await getOkGrantsCatalogForChat(template);
    return filterGrantRows(catalog, { keyword: trimmed }).slice(0, size);
}

/**
 * @param {string} grantId
 * @param {Object} [template]
 * @returns {Promise<Object|null>}
 */
export async function getOkGrantByIdChat(grantId, template = getTemplateConfig()) {
    const id = String(grantId || '').trim();
    if (!id) return null;

    const catalog = await getOkGrantsCatalogForChat(template);
    const local = catalog.find((row) => String(row.id).toLowerCase() === id.toLowerCase());
    if (local) return local;

    const elastic = template.elastic || {};
    const index = elastic.grantsDataIndex || 'ok-grant-data';
    const agentId = elastic.grantsDataAgentId || 'ok-fraud';

    const queryBody = {
        query: {
            bool: {
                should: [
                    { ids: { values: [id] } },
                    { term: { Portal_ID: id } },
                    { term: { portal_id: id } },
                    { term: { Grant_Program_ID: id } },
                    { term: { grant_program_id: id } },
                    { term: { id } },
                    { term: { grant_id: id } },
                ],
                minimum_should_match: 1,
            },
        },
        size: 1,
    };

    try {
        const result = await fetchElasticsearchSearchWithAgent(index, queryBody, agentId);
        const hit = result.hits?.hits?.[0];
        return hit ? mapElasticsearchGrantHitToRow(hit) : null;
    } catch (error) {
        console.warn('getOkGrantByIdChat failed:', error.message);
        return null;
    }
}
