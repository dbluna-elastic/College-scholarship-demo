/**
 * Hybrid fast path: answer common chat questions via direct data lookups
 * instead of the full Agent Builder loop.
 */

import {
    getBoosterDonorStats,
    getBoosterAtRiskDonors,
    getBoosterAtRiskMajorGifts,
    getBoosterTopAffinityDonors,
    getBoosterEngagementEventSummary,
    getBoosterCaseMetrics,
    getBoosterDonorById,
} from './esqlQueries.js';
import { tryGrantsChatFastPath, GRANTS_AGENT } from './grantsChatFastPath.js';
import { tryFraudChatFastPath, FRAUD_AGENT } from './fraudChatFastPath.js';
import { tryOjaChatFastPath, OJA_AGENT } from './ojaChatFastPath.js';
import { tryGamedayChatFastPath, GAMEDAY_AGENT } from './gamedayChatFastPath.js';

const BOOSTER_AGENT = 'booster-donor-data';

/**
 * @param {string} agentId
 * @returns {boolean}
 */
export function canUseChatFastPath(agentId) {
    return agentId === BOOSTER_AGENT
        || agentId === GRANTS_AGENT
        || agentId === FRAUD_AGENT
        || agentId === OJA_AGENT
        || agentId === GAMEDAY_AGENT;
}

function formatCurrency(value) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value));
}

function formatPercent(value) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return `${Math.round(Number(value) * 100)}%`;
}

function getField(row, ...keys) {
    for (const k of keys) {
        const v = row[k];
        if (v != null && v !== '') return v;
    }
    return null;
}

/**
 * @param {string} message
 * @returns {'portfolio'|'atRisk'|'majorGifts'|'topAffinity'|'engagement'|'cases'|'donorId'|null}
 */
function matchBoosterIntent(message) {
    const q = message.trim().toLowerCase();
    const donorId = message.match(/\b(ALUM-\d+)\b/i)?.[1];
    if (donorId) return { type: 'donorId', donorId };

    if (/\b(how many|total|count|number of)\b.*\b(donor|boosters?)\b/.test(q)
        || /\b(donor|portfolio)\b.*\b(summary|stats|statistics|overview)\b/.test(q)
        || /\b(average|avg)\b.*\baffinity\b/.test(q)
        || /\blifetime giving\b/.test(q)) {
        return { type: 'portfolio' };
    }

    if (/\bat[- ]?risk\b.*\bmajor\b/.test(q) || /\bmajor gift\b.*\bat[- ]?risk\b/.test(q)) {
        return { type: 'majorGifts' };
    }

    if (/\bat[- ]?risk\b/.test(q) || /\blow engagement\b/.test(q) || /\bdisengaged\b/.test(q)) {
        return { type: 'atRisk' };
    }

    if (/\btop\b.*\baffinity\b/.test(q) || /\bhighest affinity\b/.test(q) || /\bbest engaged\b/.test(q)) {
        return { type: 'topAffinity' };
    }

    if (/\bengagement event/.test(q) || /\bportal login/.test(q) || /\bemail open/.test(q)) {
        return { type: 'engagement' };
    }

    if (/\bcase metrics\b/.test(q) || /\bat[- ]?risk cases\b/.test(q) || /\bcases last 30/.test(q)) {
        return { type: 'cases' };
    }

    return null;
}

function donorLink(row) {
    const id = getField(row, 'donor_id');
    const name = `${getField(row, 'first_name')} ${getField(row, 'last_name')}`.trim();
    return id ? `[donor:${id}]${name}[/donor]` : name;
}

/**
 * @param {string} agentId
 * @param {string} message
 * @returns {Promise<{ output: string }|null>}
 */
