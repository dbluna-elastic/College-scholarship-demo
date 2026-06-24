/**
 * Shared UI helpers for okmentalhealth staff portal.
 */

/**
 * @param {Object} template
 * @returns {Record<string, Array<{title: string, id: string}>>}
 */
export function getGroupedDashboards(template) {
    const grouped = template?.elastic?.dashboards;
    if (!grouped) return {};
    if (Array.isArray(grouped)) return { all: grouped };
    return grouped;
}

/**
 * @param {Object} template
 * @param {string} [group]
 * @returns {string}
 */
export function kibanaDashboardHref(template, id) {
    const base = (template?.elastic?.kibanaUrl || '').replace(/\/$/, '');
    return `${base}/app/dashboards#/view/${id}`;
}

export const MH_CARD_CLASS = 'bg-white border border-gray-200 rounded-2xl shadow-sm';
export const MH_PAGE_BG_CLASS = 'w-full min-h-screen bg-white';
