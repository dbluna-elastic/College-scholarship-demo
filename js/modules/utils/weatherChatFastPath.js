/**
 * Fast-path answers for common OU Met catalog and provisioning chat prompts.
 */

import { getField, getProvisioningRequests, getProvisioningStats } from './weatherQueries.js';

export const CATALOG_AGENT = 'ou-met-catalog-agent';
export const PROVISIONING_AGENT = 'ou-met-provisioning-agent';

function formatDate(value) {
    if (value == null) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

/**
 * @param {string} agentId
 * @param {string} message
 * @returns {Promise<{ output: string }|null>}
 */
export async function tryWeatherChatFastPath(agentId, message) {
    const q = message.trim().toLowerCase();

    if (agentId === PROVISIONING_AGENT) {
        if (/\b(pending|queue|provision)/.test(q)) {
            try {
                const rows = await getProvisioningRequests('pending');
                if (!rows.length) {
                    return { output: 'No **pending** provisioning requests in the queue.' };
                }
                const lines = rows.slice(0, 8).map((row) => {
                    return `- **${getField(row, 'request_id')}** — ${getField(row, 'dataset_name')} (${getField(row, 'delivery_mode')}), ETA ${formatDate(getField(row, 'estimated_ready_at'))}`;
                });
                return {
                    output: `**Pending Provisioning Queue** (${rows.length} total)\n\n${lines.join('\n')}`,
                };
            } catch (error) {
                console.warn('Weather provisioning fast path failed:', error.message);
                return null;
            }
        }
        return null;
    }

    if (agentId !== CATALOG_AGENT) return null;

    if (/\bhrrr\b/.test(q) && /\b(available|files?|live)\b/.test(q)) {
        return {
            output: [
                '**HRRR (live tier)** — direct OPeNDAP delivery',
                '- Search `data_tier: live` and `dataset_name: HRRR` in the catalog',
                '- OPeNDAP URLs are returned immediately — no provisioning queue',
                '- Example prompt for the full agent: "What HRRR files are available for today?"',
            ].join('\n'),
        };
    }

    if (/\bgfs\b/.test(q) && /\b(reanalysis|september|2017)\b/.test(q)) {
        return {
            output: [
                '**GFS reanalysis** — auto-mount delivery (~3–5 min ETA)',
                '- The catalog agent will classify this as `auto_mount`',
                '- You will be notified when the dataset is ready on your VM',
                '- No need to ask for a manual mount',
            ].join('\n'),
        };
    }

    if (/\b(ccs034|acars|restricted|approval)\b/.test(q)) {
        return {
            output: [
                '**Restricted research data** — approval required (~1 business day)',
                '- Datasets like CCS034 and ACARS require ops approval',
                '- The agent auto-queues the request and provides an ETA',
                '- Sean/Corey review via the provisioning ops portal',
            ].join('\n'),
        };
    }

    if (/\b(catalog|datasets?|how many)\b/.test(q) && /\b(stats|summary|overview)\b/.test(q)) {
        try {
            const stats = await getProvisioningStats();
            return {
                output: [
                    '**OU Met Demo Overview**',
                    '- Catalog index: `ou-met-catalog` (260+ THREDDS metadata documents)',
                    `- Provisioning queue: **${stats.total}** requests (${stats.pending} pending, ${stats.completed} completed)`,
                    '- Delivery modes: direct OPeNDAP, auto_mount, approval_required',
                ].join('\n'),
            };
        } catch {
            return {
                output: '**OU Met Catalog** — search GFS, HRRR, NAM, RAP, and NEXRAD datasets by tier, variable, and date range.',
            };
        }
    }

    return null;
}
