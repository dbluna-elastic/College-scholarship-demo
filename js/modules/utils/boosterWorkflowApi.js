/**
 * Booster / Texas College alumni outreach email via Elastic Workflow.
 */

import { executeAgentBuilderTool } from './elasticApi.js';
import { extractWorkflowEmailContent, parseEmailDraft } from './workflowEmailUtils.js';

export const BOOSTER_AGENT = 'booster-donor-data';
export const BOOSTER_ALUMNI_EMAIL_WORKFLOW_ID = 'texas-college-alumni-outreach-email';
export const BOOSTER_ALUMNI_EMAIL_TOOL_ID = 'booster-alumni-email-workflow';

/**
 * @param {string} donorId
 * @param {Object} [options]
 * @param {string} [options.recipientEmail]
 * @param {string} [options.agentId]
 * @returns {Promise<{ subject: string, body: string, raw: string, recipientEmail?: string }>}
 */
export async function generateBoosterAlumniEmail(donorId, options = {}) {
    if (!donorId) throw new Error('Donor ID is required');

    const agentId = options.agentId || BOOSTER_AGENT;
    const response = await executeAgentBuilderTool(agentId, BOOSTER_ALUMNI_EMAIL_TOOL_ID, {
        donor_id: donorId,
        recipient_email: options.recipientEmail || '',
    });

    const raw = extractWorkflowEmailContent(response);
    if (!raw) {
        throw new Error('Workflow completed but returned no email content.');
    }

    const { subject, body } = parseEmailDraft(raw);
    return {
        subject,
        body,
        raw,
        recipientEmail: options.recipientEmail || '',
    };
}
