/**
 * SnapFraudStaffPortal — SNAP fraud investigator operations portal.
 */

import { useContext } from 'react';
import { TemplateContext } from '../context/TemplateContext.jsx';
import ChatWidget from './ChatWidget.jsx';
import MentalHealthStaffChrome from './mentalhealth/MentalHealthStaffChrome.jsx';
import SnapFraudPanel from './snapfraud/SnapFraudPanel.jsx';

export default function SnapFraudStaffPortal({ onLogout }) {
    const template = useContext(TemplateContext);
    const tabLabels = template?.content?.staffDashboard?.tabs || {};
    const agentId = template?.elastic?.agentId || 'snap-fraud-investigator';

    const tabs = [
        { id: 'intelligence', label: tabLabels.intelligence || 'Fraud Intelligence' },
    ];

    return (
        <>
            <MentalHealthStaffChrome
                onLogout={onLogout}
                tabs={tabs}
                activeTab="intelligence"
                onTabChange={() => {}}
            >
                <SnapFraudPanel />
            </MentalHealthStaffChrome>
            <ChatWidget floating agentId={agentId} />
        </>
    );
}
