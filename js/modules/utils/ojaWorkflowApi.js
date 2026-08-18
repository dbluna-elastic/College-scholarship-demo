/**
 * OJA Elastic Workflow helpers — supervisor email draft via Workflows API.
 */

import { runWorkflowForEmailDraft } from './workflowRunApi.js';
import { parseEmailDraft } from './workflowEmailUtils.js';
import { OJA_AGENT } from './ojaEsqlQueries.js';

export const OJA_SUPERVISOR_EMAIL_WORKFLOW_ID = 'oja-supervisor-email-draft';
export const OJA_SUPERVISOR_EMAIL_TOOL_ID = 'oja-supervisor-email-workflow';

/**
 * Run the OJA supervisor email workflow and return parsed subject/body.
 *
 * @param {string} youthId
 * @param {Object} [options]
 * @param {string} [options.recipientEmail]
 * @param {string} [options.agentId] - unused; kept for call-site compatibility
 * @returns {Promise<{ subject: string, body: string, raw: string }>}
 */
export async function generateOjaSupervisorEmail(youthId, options = {}) {
    if (!youthId) throw new Error('Youth ID is required');

    const { raw } = await runWorkflowForEmailDraft(OJA_SUPERVISOR_EMAIL_WORKFLOW_ID, {
        youth_id: youthId,
        recipient_email: options.recipientEmail || '',
    });

    const { subject, body } = parseEmailDraft(raw);
    return { subject, body, raw };
}

// Re-export for any imports that expected OJA_AGENT from this module
export { OJA_AGENT };