export async function tryChatFastPath(agentId, message) {
    if (agentId === GRANTS_AGENT) {
        return tryGrantsChatFastPath(agentId, message);
    }

    if (agentId === FRAUD_AGENT) {
        return tryFraudChatFastPath(agentId, message);
    }

    if (agentId === OJA_AGENT) {
        return tryOjaChatFastPath(agentId, message);
    }

    if (agentId === GAMEDAY_AGENT) {
        return tryGamedayChatFastPath(agentId, message);
    }

    if (agentId !== BOOSTER_AGENT) return null;

    const intent = matchBoosterIntent(message);
    if (!intent) return null;

    try {
        if (intent.type === 'portfolio') {
            const stats = await getBoosterDonorStats(agentId);
            if (!stats?.donorCount) return null;
            return {
                output: [
                    '**Athletic Booster Portfolio**',
                    `- **${stats.donorCount.toLocaleString()}** donors in athletic-boosters`,
                    `- **${stats.avgAffinity?.toFixed(1) ?? '—'}** average affinity score`,
                    `- **${formatCurrency(stats.totalLifetimeGiving)}** total lifetime giving`,
                ].join('\n'),
            };
        }

        if (intent.type === 'atRisk') {
            const rows = await getBoosterAtRiskDonors(agentId);
            if (!rows.length) return { output: 'No at-risk donors matched the current criteria.' };
            const lines = rows.slice(0, 8).map((row) => {
                return `- ${donorLink(row)} — affinity ${getField(row, 'affinity_score')?.toFixed?.(1) ?? '—'}, lifetime ${formatCurrency(getField(row, 'giving_history.lifetime_total'))}, email opens ${formatPercent(getField(row, 'engagement.email_open_rate_90d'))}`;
            });
            return {
                output: `**At-Risk Donors** (showing ${lines.length} of ${rows.length})\n\n${lines.join('\n')}`,
            };
        }

        if (intent.type === 'majorGifts') {
            const rows = await getBoosterAtRiskMajorGifts(agentId);
            if (!rows.length) return { output: 'No at-risk major gift donors matched the current criteria.' };
            const lines = rows.slice(0, 8).map((row) => {
                return `- ${donorLink(row)} — ${formatCurrency(getField(row, 'giving_history.lifetime_total'))} lifetime, affinity ${getField(row, 'affinity_score')?.toFixed?.(1) ?? '—'}, email opens ${formatPercent(getField(row, 'engagement.email_open_rate_90d'))}`;
            });
            return {
                output: `**At-Risk Major Gifts** (showing ${lines.length} of ${rows.length})\n\n${lines.join('\n')}`,
            };
        }

        if (intent.type === 'topAffinity') {
            const rows = await getBoosterTopAffinityDonors(agentId);
            if (!rows.length) return { output: 'No affinity donors found.' };
            const lines = rows.slice(0, 8).map((row, i) => {
                return `${i + 1}. ${donorLink(row)} — affinity **${getField(row, 'affinity_score')?.toFixed?.(1) ?? '—'}**, ${formatCurrency(getField(row, 'giving_history.lifetime_total'))} lifetime`;
            });
            return {
                output: `**Top Affinity Donors**\n\n${lines.join('\n')}`,
            };
        }

        if (intent.type === 'engagement') {
            const rows = await getBoosterEngagementEventSummary(agentId);
            if (!rows.length) return null;
            const lines = rows.map((row) => `- **${String(getField(row, 'event_type')).replace(/_/g, ' ')}**: ${Number(getField(row, 'events')).toLocaleString()} events`);
            return {
                output: `**Engagement Events**\n\n${lines.join('\n')}`,
            };
        }

        if (intent.type === 'cases') {
            const rows = await getBoosterCaseMetrics(agentId);
            if (!rows.length) return null;
            const lines = rows.map((row) => {
                const severity = getField(row, 'severity');
                const label = severity ? `${getField(row, 'metric_type')} (${severity})` : getField(row, 'metric_type');
                return `- **${label}**: ${getField(row, 'count')}`;
            });
            return {
                output: `**At-Risk Case Metrics**\n\n${lines.join('\n')}`,
            };
        }

        if (intent.type === 'donorId') {
            const row = await getBoosterDonorById(intent.donorId, agentId);
            if (!row) return { output: `No donor found for **${intent.donorId}**.` };
            const name = `${getField(row, 'first_name')} ${getField(row, 'last_name')}`.trim();
            return {
                output: [
                    donorLink(row),
                    `- Affinity: **${getField(row, 'affinity_score')?.toFixed?.(1) ?? '—'}**`,
                    `- Lifetime giving: **${formatCurrency(getField(row, 'giving_history.lifetime_total'))}**`,
                    `- Last gift: ${getField(row, 'giving_history.last_gift_date') ?? '—'}`,
                    `- Email open rate (90d): ${formatPercent(getField(row, 'engagement.email_open_rate_90d'))}`,
                    `- Degree: ${getField(row, 'degree') ?? '—'} (${getField(row, 'graduation_year') ?? '—'})`,
                    getField(row, 'bio_text') ? `\n${getField(row, 'bio_text')}` : '',
                ].filter(Boolean).join('\n'),
            };
        }
    } catch (error) {
        console.warn('Chat fast path failed, falling back to agent:', error.message);
        return null;
    }

    return null;
}
