/**
 * okstate-gameday-revenue-assistant fast path — Boone Pickens tickets + Square POS.
 */

import {
    getOkstateGamedaySummary,
    getOkstatePosByStand,
    getOkstatePosByCategory,
    getOkstatePosByZone,
    getOkstatePosAnomalyWindow,
    getOkstateHourlyGateScans,
    getOkstateTicketByFanTier,
    getOkstateTicketByGate,
    getOkstateResaleActivity,
    OKSTATE_GAMEDAY_AGENT,
    OKSTATE_GAME_ID,
    OKSTATE_ANOMALY_STAND_IDS,
} from './okstateGamedayQueries.js';

export { OKSTATE_GAMEDAY_AGENT };

const STAND_LABELS = {
    S01: 'Boone Pickens North Beer Garden',
    S02: 'Cowboy Grill — Gate 1',
    S03: 'South End Zone Cantina',
    S04: 'Club Orange Premium Bar',
    S05: 'Student Section Snacks',
    S06: 'West Concourse Grill',
    S07: 'Cowboy Team Store — Main',
    S08: 'Cowboy Team Store — South',
    S09: 'East End Zone Bar',
    S10: 'Visiting Fan Concessions',
};

function formatCurrency(value) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value));
}

function formatNumber(value) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return Number(value).toLocaleString();
}

