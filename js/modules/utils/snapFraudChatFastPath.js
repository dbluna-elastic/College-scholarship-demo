/**
 * snap-fraud-investigator fast path — direct ESQL for common SNAP fraud questions.
 */

import {
    getSnapOverviewStats,
    getSnapSameCentStores,
    getSnapManualEntryStores,
    getSnapCrossStateIds,
    getSnapDeceasedTransactions,
    getSnapRapidBaskets,
    getSnapBalanceDrains,
    getSnapLargeBaskets,
} from './snapFraudEsqlQueries.js';

export const SNAP_FRAUD_AGENT = 'snap-fraud-investigator';

function formatPercent(value) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return `${Math.round(Number(value) * 100)}%`;
}

/**
 * @param {string} message
 * @returns {'overview'|'sameCent'|'manual'|'crossState'|'deceased'|'rapidBaskets'|'drains'|'largeBaskets'|null}
 */
function matchSnapFraudIntent(message) {
    const q = message.trim().toLowerCase();

    if (/\b(same[- ]?cent|traffick|round[- ]?dollar|4471)\b/.test(q)) {
        return 'sameCent';
    }
    if (/\b(manual[- ]?entry|manual ebt|5102)\b/.test(q)) {
        return 'manual';
    }
    if (/\b(cross[- ]?state|identity fraud|ssn)\b/.test(q)) {
        return 'crossState';
    }
    if (/\b(deceased|dead beneficiary|post[- ]?death)\b/.test(q)) {
        return 'deceased';
    }
    if (/\b(rapid|broken[- ]?up|basket|7701|hh_basket)\b/.test(q)) {
        return 'rapidBaskets';
    }
    if (/\b(drain|balance[- ]?drain|zero balance)\b/.test(q)) {
        return 'drains';
    }
    if (/\b(large basket|convenience|6123)\b/.test(q)) {
        return 'largeBaskets';
    }
    if (/\b(overview|how many|total|summary|stats)\b.*\b(transaction|store|fraud)\b/.test(q)
        || /\b(transaction|fraud)\b.*\b(overview|summary|stats)\b/.test(q)) {
        return 'overview';
    }

    return null;
}

/**
 * @param {string} agentId
 * @param {string} message
 * @returns {Promise<{ output: string }|null>}
 */
export async function trySnapFraudChatFastPath(agentId, message) {
    if (agentId !== SNAP_FRAUD_AGENT) return null;

    const intent = matchSnapFraudIntent(message);
    if (!intent) return null;

    try {
        if (intent === 'overview') {
            const stats = await getSnapOverviewStats();
            return {
                output: [
                    '**SNAP Fraud Snapshot**',
                    '',
                    `- **Transactions (7 days):** ${stats.transactions7d?.toLocaleString() ?? '—'}`,
                    `- **Flagged retailers (same-cent):** ${stats.flaggedStores?.toLocaleString() ?? '—'}`,
                    `- **Cross-state identities:** ${stats.crossStateIds?.toLocaleString() ?? '—'}`,
                    `- **Deceased beneficiary transactions:** ${stats.deceasedTx?.toLocaleString() ?? '—'}`,
                ].join('\n'),
            };
        }

        if (intent === 'sameCent') {
            const rows = await getSnapSameCentStores(5);
            if (!rows.length) return null;
            const lines = rows.map((r) => `- **Store ${r.store_id}**: ${formatPercent(r.pct_round)} same-cent (${r.same_cent}/${r.total} txs)`);
            return { output: `**Same-Cent Trafficking — Top Stores**\n\n${lines.join('\n')}\n\n_Seeded demo store: **4471**_` };
        }

        if (intent === 'manual') {
            const rows = await getSnapManualEntryStores(5);
            if (!rows.length) return null;
            const lines = rows.map((r) => `- **Store ${r.store_id}**: ${formatPercent(r.pct_manual)} manual entry`);
            return { output: `**Manual EBT Entry — Top Stores**\n\n${lines.join('\n')}\n\n_Seeded demo store: **5102**_` };
        }

        if (intent === 'crossState') {
            const rows = await getSnapCrossStateIds(5);
            if (!rows.length) return null;
            const lines = rows.map((r) => `- **${r.ssn_hash}**: ${r.states} states (${Array.isArray(r.state_list) ? r.state_list.join(', ') : r.state_list})`);
            return { output: `**Cross-State Identity Fraud**\n\n${lines.join('\n')}` };
        }

        if (intent === 'deceased') {
            const rows = await getSnapDeceasedTransactions(5);
            if (!rows.length) return null;
            const lines = rows.map((r) => `- **${r.household_id}**: ${r.tx_after_death} txs, $${Number(r.total).toFixed(2)} total`);
            return { output: `**Deceased Beneficiaries Still Transacting**\n\n${lines.join('\n')}` };
        }

        if (intent === 'rapidBaskets') {
            const rows = await getSnapRapidBaskets(5);
            if (!rows.length) return null;
            const lines = rows.map((r) => `- **${r.household_id}** @ store **${r.store_id}**: ${r.tx_count} txs, $${Number(r.total_amt).toFixed(2)}`);
            return { output: `**Rapid / Broken-Up Baskets (10-min windows)**\n\n${lines.join('\n')}` };
        }

        if (intent === 'drains') {
            const rows = await getSnapBalanceDrains(5);
            if (!rows.length) return null;
            const lines = rows.map((r) => `- **${r.household_id}** @ store **${r.store_id}**: ${r.drains} balance drains`);
            return { output: `**Balance Drain Patterns**\n\n${lines.join('\n')}` };
        }

        if (intent === 'largeBaskets') {
            const rows = await getSnapLargeBaskets(5);
            if (!rows.length) return null;
            const lines = rows.map((r) => `- **Store ${r.store_id}** (${r.name}): ${r.big_baskets} large baskets, avg $${Number(r.avg_amt).toFixed(2)}`);
            return { output: `**Large Convenience Baskets**\n\n${lines.join('\n')}\n\n_Seeded demo store: **6123**_` };
        }

        return null;
    } catch {
        return null;
    }
}
