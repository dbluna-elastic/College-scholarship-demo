/**
 * MentalHealthStaffPortal — Tabbed ODMHSAS operations portal (fraud, crisis, clinical, grants).
 */

import { useContext, useState } from 'react';
import { TemplateContext } from '../context/TemplateContext.jsx';
import ChatWidget from './ChatWidget.jsx';
import MentalHealthStaffChrome from './mentalhealth/MentalHealthStaffChrome.jsx';
import MentalHealthFraudPanel from './mentalhealth/MentalHealthFraudPanel.jsx';
import CrisisOperationsPanel from './mentalhealth/CrisisOperationsPanel.jsx';
import ClinicalOutcomesPanel from './mentalhealth/ClinicalOutcomesPanel.jsx';
import GrantsProgramsPanel from './mentalhealth/GrantsProgramsPanel.jsx';

export default function MentalHealthStaffPortal({ onLogout, onRecipientClick, onClientClick, onOpenGrantsSearch }) {
    const template = useContext(TemplateContext);
    const tabLabels = template?.content?.staffDashboard?.tabs || {};
    const fraudAgentId = template?.elastic?.fraudAgentId || 'ok-fraud';

    const tabs = [
        { id: 'fraud', label: tabLabels.fraud || 'Fraud & Compliance' },
        { id: 'crisis', label: tabLabels.crisis || 'Crisis Operations' },
        { id: 'clinical', label: tabLabels.clinical || 'Clinical Outcomes' },
        { id: 'grants', label: tabLabels.grants || 'Grants & Programs' },
    ];

    const [activeTab, setActiveTab] = useState('fraud');
    const [flagFilter, setFlagFilter] = useState(null);

    return (
        <>
            <MentalHealthStaffChrome
                onLogout={onLogout}
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            >
                {activeTab === 'fraud' && (
                    <MentalHealthFraudPanel
                        onRecipientClick={onRecipientClick}
                        flagFilter={flagFilter}
                        onFlagFilterChange={setFlagFilter}
                    />
                )}
                {activeTab === 'crisis' && <CrisisOperationsPanel />}
                {activeTab === 'clinical' && (
                    <ClinicalOutcomesPanel onClientClick={onClientClick} />
                )}
                {activeTab === 'grants' && (
                    <GrantsProgramsPanel onOpenGrantsSearch={onOpenGrantsSearch} />
                )}
            </MentalHealthStaffChrome>
            <ChatWidget floating agentId={fraudAgentId} />
        </>
    );
}
