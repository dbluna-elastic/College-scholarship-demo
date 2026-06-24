/**
 * ok-fraud Agent Builder fast path — direct ESQL lookups for common fraud questions.
 */

import {
    getFraudYTDTotalLoss,
    getFraudTotalClaimsFlagged,
    getFraudHighRiskClaimCount,
    getFraudHighPriorityCases,
    getFraudLossByFlagType,
    getFraudInvestigationResolutionRate,
    getCrisisCallCenterStats,
    getClinicalStatewideRelapseRate,
} from './esqlQueries.js';

export const FRAUD_AGENT = 'ok-fraud';

function formatCurrency(value) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value));
}

/**
 * @param {string} message
 * @returns {'ytdLoss'|'claimsFlagged'|'highRisk'|'highPriority'|'lossByFlag'|'resolution'|'crisisStats'|'relapseRate'|null}
 */
function matchFraudIntent(message) {
    const q = message.trim().toLowerCase();

    if (/\b(high[- ]?risk|critical)\b.*\b(claim|case)/.test(q) || /\bhow many\b.*\bhigh[- ]?risk\b/.test(q)) {
        return 'highRisk';
    }
    if (/\b(total|ytd|year)\b.*\b(loss|fraud|exposure)/.test(q) || /\bfraud\b.*\b(detected|loss)/.test(q)) {
        return 'ytdLoss';
    }
    if (/\b(flagged|claims flagged)\b/.test(q) || /\bhow many\b.*\bclaim/.test(q)) {
        return 'claimsFlagged';
    }
    if (/\bloss\b.*\b(flag|type)/.test(q) || /\bflag type/.test(q)) {
        return 'lossByFlag';
    }
    if (/\bresolution\b|\binvestigation rate\b|\bassigned investigator/.test(q)) {
        return 'resolution';
    }
    if (/\bhigh[- ]?priority\b.*\b(case|claim)/.test(q) || /\btop\b.*\bfraud case/.test(q)) {
        return 'highPriority';
    }
    if (/\bcrisis\b.*\b(answer|call|mcot)/.test(q) || /\bcall center\b/.test(q)) {
        return 'crisisStats';
    }
    if (/\brelapse\b/.test(q)) {
        return 'relapseRate';
    }

    return null;
}

/**
 * @param {string} agentId
 * @param {string} message
 * @returns {Promise<{ output: string }|null>}
 */
export async function tryFraudChatFastPath(agentId, message) {
    if (agentId !== FRAUD_AGENT) return null;

    const intent = matchFraudIntent(message);
    if (!intent) return null;

    try {
        if (intent === 'ytdLoss') {
            const total = await getFraudYTDTotalLoss(agentId);
            if (total == null) return null;
            return { output: `**Total Potential Fraud Detected YTD:** ${formatCurrency(total)}` };
        }

        if (intent === 'claimsFlagged') {
            const count = await getFraudTotalClaimsFlagged(agentId);
            if (count == null) return null;
            return { output: `**Total Claims Flagged:** ${count.toLocaleString()}` };
        }

        if (intent === 'highRisk') {
            const count = await getFraudHighRiskClaimCount(agentId);
            if (count == null) return null;
            return { output: `**High-Risk Claims** (Risk Score ≥ 75): **${count.toLocaleString()}**` };
        }

        if (intent === 'lossByFlag') {
            const rows = await getFraudLossByFlagType(agentId, 5);
            if (!rows.length) return null;
            const lines = rows.map((row) => `- **${row.Flag_Type}**: ${formatCurrency(row.total_loss)}`);
            return { output: `**Loss by Flag Type**\n\n${lines.join('\n')}` };
        }

        if (intent === 'resolution') {
            const rate = await getFraudInvestigationResolutionRate(agentId);
            if (rate == null) return null;
            return { output: `**Investigation Resolution Rate:** **${rate}%** of flagged claims have an assigned investigator.` };
        }

        if (intent === 'highPriority') {
            const cases = await getFraudHighPriorityCases(agentId);
            if (!cases.length) return { output: 'No high-priority fraud cases matched the current criteria.' };
            const lines = cases.slice(0, 8).map((row) => {
                const id = row.Medicaid_Recipient_ID ?? row.medicaid_recipient_id ?? '—';
                const flag = row.Flag_Type ?? '—';
                const priority = row.Priority ?? 'Medium';
                return `- **${id}** — ${flag} (${priority})`;
            });
            return {
                output: `**High-Priority Fraud Cases** (showing ${Math.min(8, cases.length)} of ${cases.length})\n\n${lines.join('\n')}`,
            };
        }

        if (intent === 'crisisStats') {
            const stats = await getCrisisCallCenterStats(agentId);
            if (stats.avgAnswerSeconds == null && stats.totalCalls == null) return null;
            return {
                output: [
                    '**Crisis Call Center Snapshot**',
                    `- Avg answer time: **${stats.avgAnswerSeconds != null ? `${Math.round(stats.avgAnswerSeconds)}s` : '—'}**`,
                    `- Total calls logged: **${stats.totalCalls?.toLocaleString() ?? '—'}**`,
                    `- Avg MCOT response: **${stats.avgMcotSeconds != null ? `${Math.round(stats.avgMcotSeconds)}s` : '—'}**`,
                ].join('\n'),
            };
        }

        if (intent === 'relapseRate') {
            const rate = await getClinicalStatewideRelapseRate(agentId);
            if (rate == null) return null;
            return { output: `**Statewide Relapse Rate:** **${rate}%**` };
        }
    } catch (error) {
        console.warn('Fraud chat fast path failed, falling back to agent:', error.message);
        return null;
    }

    return null;
}
