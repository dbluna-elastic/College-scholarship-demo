/**
 * OJA supervisor email via Elastic Workflow (wrapper around shared WorkflowEmailButton).
 */

import { useContext, useCallback } from 'react';
import { TemplateContext } from '../../context/TemplateContext.jsx';
import WorkflowEmailButton from '../WorkflowEmailButton.jsx';
import { generateOjaSupervisorEmail, OJA_SUPERVISOR_EMAIL_WORKFLOW_ID } from '../../../modules/utils/ojaWorkflowApi.js';

export default function OjaGenerateEmailButton({
    youthId,
    recipientEmail = '',
    label,
    className = '',
    variant = 'primary',
}) {
    const template = useContext(TemplateContext);
    const agentId = template?.elastic?.agentId || 'ok-oja-data';
    const buttonLabel = label || template?.content?.staffDashboard?.generateEmailLabel || 'Generate supervisor email';

    const handleGenerate = useCallback(async (id, email) => {
        return generateOjaSupervisorEmail(id, { recipientEmail: email, agentId });
    }, [agentId]);

    return (
        <WorkflowEmailButton
            entityId={youthId}
            recipientEmail={recipientEmail}
            label={buttonLabel}
            workflowId={OJA_SUPERVISOR_EMAIL_WORKFLOW_ID}
            onGenerate={handleGenerate}
            className={className}
            variant={variant}
        />
    );
}
