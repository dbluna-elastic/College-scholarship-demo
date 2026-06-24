/**
 * Texas College alumni outreach email via Elastic Workflow.
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
    const buttonLabel = label || template?.content?.generateAlumniEmailLabel || 'Generate alumni email';

    const handleGenerate = useCallback(async (id, email) => {
        return generateBoosterAlumniEmail(id, { recipientEmail: email, agentId });
    }, [agentId]);

    return (
        <WorkflowEmailButton
            entityId={donorId}
            recipientEmail={recipientEmail}
            label={buttonLabel}
            workflowId={BOOSTER_ALUMNI_EMAIL_WORKFLOW_ID}
            onGenerate={handleGenerate}
            className={className}
            variant={variant}
        />
    );
}
