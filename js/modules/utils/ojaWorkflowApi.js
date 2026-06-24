/**
 * OJA Elastic Workflow helpers — supervisor email draft via Agent Builder workflow tool.
 */

import { executeAgentBuilderTool } from './elasticApi.js';
import { extractWorkflowEmailContent, parseEmailDraft } from './workflowEmailUtils.js';
import { OJA_AGENT } from './ojaEsqlQueries.js';

export const OJA_SUPERVISOR_EMAIL_WORKFLOW_ID = 'oja-supervisor-email-draft';
export const OJA_SUPERVISOR_EMAIL_TOOL_ID = 'oja-supervisor-email-workflow';

/**
 * Run the OJA supervisor email workflow tool and return parsed subject/body.
 *
 * @param {string} youthId
 * @param {Object} [options]
 * @param {string} [options.recipientEmail]
 * @param {string} [options.agentId]
 * @returns {Promise<{ subject: string, body: string, raw: string }>}
 */
export async function generateOjaSupervisorEmail(youthId, options = {}) {
    if (!youthId) throw new Error('Youth ID is required');

    const agentId = options.agentId || OJA_AGENT;
    const response = await executeAgentBuilderTool(agentId, OJA_SUPERVISOR_EMAIL_TOOL_ID, {
        youth_id: youthId,
        recipient_email: options.recipientEmail || '',
    });

    const raw = extractWorkflowEmailContent(response);
    if (!raw) {
        throw new Error('Workflow completed but returned no email content.');
    }

    const { subject, body } = parseEmailDraft(raw);
    return { subject, body, raw };
}
