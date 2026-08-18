/**
 * Oklahoma State Game Day ESQL helpers — Boone Pickens tickets + Square POS.
 */

import { fetchESQLQuery } from './elasticApi.js';

export const OKSTATE_GAMEDAY_AGENT = 'okstate-gameday-revenue-assistant';
export const OKSTATE_TICKET_INDEX = 'okstate-paciolan-ticket-events';
export const OKSTATE_POS_INDEX = 'okstate-square-pos-transactions';
export const OKSTATE_GAME_ID = 'OKSTATE-2025-HOME-01';
export const OKSTATE_ANOMALY_STAND_IDS = ['S04', 'S06', 'S09'];
export const OKSTATE_ANOMALY_START = '2025-09-06T15:50:00Z';
export const OKSTATE_ANOMALY_END = '2025-09-06T16:05:00Z';

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
async function runOkstateGamedayEsql(query, agentId = OKSTATE_GAMEDAY_AGENT) {
    try {
        const result = await fetchESQLQuery(query, {}, agentId);
        return mapEsqlRows(result);
    } catch (error) {
        if (error.isIndexNotFound || error.status === 404) return [];
        throw error;
    }
}

function firstRow(rows) {
    return rows?.[0] || null;
}

function num(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

/**
 * Combined ticket + POS gameday summary.
 * @param {string} [agentId]
 * @returns {Promise<{ticketScans: number|null, ticketRevenue: number|null, avgTicketPrice: number|null, resaleScans: number|null, posTransactions: number|null, posRevenue: number|null, posUnits: number|null, avgPosSale: number|null, combinedRevenue: number|null}>}
 */
export async function getOkstateGamedaySummary(agentId = OKSTATE_GAMEDAY_AGENT) {
    const [ticketRows, posRows] = await Promise.all([
        runOkstateGamedayEsql(
            `FROM ${OKSTATE_TICKET_INDEX} | STATS ticket_scans = COUNT(*), ticket_revenue = SUM(ticket_price), avg_ticket = AVG(ticket_price), resale_scans = COUNT(*) WHERE is_resale == true | LIMIT 1`,
            agentId,
        ),
        runOkstateGamedayEsql(
            `FROM ${OKSTATE_POS_INDEX} | STATS txns = COUNT(*), pos_revenue = SUM(total_amount), units_sold = SUM(quantity), avg_sale = AVG(total_amount) | LIMIT 1`,
            agentId,
        ),
    ]);
    const ticket = firstRow(ticketRows) || {};
    const pos = firstRow(posRows) || {};
    const ticketRevenue = num(ticket.ticket_revenue);
    const posRevenue = num(pos.pos_revenue);
    return {
        ticketScans: num(ticket.ticket_scans),
        ticketRevenue,
        avgTicketPrice: num(ticket.avg_ticket),
        resaleScans: num(ticket.resale_scans),
        posTransactions: num(pos.txns),
        posRevenue,
        posUnits: num(pos.units_sold),
        avgPosSale: num(pos.avg_sale),
        combinedRevenue: ticketRevenue != null && posRevenue != null ? ticketRevenue + posRevenue : null,
    };
}

/**
 * @param {string} [agentId]
 * @returns {Promise<Array<Object>>}
 */
export async function getOkstatePosByStand(agentId = OKSTATE_GAMEDAY_AGENT) {
    return runOkstateGamedayEsql(
        `FROM ${OKSTATE_POS_INDEX} | STATS revenue = SUM(total_amount), txns = COUNT(*) BY stand_id, stand_name, stand_zone | SORT revenue DESC | LIMIT 15`,
        agentId,
    );
}

/**
 * @param {string} [agentId]
 * @returns {Promise<Array<Object>>}
 */
export async function getOkstatePosByCategory(agentId = OKSTATE_GAMEDAY_AGENT) {
    return runOkstateGamedayEsql(
        `FROM ${OKSTATE_POS_INDEX} | STATS revenue = SUM(total_amount), txns = COUNT(*) BY category | SORT revenue DESC | LIMIT 12`,
        agentId,
    );
}

/**
 * @param {string} [agentId]
 * @returns {Promise<Array<Object>>}
 */
export async function getOkstatePosByZone(agentId = OKSTATE_GAMEDAY_AGENT) {
    return runOkstateGamedayEsql(
        `FROM ${OKSTATE_POS_INDEX} | STATS revenue = SUM(total_amount), txns = COUNT(*) BY stand_zone | SORT revenue DESC | LIMIT 10`,
        agentId,
    );
}

/**
 * @param {string} [agentId]
 * @returns {Promise<Array<Object>>}
 */
export async function getOkstateTopStands(agentId = OKSTATE_GAMEDAY_AGENT) {
    return runOkstateGamedayEsql(
        `FROM ${OKSTATE_POS_INDEX} | STATS revenue = SUM(total_amount), txns = COUNT(*) BY stand_id, stand_name, stand_zone | SORT revenue DESC | LIMIT 10`,
        agentId,
    );
}

/**
 * POS activity for anomaly stands during the payment-processor outage window.
 * @param {string} [agentId]
 * @returns {Promise<Array<Object>>}
 */
export async function getOkstatePosAnomalyWindow(agentId = OKSTATE_GAMEDAY_AGENT) {
    const standList = OKSTATE_ANOMALY_STAND_IDS.map((id) => `"${id}"`).join(', ');
    return runOkstateGamedayEsql(
        `FROM ${OKSTATE_POS_INDEX} | WHERE stand_id IN (${standList}) AND transaction_time >= "${OKSTATE_ANOMALY_START}" AND transaction_time <= "${OKSTATE_ANOMALY_END}" | STATS txns = COUNT(*), revenue = SUM(total_amount) BY stand_id | LIMIT 10`,
        agentId,
    );
}

/**
 * @param {string} [agentId]
 * @returns {Promise<Array<Object>>}
 */
export async function getOkstateHourlyGateScans(agentId = OKSTATE_GAMEDAY_AGENT) {
    return runOkstateGamedayEsql(
        `FROM ${OKSTATE_TICKET_INDEX} | EVAL hour = DATE_TRUNC(1 hour, scan_timestamp) | STATS scans = COUNT(*) BY hour | SORT hour ASC | LIMIT 24`,
        agentId,
    );
}

/**
 * @param {string} [agentId]
 * @returns {Promise<Array<Object>>}
 */
export async function getOkstateTicketByType(agentId = OKSTATE_GAMEDAY_AGENT) {
    return runOkstateGamedayEsql(
        `FROM ${OKSTATE_TICKET_INDEX} | STATS revenue = SUM(ticket_price), scans = COUNT(*) BY ticket_type | SORT revenue DESC | LIMIT 10`,
        agentId,
    );
}

/**
 * @param {string} [agentId]
 * @returns {Promise<Array<Object>>}
 */
export async function getOkstateTicketByFanTier(agentId = OKSTATE_GAMEDAY_AGENT) {
    return runOkstateGamedayEsql(
        `FROM ${OKSTATE_TICKET_INDEX} | STATS revenue = SUM(ticket_price), scans = COUNT(*) BY fan_tier | SORT revenue DESC | LIMIT 10`,
        agentId,
    );
}

/**
 * @param {string} [agentId]
 * @returns {Promise<Array<Object>>}
 */
export async function getOkstateTicketByGate(agentId = OKSTATE_GAMEDAY_AGENT) {
    return runOkstateGamedayEsql(
        `FROM ${OKSTATE_TICKET_INDEX} | STATS scans = COUNT(*), revenue = SUM(ticket_price) BY gate | SORT scans DESC | LIMIT 10`,
        agentId,
    );
}

/**
 * @param {string} [agentId]
 * @returns {Promise<Array<Object>>}
 */
export async function getOkstateResaleActivity(agentId = OKSTATE_GAMEDAY_AGENT) {
    return runOkstateGamedayEsql(
        `FROM ${OKSTATE_TICKET_INDEX} | WHERE is_resale == true | STATS resale_scans = COUNT(*), resale_revenue = SUM(ticket_price) BY fan_tier, gate | SORT resale_scans DESC | LIMIT 12`,
        agentId,
    );
}