function formatCategory(value) {
    if (!value) return '—';
    return String(value).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function standLabel(standId, standName) {
    return standName || STAND_LABELS[standId] || standId || '—';
}

/**
 * @param {string} message
 * @returns {'summary'|'stands'|'categories'|'zones'|'anomaly'|'hourly'|'fanTier'|'gates'|'resale'|null}
 */
function matchOkstateGamedayIntent(message) {
    const q = message.trim().toLowerCase();

    if (/\b(club orange|outage|processor|s04|s06|s09|west concourse|east end zone|halftime drop|payment)\b/.test(q)
        || (/\banomal/.test(q) && /\b(stand|pos|concession)/.test(q))) {
        return 'anomaly';
    }

    if (/\b(resale|scalp|secondary market)\b/.test(q)) {
        return 'resale';
    }

    if (/\bfan tier\b|\bfan segment\b/.test(q)) {
        return 'fanTier';
    }

    if (/\bgate traffic\b|\bby gate\b|\bwhich gate\b|\barrivals\b/.test(q)) {
        return 'gates';
    }

    if (/\bhourly\b|\bby hour\b/.test(q)) {
        return 'hourly';
    }

    if (/\b(which stand|top stand|stand performance|concession stand|team store)\b/.test(q)
        || (/\bstand\b/.test(q) && /\b(revenue|perform|best|top)\b/.test(q))) {
        return 'stands';
    }

    if (/\bzone\b/.test(q) && /\b(revenue|mix|breakdown)\b/.test(q)) {
        return 'zones';
    }

    if (/\b(category|categories|beer|jersey|concessions|merch mix)\b/.test(q)
        && /\b(revenue|breakdown|mix|by)\b/.test(q)) {
        return 'categories';
    }

    if (/\b(total|combined|overall)\b.*\b(revenue|gameday|game day)\b/.test(q)
        || /\bgameday revenue\b/.test(q)
        || /\bhow much\b.*\b(revenue|made|earned)\b/.test(q)
        || /\bpos (total|summary|revenue)\b/.test(q)
        || /\bconcession/.test(q) && /\b(total|summary|revenue)\b/.test(q)) {
        return 'summary';
    }

    return null;
}

/**
 * @param {string} agentId
 * @param {string} message
 * @returns {Promise<{ output: string }|null>}
 */
export async function tryOkstateGamedayChatFastPath(agentId, message) {
    if (agentId !== OKSTATE_GAMEDAY_AGENT) return null;

    const intent = matchOkstateGamedayIntent(message);
    if (!intent) return null;

    try {
        if (intent === 'summary') {
            const summary = await getOkstateGamedaySummary(agentId);
            if (summary.combinedRevenue == null && summary.ticketRevenue == null) return null;
            return {
                output: [
                    `**Boone Pickens Game Day Revenue** (${OKSTATE_GAME_ID})`,
                    `- **${formatCurrency(summary.combinedRevenue)}** combined (tickets + Square POS)`,
                    `- **${formatCurrency(summary.ticketRevenue)}** tickets (${formatNumber(summary.ticketScans)} scans)`,
                    `- **${formatCurrency(summary.posRevenue)}** concessions & team store (${formatNumber(summary.posUnits)} units, ${formatNumber(summary.posTransactions)} transactions)`,
                    `- **${formatNumber(summary.resaleScans)}** ticket resale scans`,
                ].join('\n'),
            };
        }

        if (intent === 'anomaly') {
            const rows = await getOkstatePosAnomalyWindow(agentId);
            const byId = Object.fromEntries(rows.map((row) => [row.stand_id, row]));
            const lines = OKSTATE_ANOMALY_STAND_IDS.map((id) => {
                const row = byId[id];
                const txns = Number(row?.txns || 0);
                return `- **${id} ${STAND_LABELS[id]}** — ${formatNumber(txns)} txns, ${formatCurrency(row?.revenue)}`;
            });
            return {
                output: [
                    '**Payment processor outage (15:50–16:05 UTC, 2025-09-06)**',
                    'Stands S04, S06, and S09 are expected near **zero** transactions during this window.',
                    '',
                    ...lines,
                ].join('\n'),
            };
        }

        if (intent === 'stands') {
            const rows = await getOkstatePosByStand(agentId);
            if (!rows.length) return { output: 'No Boone Pickens stand revenue found.' };
            const lines = rows.map((row) =>
                `- **${row.stand_id} ${standLabel(row.stand_id, row.stand_name)}** (${row.stand_zone}): ${formatCurrency(row.revenue)} · ${formatNumber(row.txns)} txns`
            );
            return { output: `**POS Revenue by Stand**\n\n${lines.join('\n')}` };
        }

        if (intent === 'categories') {
            const rows = await getOkstatePosByCategory(agentId);
            if (!rows.length) return { output: 'No POS category data found.' };
            const lines = rows.map((row) =>
                `- **${formatCategory(row.category)}**: ${formatCurrency(row.revenue)} (${formatNumber(row.txns)} txns)`
            );
            return { output: `**Concessions & Merch by Category**\n\n${lines.join('\n')}` };
        }

        if (intent === 'zones') {
            const rows = await getOkstatePosByZone(agentId);
            if (!rows.length) return { output: 'No POS zone data found.' };
            const lines = rows.map((row) =>
                `- **${row.stand_zone}**: ${formatCurrency(row.revenue)} (${formatNumber(row.txns)} txns)`
            );
            return { output: `**POS Revenue by Stadium Zone**\n\n${lines.join('\n')}` };
        }

        if (intent === 'fanTier') {
            const rows = await getOkstateTicketByFanTier(agentId);
            if (!rows.length) return { output: 'No fan tier ticket data found.' };
            const lines = rows.map((row) =>
                `- **${row.fan_tier}**: ${formatCurrency(row.revenue)} (${formatNumber(row.scans)} scans)`
            );
            return { output: `**Ticket Revenue by Fan Tier**\n\n${lines.join('\n')}` };
        }

        if (intent === 'gates') {
            const rows = await getOkstateTicketByGate(agentId);
            if (!rows.length) return { output: 'No gate traffic data found.' };
            const lines = rows.map((row) =>
                `- **${row.gate}**: ${formatNumber(row.scans)} scans, ${formatCurrency(row.revenue)}`
            );
            return { output: `**Gate Traffic**\n\n${lines.join('\n')}` };
        }

        if (intent === 'hourly') {
            const rows = await getOkstateHourlyGateScans(agentId);
            if (!rows.length) return { output: 'No hourly gate scans found.' };
            const lines = rows.map((row) => {
                const hour = row.hour ? new Date(row.hour).toISOString().slice(11, 16) : '—';
                return `- **${hour} UTC**: ${formatNumber(row.scans)} scans`;
            });
            return { output: `**Hourly Gate Scans**\n\n${lines.join('\n')}` };
        }

        if (intent === 'resale') {
            const rows = await getOkstateResaleActivity(agentId);
            if (!rows.length) return { output: 'No ticket resale scans were found.' };
            const lines = rows.map((row) =>
                `- **${row.fan_tier}** @ ${row.gate}: ${formatNumber(row.resale_scans)} scans, ${formatCurrency(row.resale_revenue)}`
            );
            return { output: `**Ticket Resale Activity**\n\n${lines.join('\n')}` };
        }
    } catch (error) {
        console.warn('Oklahoma State gameday chat fast path failed, falling back to agent:', error.message);
        return null;
    }

    return null;
}
