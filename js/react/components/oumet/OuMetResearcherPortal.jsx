/**
 * OuMetResearcherPortal — researcher view after test login (single-user provisioning status + catalog).
 */

import { useContext, useMemo, useState } from 'react';
import { TemplateContext } from '../../context/TemplateContext.jsx';
import ChatWidget from '../ChatWidget.jsx';
import TexasCollegeStaffChrome from '../texascollege/TexasCollegeStaffChrome.jsx';
import OuMetCatalogPanel from './OuMetCatalogPanel.jsx';
import OuMetResearcherProvisionPanel from './OuMetResearcherProvisionPanel.jsx';

export default function OuMetResearcherPortal({ onLogout }) {
    const template = useContext(TemplateContext);
    const researcher = template?.content?.researcherDashboard || {};
    const tabLabels = researcher.tabs || {};
    const catalogAgentId = template?.elastic?.catalogAgentId
        || template?.elastic?.agentId
        || 'ou-met-catalog-agent';
    const researcherId = researcher.demoResearcherId || 'grad-avery';

    const tabs = useMemo(() => ([
        { id: 'requests', label: tabLabels.requests || 'My Data Requests' },
        { id: 'catalog', label: tabLabels.catalog || 'Data Catalog' },
    ]), [tabLabels.requests, tabLabels.catalog]);

    const [activeTab, setActiveTab] = useState('requests');

    const subtitle = activeTab === 'catalog'
        ? 'Browse indexed THREDDS datasets and launch JupyterLite previews for Oklahoma subsets.'
        : (researcher.subtitle || 'Track mount requests and delivery status for your research VM.');

    return (
        <>
            <TexasCollegeStaffChrome
                onLogout={onLogout}
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                subtitle={subtitle}
                headerLabel={researcher.pageTitle || 'My Data Access'}
                dashboardContent={researcher}
            >
                {activeTab === 'requests' && (
                    <OuMetResearcherProvisionPanel researcherId={researcherId} />
                )}
                {activeTab === 'catalog' && (
                    <OuMetCatalogPanel embedded />
                )}
            </TexasCollegeStaffChrome>
            <ChatWidget
                key={catalogAgentId}
                floating
                agentId={catalogAgentId}
            />
        </>
    );
}
