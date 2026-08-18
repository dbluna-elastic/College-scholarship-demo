/**
 * TexasCollegeStaffPortal — Tabbed athletic advancement portal (donor engagement + game day revenue).
 */

import { useContext, useMemo, useState } from 'react';
import { TemplateContext } from '../context/TemplateContext.jsx';
import ChatWidget from './ChatWidget.jsx';
import TexasCollegeStaffChrome from './texascollege/TexasCollegeStaffChrome.jsx';
import BoosterEngagementPanel from './texascollege/BoosterEngagementPanel.jsx';
import GamedayRevenuePanel from './texascollege/GamedayRevenuePanel.jsx';
import OkStateGamedayRevenuePanel from './okstate/OkStateGamedayRevenuePanel.jsx';
import { GAMEDAY_AGENT } from '../../modules/utils/gamedayEsqlQueries.js';

export default function TexasCollegeStaffPortal({ onLogout, onDonorClick }) {
    const template = useContext(TemplateContext);
    const tabLabels = template?.content?.staffDashboard?.tabs || {};
    const boosterAgentId = template?.elastic?.boosterDataAgentId || template?.elastic?.agents?.donors || 'booster-donor-data';
    const gamedayAgentId = template?.elastic?.gamedayDataAgentId || template?.elastic?.agents?.gameday || GAMEDAY_AGENT;
    const staff = template?.content?.staffDashboard || {};

    const tabs = useMemo(() => ([
        { id: 'donors', label: tabLabels.donors || 'Donor Engagement' },
        { id: 'gameday', label: tabLabels.gameday || 'Game Day Revenue' },
    ]), [tabLabels.donors, tabLabels.gameday]);

    const gamedayModel = template?.elastic?.gamedayRevenue?.model;
    const isPosGameday = gamedayModel === 'pos';
    const [activeTab, setActiveTab] = useState('donors');

    const activeAgentId = activeTab === 'gameday' ? gamedayAgentId : boosterAgentId;

    const subtitle = activeTab === 'gameday'
        ? (staff.gamedaySubtitle || 'Team store retail from a 100-item campus bookstore catalog at stadium shops.')
        : (staff.subtitle || 'Live insights from athletic-boosters, booster-engagement-events, and booster-case-metrics on the gawdzilla Elastic deployment.');

    return (
        <>
            <TexasCollegeStaffChrome
                onLogout={onLogout}
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                subtitle={subtitle}
            >
                {activeTab === 'donors' && <BoosterEngagementPanel onDonorClick={onDonorClick} />}
                {activeTab === 'gameday' && (isPosGameday ? <OkStateGamedayRevenuePanel /> : <GamedayRevenuePanel />)}
            </TexasCollegeStaffChrome>
            <ChatWidget
                key={activeAgentId}
                floating
                agentId={activeAgentId}
                onDonorClick={onDonorClick}
                chatContext={activeTab}
            />
        </>
    );
}
