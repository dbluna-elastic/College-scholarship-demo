/**
 * Shared UI helpers for okoja staff portal.
 */

/**
 * @param {Object} template
 * @returns {Record<string, Array<{title: string, id: string}>>}
 */
export function getOjaDashboards(template) {
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

export const OJA_CARD_CLASS = 'bg-white border border-gray-200 rounded-2xl shadow-sm';
