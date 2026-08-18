/**
 * Provisioning queue queries for OU Met staff portal.
 */

import { fetchElasticsearchSearchWithAgent } from './elasticApi.js';

const SEARCH_AGENT = 'ok-fraud';

function getField(row, ...keys) {
    for (const k of keys) {
        const v = row[k];
        if (v != null && v !== '') return v;
    }
    return null;
}

const WORKFLOW_FILTERS = {
    awaiting_permission: { term: { permission_status: 'pending' } },
    awaiting_provision: {
        bool: {
            must: [
                { terms: { permission_status: ['auto_approved', 'approved'] } },
                { term: { provision_status: 'pending' } },
            ],
        },
    },
    auto_approved: { term: { permission_status: 'auto_approved' } },
    permission_granted: { term: { permission_status: 'approved' } },
    provisioning: { term: { provision_status: 'in_progress' } },
};

/**
 * @param {string} [filter] - status keyword or workflow filter id
 * @param {string} [agentId]
 * @returns {Promise<Object[]>}
 */
export async function getProvisioningRequests(filter = '', agentId = SEARCH_AGENT) {
    let query = { match_all: {} };
    if (filter && WORKFLOW_FILTERS[filter]) {
        query = WORKFLOW_FILTERS[filter];
    } else if (filter) {
        query = { term: { status: filter } };
    }

    const body = {
        size: 100,
        sort: [{ submitted_at: { order: 'desc' } }],
        query,
    };

    const data = await fetchElasticsearchSearchWithAgent(
        'provisioning-requests',
        body,
        agentId,
    );
    return (data.hits?.hits ?? []).map((hit) => hit._source ?? {});
}

/**
 * @param {string} researcherId
 * @param {string} [filter]
 * @param {string} [agentId]
 * @returns {Promise<Object[]>}
 */
export async function getProvisioningRequestsForResearcher(researcherId, filter = '', agentId = SEARCH_AGENT) {
    const researcherClause = { term: { researcher_id: researcherId } };
    let query = researcherClause;

    if (filter && WORKFLOW_FILTERS[filter]) {
        query = { bool: { must: [researcherClause, WORKFLOW_FILTERS[filter]] } };
    } else if (filter) {
        query = { bool: { must: [researcherClause, { term: { status: filter } }] } };
    }

    const body = {
        size: 50,
        sort: [{ submitted_at: { order: 'desc' } }],
        query,
    };

    const data = await fetchElasticsearchSearchWithAgent(
        'provisioning-requests',
        body,
        agentId,
    );
    return (data.hits?.hits ?? []).map((hit) => hit._source ?? {});
}

/**
 * @param {string} [agentId]
 * @returns {Promise<Object>}
 */
export async function getProvisioningStats(agentId = SEARCH_AGENT) {
    const query = {
        size: 0,
        aggs: {
            by_status: { terms: { field: 'status', size: 10 } },
            by_delivery: { terms: { field: 'delivery_mode', size: 10 } },
            by_permission: { terms: { field: 'permission_status', size: 10 } },
            by_provision: { terms: { field: 'provision_status', size: 10 } },
            awaiting_permission: { filter: { term: { permission_status: 'pending' } } },
            awaiting_provision: {
                filter: {
                    bool: {
                        must: [
                            { terms: { permission_status: ['auto_approved', 'approved'] } },
                            { term: { provision_status: 'pending' } },
                        ],
                    },
                },
            },
            auto_approved: { filter: { term: { permission_status: 'auto_approved' } } },
            provisioning_active: { filter: { term: { provision_status: 'in_progress' } } },
        },
    };

    const data = await fetchElasticsearchSearchWithAgent(
        'provisioning-requests',
        query,
        agentId,
    );

    const statusBuckets = data.aggregations?.by_status?.buckets ?? [];
    const deliveryBuckets = data.aggregations?.by_delivery?.buckets ?? [];

    const statusCount = (key) => {
        const bucket = statusBuckets.find((b) => b.key === key);
        return bucket?.doc_count ?? 0;
    };

    const deliveryCount = (key) => {
        const bucket = deliveryBuckets.find((b) => b.key === key);
        return bucket?.doc_count ?? 0;
    };

    const total = statusBuckets.reduce((sum, b) => sum + (b.doc_count ?? 0), 0);

    return {
        total,
        pending: statusCount('pending'),
        completed: statusCount('completed') + statusCount('complete'),
        failed: statusCount('failed'),
        approvalRequired: deliveryCount('approval_required'),
        awaitingPermission: data.aggregations?.awaiting_permission?.doc_count ?? 0,
        awaitingProvision: data.aggregations?.awaiting_provision?.doc_count ?? 0,
        autoApproved: data.aggregations?.auto_approved?.doc_count ?? 0,
        provisioningActive: data.aggregations?.provisioning_active?.doc_count ?? 0,
    };
}

export { getField, WORKFLOW_FILTERS };
