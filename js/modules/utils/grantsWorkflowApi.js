/**
 * Oklahoma Agency grant program officer email via Elastic Workflow.
 */

import { executeAgentBuilderTool } from './elasticApi.js';
import { extractWorkflowEmailContent, parseEmailDraft } from './workflowEmailUtils.js';

export const GRANTS_AGENT = 'ok-grants-data';
export const GRANT_PROGRAM_EMAIL_WORKFLOW_ID = 'ok-grant-program-officer-email';
export const GRANT_PROGRAM_EMAIL_TOOL_ID = 'ok-grants-program-email-workflow';

/**
 * @param {Object} params
 * @param {string} params.businessId
 * @param {string} params.businessName
 * @param {string} params.awardId
 * @param {string} [params.complianceAlert]
 * @param {string} [params.financialStatus]
 * @param {Object} [options]
 * @param {string} [options.recipientEmail]
 * @param {string} [options.agentId]
 * @returns {Promise<{ subject: string, body: string, raw: string, recipientEmail?: string }>}
 */
export async function generateGrantProgramEmail(params, options = {}) {
    const businessId = params?.businessId;
    const businessName = params?.businessName;
    const awardId = params?.awardId;
    if (!businessId || !businessName || !awardId) {
        throw new Error('Business ID, name, and award ID are required');
    }

    const agentId = options.agentId || GRANTS_AGENT;
    const response = await executeAgentBuilderTool(agentId, GRANT_PROGRAM_EMAIL_TOOL_ID, {
        business_id: businessId,
        business_name: businessName,
        award_id: awardId,
        compliance_alert: params.complianceAlert || '',
        financial_status: params.financialStatus || '',
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
