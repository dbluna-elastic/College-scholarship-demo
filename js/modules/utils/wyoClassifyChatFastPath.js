/**
 * wyo-classify Agent Builder fast path — direct ES|QL for common classification questions.
 */

import {
    WYO_CLASSIFY_ES_AGENT,
    getWyoOverviewStats,
    getWyoCountsByLevel,
    getWyoPendingQueue,
    getWyoCountsByAgency,
    getWyoPublicShareSpillage,
} from './wyomingClassifyEsqlQueries.js';

export const WYO_CLASSIFY_AGENT = WYO_CLASSIFY_ES_AGENT;

function formatCategories(value) {
    if (Array.isArray(value)) return value.filter(Boolean).join(', ') || '—';
    if (typeof value === 'string' && value.trim()) return value;
    return '—';
}

function formatConfidence(value) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return `${Math.round(Number(value) * 100)}%`;
}

/**
 * @param {string} message
 * @returns {'overview'|'levels'|'pending'|'agencies'|'spillage'|null}
 */
function matchWyoIntent(message) {
    const q = message.trim().toLowerCase();
    const wantsCount = /\b(how many|snapshot|overview|summary|classified|total document)\b/.test(q);

    if (wantsCount && !/\b(queue|what is in)\b/.test(q)) {
        if (/\b(by level|counts? by (classification )?level)\b/.test(q)) {
            return 'levels';
        }
        return 'overview';
    }

    if (/\b(pending|review queue|lowest confidence|confirm|override)\b/.test(q)) {
        return 'pending';
    }
    if (/\b(spillage|public[- ]?share|restricted.*public|immunization)\b/.test(q)) {
        return 'spillage';
    }
    if (/\b(agency|agencies|owner|wdh|wydot|health|governor)\b/.test(q)) {
        return 'agencies';
    }
    if (/\b(by level|classification level|public.*internal.*confidential)\b/.test(q)
        || /\bcounts? by (classification )?level\b/.test(q)) {
        return 'levels';
    }

    return null;
}

/**
 * @param {string} agentId
 * @param {string} message
 * @returns {Promise<{ output: string }|null>}
 */
export async function tryWyoClassifyChatFastPath(agentId, message) {
    if (agentId !== WYO_CLASSIFY_AGENT) return null;

    const intent = matchWyoIntent(message);
    if (!intent) return null;

    try {
        if (intent === 'overview') {
            const stats = await getWyoOverviewStats();
            return {
                output: [
                    '**Wyoming classification snapshot** (synthetic corpus)',
                    '',
                    `- **Total documents:** ${stats.totalDocs?.toLocaleString() ?? '—'}`,
                    `- **Restricted:** ${stats.restricted?.toLocaleString() ?? '—'}`,
                    `- **Pending review:** ${stats.pendingReview?.toLocaleString() ?? '—'}`,
                    `- **Spillage alerts:** ${stats.spillageAlerts?.toLocaleString() ?? '—'}`,
                ].join('\n'),
            };
        }

        if (intent === 'levels') {
            const rows = await getWyoCountsByLevel();
            if (!rows.length) return { output: 'No classified documents found.' };
            const lines = rows.map((row) => `- **${row.level}:** ${row.count.toLocaleString()}`);
            return { output: `**Documents by classification level**\n\n${lines.join('\n')}` };
        }

        if (intent === 'pending') {
            const rows = await getWyoPendingQueue(8);
            if (!rows.length) return { output: 'No pending reviews found.' };
            const lines = rows.map((row) => (
                `- **${row.fileName}** — ${row.level}, ${formatConfidence(row.confidence)} confidence, ${row.agency} (${row.zone})`
            ));
            return {
                output: `**Pending review** (lowest confidence first, showing ${lines.length})\n\n${lines.join('\n')}`,
            };
        }

        if (intent === 'agencies') {
            const rows = await getWyoCountsByAgency();
            if (!rows.length) return { output: 'No agency breakdown found.' };
            const lines = rows.map((row) => `- **${row.agency}:** ${row.count.toLocaleString()}`);
            return { output: `**Owner agencies**\n\n${lines.join('\n')}` };
        }

        if (intent === 'spillage') {
            const [files, stats] = await Promise.all([
                getWyoPublicShareSpillage(8),
                getWyoOverviewStats(),
            ]);
            const alertLine = `- **Spillage alerts:** ${stats.spillageAlerts?.toLocaleString() ?? '—'}`;
            if (!files.length) {
                return {
                    output: [
                        '**Public-share spillage**',
                        '',
                        'No restricted documents are currently in `public_share`.',
                        alertLine,
                        '',
                        '_Hold-out planted file: **spillage_immunization.pdf** (ingest with zone public_share to fire the alert)._',
                    ].join('\n'),
                };
            }
            const lines = files.map((row) => (
                `- **${row.fileName}** — ${row.level}, ${row.agency}, ${formatCategories(row.categories)}`
            ));
            return {
                output: `**Restricted documents in public share**\n\n${lines.join('\n')}\n\n${alertLine}`,
            };
        }
    } catch (error) {
        console.warn('Wyoming classification chat fast path failed, falling back to agent:', error.message);
        return null;
    }

    return null;
}
