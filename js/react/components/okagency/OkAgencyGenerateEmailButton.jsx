/**
 * Grant program officer outreach email via Elastic Workflow (Grant Program Dashboard).
 */

import { useContext, useCallback } from 'react';
import { TemplateContext } from '../../context/TemplateContext.jsx';
import WorkflowEmailButton from '../WorkflowEmailButton.jsx';
import {
    generateGrantProgramEmail,
    GRANT_PROGRAM_EMAIL_WORKFLOW_ID,
} from '../../../modules/utils/grantsWorkflowApi.js';

export default function OkAgencyGenerateEmailButton({
    businessId,
    businessName,
    awardId,
    complianceAlert = '',
    financialStatus = '',
    recipientEmail = '',
    label,
    className = '',
    variant = 'secondary',
    compact = false,
}) {
    const template = useContext(TemplateContext);
    const agentId = template?.elastic?.agentId || 'ok-grants-data';
    const buttonLabel = label || template?.content?.staffDashboard?.generateProgramEmailLabel || 'Email';

    const handleGenerate = useCallback(async (_id, email) => {
        return generateGrantProgramEmail(
            {
                businessId,
                businessName,
                awardId,
                complianceAlert,
                financialStatus,
            },
            { recipientEmail: email || recipientEmail, agentId },
        );
    }, [businessId, businessName, awardId, complianceAlert, financialStatus, recipientEmail, agentId]);

    return (
        <WorkflowEmailButton
            entityId={awardId}
            recipientEmail={recipientEmail}
            label={buttonLabel}
            workflowId={GRANT_PROGRAM_EMAIL_WORKFLOW_ID}
            onGenerate={handleGenerate}
            className={className}
            variant={variant}
            compact={compact}
        />
    );
}
