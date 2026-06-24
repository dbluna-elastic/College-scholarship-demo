/**
 * ok-oja-data Agent Builder fast path — direct ESQL for common OJA questions.
 */

import {
    getOjaOverviewStats,
    getOjaHighPriorityYouth,
    getOjaHighRiskYouth,
    getOjaRecentCaseNotes,
    getOjaYouthById,
    getOjaCountyBreakdown,
    OJA_AGENT,
} from './ojaEsqlQueries.js';

export { OJA_AGENT };

function formatPercent(value) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return `${Math.round(Number(value) * 100)}%`;
}

function youthLink(row) {
    const id = row.youth_id;
    const name = `${row.first_name || ''} ${row.last_name || ''}`.trim() || id;
    return id ? `[youth:${id}]${name}[/youth]` : name;
}

/**
 * @param {string} message
 * @returns {'overview'|'highPriority'|'highRisk'|'notes'|'county'|'youthId'|null}
 */
function matchOjaIntent(message) {
    const q = message.trim().toLowerCase();
    const youthId = message.match(/\b(OJA-\d{4}-\d{5})\b/i)?.[1];
    if (youthId) return { type: 'youthId', youthId };

    if (/\b(how many|total|count|number of)\b.*\b(active|supervis)/.test(q)
        || /\bactive\b.*\b(youth|case)/.test(q)
        || /\bcaseload\b.*\b(summary|stats|overview)/.test(q)) {
        return { type: 'overview' };
    }

    if (/\bhigh[- ]?risk\b/.test(q) || /\brisk score\b/.test(q)) {
        return { type: 'highRisk' };
    }

    if (/\brecidivism\b/.test(q) || /\bre[- ]?offend/.test(q)) {
        return { type: 'overview' };
    }

    if (/\b(case note|follow[- ]?up|sentiment|concerning)\b/.test(q)) {
        return { type: 'notes' };
    }

    if (/\bcounty\b.*\b(caseload|breakdown|distribution)/.test(q) || /\bby county\b/.test(q)) {
        return { type: 'county' };
    }

    if (/\bhigh[- ]?priority\b|\bintensive\b.*\byouth\b|\bpending\b.*\bcase/.test(q)) {
        return { type: 'highPriority' };
    }

    return null;
}

/**
 * @param {string} agentId
 * @param {string} message
 * @returns {Promise<{ output: string }|null>}
 */
export async function tryOjaChatFastPath(agentId, message) {
    if (agentId !== OJA_AGENT) return null;

    const intent = matchOjaIntent(message);
    if (!intent) return null;

    try {
        if (intent.type === 'overview') {
            const stats = await getOjaOverviewStats();
            if (stats.activeYouth == null && stats.avgRisk == null) return null;
            return {
                output: [
                    '**OJA Supervision Overview**',
                    `- **${stats.activeYouth?.toLocaleString() ?? '—'}** active supervision cases`,
                    `- **${stats.pendingYouth?.toLocaleString() ?? '—'}** pending intakes`,
                    `- **${stats.avgRisk?.toFixed(1) ?? '—'}** average assessment risk score`,
                    `- **${formatPercent(stats.recidivism12mo)}** 12-month recidivism rate (discharged youth)`,
                ].join('\n'),
            };
        }

        if (intent.type === 'highPriority') {
            const rows = await getOjaHighPriorityYouth(8);
            if (!rows.length) return { output: 'No high-priority youth matched the current criteria.' };
            const lines = rows.map((row) => {
                const flags = [
                    row.mental_health_flag ? 'MH' : null,
                    row.substance_abuse_flag ? 'SUD' : null,
                ].filter(Boolean).join(', ');
                return `- ${youthLink(row)} — ${row.case_status}, ${row.supervision_level}, ${row.county}${flags ? ` (${flags})` : ''}`;
            });
            return { output: `**High-Priority Youth**\n\n${lines.join('\n')}` };
        }

        if (intent.type === 'highRisk') {
            const rows = await getOjaHighRiskYouth(8);
            if (!rows.length) return { output: 'No high-risk assessments found.' };
            const lines = rows.map((row) => (
                `- **${row.youth_id}** — ${row.risk_level}, score **${Number(row.overall_risk_score).toFixed(1)}**, ${row.assessment_type} (${row.assessment_date})`
            ));
            return { output: `**High-Risk Assessments**\n\n${lines.join('\n')}` };
        }

        if (intent.type === 'notes') {
            const rows = await getOjaRecentCaseNotes(6);
            if (!rows.length) return { output: 'No recent follow-up or concerning case notes found.' };
            const lines = rows.map((row) => (
                `- **${row.youth_id}** — ${row.note_type}: ${row.subject} (${row.sentiment}, ${row.note_date})`
            ));
            return { output: `**Recent Case Notes Needing Attention**\n\n${lines.join('\n')}` };
        }

        if (intent.type === 'county') {
            const rows = await getOjaCountyBreakdown(8);
            if (!rows.length) return null;
            const lines = rows.map((row) => `- **${row.county}**: ${Number(row.caseload).toLocaleString()} active cases`);
            return { output: `**Active Caseload by County**\n\n${lines.join('\n')}` };
        }

        if (intent.type === 'youthId') {
            const row = await getOjaYouthById(intent.youthId);
            if (!row) return { output: `No youth profile found for **${intent.youthId}**.` };
            return {
                output: [
                    youthLink(row),
                    `- Status: **${row.case_status}** (${row.supervision_level} supervision)`,
                    `- Offense: ${row.primary_offense} (${row.offense_category})`,
                    `- County: ${row.county} · Officer: ${row.assigned_officer}`,
                    `- Intake: ${row.intake_date}`,
                    row.mental_health_flag ? '- Mental health flag: yes' : null,
                    row.substance_abuse_flag ? '- Substance use flag: yes' : null,
                ].filter(Boolean).join('\n'),
            };
        }
    } catch (error) {
        console.warn('OJA chat fast path failed, falling back to agent:', error.message);
        return null;
    }

    return null;
}
