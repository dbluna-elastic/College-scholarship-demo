/**
 * Shared UI helpers for snapfraud staff portal.
 */

/**
 * @param {Object} template
 * @returns {Record<string, Array<{title: string, id: string}>>}
 */
export function getSnapDashboards(template) {
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

/**
 * @param {Object} template
 * @returns {string}
 */
export function kibanaCasesHref(template) {
    const base = (template?.elastic?.kibanaUrl || '').replace(/\/$/, '');
    return `${base}/app/observability/cases`;
}

/**
 * @param {Object} template
 * @returns {string}
 */
export function kibanaAgentHref(template) {
    const base = (template?.elastic?.kibanaUrl || '').replace(/\/$/, '');
    const agentId = template?.elastic?.agentId || 'snap-fraud-investigator';
    return `${base}/app/agent_builder/chat/${agentId}`;
}

export const SNAP_CARD_CLASS = 'bg-white border border-gray-200 rounded-2xl shadow-sm';
