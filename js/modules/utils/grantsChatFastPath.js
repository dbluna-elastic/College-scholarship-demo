/**
 * Carey Grant Bot (ok-grants-data) fast path — direct grant index lookups
 * instead of the full Agent Builder reasoning loop.
 */

import {
    getOkGrantsCatalogForChat,
    summarizeGrantRows,
    filterGrantRows,
    searchOkGrantsChat,
    getOkGrantByIdChat,
} from './grantsChatQueries.js';

const GRANTS_AGENT = 'ok-grants-data';
const MAX_LIST = 8;

const CATEGORY_KEYWORDS = {
    workforce: ['workforce', 'employment', 'training', 'apprenticeship', 'job', 'jobs'],
    infrastructure: ['infrastructure', 'broadband', 'transport', 'transit', 'bridge', 'fiber'],
    education: ['education', 'literacy', 'school', 'teacher', 'stem', 'library'],
    environment: ['environment', 'water', 'conservation', 'wildfire', 'solar', 'stream', 'agricultural'],
    health: ['health', 'clinic', 'behavioral', 'nutrition', 'crisis', 'food bank'],
    economic: ['economic', 'innovation', 'export', 'downtown', 'revitalization', 'recovery'],
};

const AGENCY_KEYWORDS = {
    commerce: ['commerce', 'economic development'],
    education: ['education', 'school'],
    health: ['health', 'human services'],
    agriculture: ['agriculture', 'agricultural'],
    transport: ['transport', 'transit'],
    housing: ['housing'],
};

const APPLICANT_KEYWORDS = {
    business: ['business', 'company', 'firm', 'employer', 'small business'],
    nonprofit: ['nonprofit', 'non-profit', '501'],
    public: ['public agency', 'municipal', 'county', 'city', 'school district'],
    tribal: ['tribal', 'tribe'],
    individual: ['individual', 'artist'],
};

function formatMoney(n) {
    if (n == null || n === '') return '—';
    const num = Number(n);
    if (!Number.isFinite(num)) return String(n);
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
    return `$${num.toLocaleString()}`;
}

function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function statusLabel(status) {
    if (status === 'forecasted') return 'Forecasted';
    if (status === 'closed') return 'Closed';
    return 'Active';
}

function formatGrantLine(row) {
    const parts = [
        `**${row.title}**`,
        statusLabel(row.status),
        row.deadline ? `deadline ${formatDate(row.deadline)}` : null,
        row.agency ? String(row.agency).replace(/_/g, ' ') : null,
    ].filter(Boolean);
    return `- ${parts.join(' — ')}`;
}

function formatGrantDetail(row) {
    return [
        `**${row.title}**`,
        `- Status: **${statusLabel(row.status)}**`,
        `- Deadline: ${formatDate(row.deadline)}`,
        `- Open date: ${formatDate(row.openDate)}`,
        row.agency ? `- Agency: ${String(row.agency).replace(/_/g, ' ')}` : null,
        row.category ? `- Category: ${String(row.category).replace(/_/g, ' ')}` : null,
        row.eligibleApplicant ? `- Eligible applicant: ${String(row.eligibleApplicant).replace(/_/g, ' ')}` : null,
        row.matchRequired ? `- Match funding: **${row.matchFunding || 'Required'}**` : '- Match funding: No',
        row.isLoan ? '- Type: Loan opportunity' : null,
        row.estimatedTotal != null ? `- Est. total funding: **${formatMoney(row.estimatedTotal)}**` : null,
        row.rangeLowHigh ? `- Award range: ${row.rangeLowHigh}` : null,
        row.description ? `\n${row.description}` : null,
    ].filter(Boolean).join('\n');
}

function listGrants(rows, heading) {
    if (!rows.length) {
        return { output: `No grant opportunities matched that question.` };
    }
    const shown = rows.slice(0, MAX_LIST);
    const lines = shown.map(formatGrantLine);
    const suffix = rows.length > MAX_LIST ? `\n\n_Showing ${shown.length} of ${rows.length} matches._` : '';
    return {
        output: `**${heading}** (${shown.length}${rows.length > MAX_LIST ? ` of ${rows.length}` : ''})\n\n${lines.join('\n')}${suffix}`,
    };
}

