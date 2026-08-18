/**
 * Booster / athletic advancement alumni outreach email via Elastic Workflow.
 */

import { runWorkflowForEmailDraft } from './workflowRunApi.js';
import { parseEmailDraft } from './workflowEmailUtils.js';

export const BOOSTER_AGENT = 'booster-donor-data';
export const BOOSTER_ALUMNI_EMAIL_WORKFLOW_ID = 'texas-college-alumni-outreach-email';
export const BOOSTER_ALUMNI_EMAIL_TOOL_ID = 'booster-alumni-email-workflow';
export const OKSTATE_ALUMNI_EMAIL_WORKFLOW_ID = 'oklahoma-state-alumni-outreach-email';
export const OKSTATE_ALUMNI_EMAIL_TOOL_ID = 'okstate-alumni-email-workflow';

/**
 * @param {string} donorId
 * @param {Object} [options]
 * @param {string} [options.recipientEmail]
 * @param {string} [options.agentId] - unused; kept for call-site compatibility
 * @param {string} [options.workflowId]
 * @returns {Promise<{ subject: string, body: string, raw: string, recipientEmail?: string }>}
 */
export async function generateBoosterAlumniEmail(donorId, options = {}) {
    if (!donorId) throw new Error('Donor ID is required');

    const workflowId = options.workflowId || BOOSTER_ALUMNI_EMAIL_WORKFLOW_ID;

    // Use Workflows /run API directly — Agent Builder workflow tools drop tool_params
    // because their schema.properties is empty when provisioned via API.
    const { raw } = await runWorkflowForEmailDraft(workflowId, {
        donor_id: donorId,
        recipient_email: options.recipientEmail || '',
    });

    const { subject, body } = parseEmailDraft(raw);
    return {
        subject,
        body,
        raw,
        recipientEmail: options.recipientEmail || '',
    };
}
