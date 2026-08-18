/**
 * Athletic advancement alumni outreach email via Elastic Workflow.
 */

import { useContext, useCallback } from 'react';
import { TemplateContext } from '../context/TemplateContext.jsx';
import WorkflowEmailButton from './WorkflowEmailButton.jsx';
import {
    generateBoosterAlumniEmail,
    BOOSTER_ALUMNI_EMAIL_WORKFLOW_ID,
} from '../../modules/utils/boosterWorkflowApi.js';

export default function BoosterGenerateEmailButton({
    donorId,
    recipientEmail = '',
    label,
    className = '',
    variant = 'primary',
}) {
    const template = useContext(TemplateContext);
    const agentId = template?.elastic?.boosterDataAgentId || 'booster-donor-data';
    const workflowId = template?.elastic?.workflows?.alumniEmail?.workflowId || BOOSTER_ALUMNI_EMAIL_WORKFLOW_ID;
    const buttonLabel = label || template?.content?.generateAlumniEmailLabel || 'Generate alumni email';

    const handleGenerate = useCallback(async (id, email) => {
        return generateBoosterAlumniEmail(id, { recipientEmail: email, agentId, workflowId });
    }, [agentId, workflowId]);

    return (
        <WorkflowEmailButton
            entityId={donorId}
            recipientEmail={recipientEmail}
            label={buttonLabel}
            workflowId={workflowId}
            onGenerate={handleGenerate}
            className={className}
            variant={variant}
        />
    );
}