function detectCategory(q) {
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some((kw) => q.includes(kw))) return category;
    }
    return null;
}

function detectAgency(q) {
    for (const [agency, keywords] of Object.entries(AGENCY_KEYWORDS)) {
        if (keywords.some((kw) => q.includes(kw))) return agency;
    }
    return null;
}

function detectApplicant(q) {
    for (const [applicant, keywords] of Object.entries(APPLICANT_KEYWORDS)) {
        if (keywords.some((kw) => q.includes(kw))) return applicant;
    }
    return null;
}

function extractSearchKeyword(message, q) {
    const quoted = message.match(/["“]([^"”]+)["”]/)?.[1];
    if (quoted) return quoted.trim();

    const searchFor = message.match(/\b(?:search(?:ing)?|find|look(?:ing)?)\s+(?:for\s+)?(.+)/i)?.[1];
    if (searchFor) return searchFor.replace(/\?+$/, '').trim();

    const grantsAbout = message.match(/\bgrants?\s+(?:for|about|related to)\s+(.+)/i)?.[1];
    if (grantsAbout) return grantsAbout.replace(/\?+$/, '').trim();

    const openGrants = message.match(/\b(?:what|which)\s+(.+?)\s+grants?\s+(?:are\s+)?(?:open|active|available)/i)?.[1];
    if (openGrants) return openGrants.replace(/\?+$/, '').trim();

    const noise = /\b(what|which|show|list|tell|me|about|are|is|the|open|active|available|right|now|currently|any|some|grants?|opportunities|programs?|oklahoma|state)\b/gi;
    const cleaned = q.replace(noise, ' ').replace(/\s+/g, ' ').trim();
    return cleaned.length >= 3 ? cleaned : null;
}

/**
 * @param {string} message
 * @returns {Object|null}
 */
function matchGrantIntent(message) {
    const q = message.trim().toLowerCase();

    const grantId = message.match(/\b(g\d{1,4})\b/i)?.[1]
        || message.match(/\b(?:grant|program|portal)\s+(?:id\s+)?[#:]?\s*([A-Za-z0-9_-]+)/i)?.[1];
    if (grantId) return { type: 'grantId', grantId };

    if (/\b(how many|total|count|number of)\b.*\bgrants?\b/.test(q)
        || /\bgrant\b.*\b(summary|stats|statistics|overview|portfolio)\b/.test(q)
        || /\boverview\b.*\bgrants?\b/.test(q)) {
        return { type: 'stats' };
    }

    if (/\b(deadline|closing soon|upcoming|due date|due dates)\b/.test(q)) {
        return { type: 'deadlines' };
    }

    if (/\b(loan|loans)\b/.test(q) && /\b(grants?|opportunit)/.test(q)) {
        return { type: 'loans' };
    }

    if (/\b(no match|without match|don'?t require match|do not require match)\b/.test(q)) {
        return { type: 'noMatch' };
    }

    if (/\bforecast/.test(q)) {
        return { type: 'status', status: 'forecasted' };
    }

    if (/\bclosed\b/.test(q) && /\bgrant/.test(q)) {
        return { type: 'status', status: 'closed' };
    }

    if (/\b(active|open|available)\b/.test(q) && /\bgrant/.test(q)) {
        return { type: 'status', status: 'active' };
    }

    const category = detectCategory(q);
    if (category && /\bgrant/.test(q)) {
        return { type: 'category', category };
    }

    const agency = detectAgency(q);
    if (agency && /\bgrant/.test(q)) {
        return { type: 'agency', agency };
    }

    const applicant = detectApplicant(q);
    if (applicant && (/\bgrant/.test(q) || /\beligib/.test(q) || /\bapply/.test(q))) {
        return { type: 'applicant', eligibleApplicant: applicant };
    }

    const keyword = extractSearchKeyword(message, q);
    if (keyword && keyword.length >= 3) {
        return { type: 'keyword', keyword };
    }

    if (/\bgrant/.test(q) || /\bopportunit/.test(q) || /\bprogram/.test(q)) {
        return { type: 'browse' };
    }

    return null;
}

/**
 * @param {string} agentId
 * @param {string} message
 * @returns {Promise<{ output: string }|null>}
 */
export async function tryGrantsChatFastPath(agentId, message) {
    if (agentId !== GRANTS_AGENT) return null;

    const intent = matchGrantIntent(message);
    if (!intent) return null;

    try {
        const template = typeof window !== 'undefined' ? window.currentTemplate : null;

        if (intent.type === 'grantId') {
            const row = await getOkGrantByIdChat(intent.grantId, template);
            if (!row) return { output: `No grant found for **${intent.grantId}**.` };
            return { output: formatGrantDetail(row) };
        }

        if (intent.type === 'stats') {
            const catalog = await getOkGrantsCatalogForChat(template);
            if (!catalog.length) return null;
            const stats = summarizeGrantRows(catalog);
            return {
                output: [
                    '**State Grant Portfolio**',
                    `- **${stats.total.toLocaleString()}** total opportunities`,
                    `- **${stats.active}** active`,
                    `- **${stats.forecasted}** forecasted`,
                    `- **${stats.closed}** closed`,
                    `- **${stats.withMatch}** require matched funding`,
                    `- **${stats.loans}** loan programs`,
                ].join('\n'),
            };
        }

        if (intent.type === 'keyword') {
            const rows = await searchOkGrantsChat(intent.keyword, template, MAX_LIST);
            return listGrants(rows, `Grants matching “${intent.keyword}”`);
        }

        const catalog = await getOkGrantsCatalogForChat(template);
        if (!catalog.length) return null;

        if (intent.type === 'deadlines') {
            const rows = filterGrantRows(catalog, { upcomingDeadlines: true });
            return listGrants(rows, 'Upcoming grant deadlines');
        }

        if (intent.type === 'loans') {
            const rows = filterGrantRows(catalog, { excludeLoans: false }).filter((row) => row.isLoan);
            return listGrants(rows, 'Loan opportunities');
        }

        if (intent.type === 'noMatch') {
            const rows = filterGrantRows(catalog, { noMatchRequired: true, status: 'active' });
            return listGrants(rows, 'Active grants without match requirement');
        }

        if (intent.type === 'status') {
            const rows = filterGrantRows(catalog, { status: intent.status });
            return listGrants(rows, `${statusLabel(intent.status)} grants`);
        }

        if (intent.type === 'category') {
            let rows = filterGrantRows(catalog, { category: intent.category });
            if (/\b(open|active)\b/i.test(message)) {
                rows = rows.filter((row) => row.status === 'active');
            }
            const label = intent.category.replace(/_/g, ' ');
            return listGrants(rows, `${label.charAt(0).toUpperCase()}${label.slice(1)} grants`);
        }

        if (intent.type === 'agency') {
            const rows = filterGrantRows(catalog, { agency: intent.agency });
            const label = intent.agency.replace(/_/g, ' ');
            return listGrants(rows, `${label.charAt(0).toUpperCase()}${label.slice(1)} agency grants`);
        }

        if (intent.type === 'applicant') {
            let rows = filterGrantRows(catalog, { eligibleApplicant: intent.eligibleApplicant });
            if (/\b(open|active)\b/i.test(message)) {
                rows = rows.filter((row) => row.status === 'active');
            }
            const label = intent.eligibleApplicant.replace(/_/g, ' ');
            return listGrants(rows, `Grants for ${label} applicants`);
        }

        if (intent.type === 'browse') {
            const rows = filterGrantRows(catalog, { status: 'active' });
            return listGrants(rows, 'Active grant opportunities');
        }
    } catch (error) {
        console.warn('Grants chat fast path failed, falling back to agent:', error.message);
        return null;
    }

    return null;
}

export { GRANTS_AGENT };
