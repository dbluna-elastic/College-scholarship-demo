/**
 * WyomingStaffPortal — ETS data classification operations portal.
 */

import { useContext } from 'react';
import { TemplateContext } from '../context/TemplateContext.jsx';
import ChatWidget from './ChatWidget.jsx';
import MentalHealthStaffChrome from './mentalhealth/MentalHealthStaffChrome.jsx';
import WyomingClassifyPanel from './wyoming/WyomingClassifyPanel.jsx';

export default function WyomingStaffPortal({ onLogout }) {
    const template = useContext(TemplateContext);
    const tabLabels = template?.content?.staffDashboard?.tabs || {};
    const agentId = template?.elastic?.agentId || 'wyo-classify';

    const tabs = [
        { id: 'overview', label: tabLabels.overview || 'Classification Overview' },
    ];

    return (
        <>
            <MentalHealthStaffChrome
                onLogout={onLogout}
                tabs={tabs}
                activeTab="overview"
                onTabChange={() => {}}
            >
                <WyomingClassifyPanel />
            </MentalHealthStaffChrome>
            <ChatWidget floating agentId={agentId} />
        </>
    );
}
