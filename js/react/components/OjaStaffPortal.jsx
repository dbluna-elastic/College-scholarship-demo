/**
 * OjaStaffPortal — Tabbed OJA operations portal for juvenile justice staff.
 */

import { useContext, useState } from 'react';
import { TemplateContext } from '../context/TemplateContext.jsx';
import ChatWidget from './ChatWidget.jsx';
import MentalHealthStaffChrome from './mentalhealth/MentalHealthStaffChrome.jsx';
import OjaOverviewPanel from './oja/OjaOverviewPanel.jsx';
import OjaAssessmentsPanel from './oja/OjaAssessmentsPanel.jsx';
import OjaCaseNotesPanel from './oja/OjaCaseNotesPanel.jsx';

export default function OjaStaffPortal({ onLogout, onYouthClick }) {
    const template = useContext(TemplateContext);
    const tabLabels = template?.content?.staffDashboard?.tabs || {};
    const agentId = template?.elastic?.agentId || 'ok-oja-data';

    const tabs = [
        { id: 'overview', label: tabLabels.overview || 'Case Overview' },
        { id: 'assessments', label: tabLabels.assessments || 'Assessments & Outcomes' },
        { id: 'notes', label: tabLabels.notes || 'Case Notes' },
    ];

    const [activeTab, setActiveTab] = useState('overview');

    return (
        <>
            <MentalHealthStaffChrome
                onLogout={onLogout}
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            >
                {activeTab === 'overview' && <OjaOverviewPanel onYouthClick={onYouthClick} />}
                {activeTab === 'assessments' && <OjaAssessmentsPanel onYouthClick={onYouthClick} />}
                {activeTab === 'notes' && <OjaCaseNotesPanel onYouthClick={onYouthClick} />}
            </MentalHealthStaffChrome>
            <ChatWidget floating agentId={agentId} />
        </>
    );
}
