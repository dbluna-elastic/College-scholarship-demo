/**
 * Shared UI helpers for the Wyoming data classification portal.
 */

/**
 * @param {Object} template
 * @returns {Record<string, Array<{title: string, id: string}>>}
 */
export function getWyoDashboards(template) {
    const dashboards = template?.elastic?.dashboards;
    if (!dashboards) return {};
    if (Array.isArray(dashboards)) return { all: dashboards };
    return dashboards;
}

/**
 * @param {Object} template
 * @param {string} id
 * @returns {string}
 */
export function kibanaDashboardHref(template, id) {
    const base = (template?.elastic?.kibanaUrl || '').replace(/\/$/, '');
    return `${base}/app/dashboards#/view/${id}`;
}

export const WYO_CARD_CLASS = 'bg-white border border-gray-200 rounded-2xl shadow-sm';

/**
 * @param {string} level
 * @returns {string}
 */
export function levelBadgeClass(level) {
    const colors = {
        public: 'bg-slate-100 text-slate-800',
        internal: 'bg-sky-100 text-sky-800',
        confidential: 'bg-amber-100 text-amber-900',
        restricted: 'bg-red-100 text-red-800',
    };
    return colors[String(level || '').toLowerCase()] || 'bg-gray-100 text-gray-700';
}
