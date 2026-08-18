/**
 * Game Day Revenue ESQL helpers — paciolan tickets + stadium retail catalog/sales.
 */

import { fetchESQLQuery } from './elasticApi.js';

export const GAMEDAY_AGENT = 'gameday-revenue-data';

export {
    getGamedayRevenueSummary,
    getGamedayTicketRevenueByFanTier,
    getGamedayTicketRevenueByType,
    getGamedayGateTraffic,
    getGamedayRetailByCategory,
    getGamedayTopRetailItems,
    getGamedayRetailCatalog,
    getGamedayRetailByLocation,
    getGamedayHourlyGateScans,
} from './esqlQueries.js';

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
 * @param {string} [agentId]
 * @returns {Promise<Array<Object>>}
 */
async function runGamedayEsql(query, agentId = GAMEDAY_AGENT) {
    try {
        const result = await fetchESQLQuery(query, {}, agentId);
        return mapEsqlRows(result);
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) return [];
        throw error;
    }
}

/**
 * Bulk or high-value team store sales (typical gameday tickets are 1–2 units).
 * @param {string} [agentId]
 * @returns {Promise<Array<Object>>}
 */
export async function getGamedayUnusualPurchases(agentId = GAMEDAY_AGENT) {
    return runGamedayEsql(
        'FROM stadium-retail-sales '
        + '| WHERE quantity >= 3 OR total_amount >= 150 '
        + '| KEEP sku, item_name, category, location_name, quantity, unit_price, total_amount, transaction_time '
        + '| SORT total_amount DESC | LIMIT 20',
        agentId,
    );
}

/**
 * Paciolan resale ticket scans by fan tier and gate.
 * @param {string} [agentId]
 * @returns {Promise<Array<Object>>}
 */
export async function getGamedayResaleActivity(agentId = GAMEDAY_AGENT) {
    return runGamedayEsql(
        'FROM paciolan-ticket-events | WHERE is_resale == true '
        + '| STATS resale_scans = COUNT(*), resale_revenue = SUM(ticket_price) BY fan_tier, gate '
        + '| SORT resale_scans DESC | LIMIT 12',
        agentId,
    );
}
