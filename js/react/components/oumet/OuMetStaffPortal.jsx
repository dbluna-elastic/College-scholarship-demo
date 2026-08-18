/**
 * OuMetStaffPortal — data ops portal with provisioning queue and ops assistant chat.
 */

import { useContext, useMemo, useState } from 'react';
import { TemplateContext } from '../../context/TemplateContext.jsx';
import ChatWidget from '../ChatWidget.jsx';
import TexasCollegeStaffChrome from '../texascollege/TexasCollegeStaffChrome.jsx';
import ProvisioningQueuePanel from './ProvisioningQueuePanel.jsx';

export default function OuMetStaffPortal({ onLogout }) {
    const template = useContext(TemplateContext);
    const tabLabels = template?.content?.staffDashboard?.tabs || {};
    const provisioningAgentId = template?.elastic?.provisioningAgentId
        || template?.elastic?.staffAgentId
        || 'ou-met-provisioning-agent';
    const staff = template?.content?.staffDashboard || {};

    const tabs = useMemo(() => ([
        { id: 'queue', label: tabLabels.queue || 'Provisioning Queue' },
        { id: 'ops', label: tabLabels.ops || 'Ops Assistant' },
    ]), [tabLabels.queue, tabLabels.ops]);

    const [activeTab, setActiveTab] = useState('queue');

    const subtitle = activeTab === 'ops'
        ? 'Chat with the provisioning ops agent to review pending mounts, approvals, and failures.'
        : (staff.subtitle || 'Monitor provisioning-requests on the Gawdzilla Elastic deployment.');

    return (
        <>
            <TexasCollegeStaffChrome
                onLogout={onLogout}
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                subtitle={subtitle}
            >
                {activeTab === 'queue' && <ProvisioningQueuePanel />}
                {activeTab === 'ops' && (
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <p className="text-gray-600 text-sm mb-4">
                            Use the floating chat assistant to query the provisioning queue, approve requests, or check delivery status.
                            Tap the * button in the chat footer for sample ops queries.
                        </p>
                        <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                            <li>Pending auto-mount requests (reanalysis, NEXRAD)</li>
                            <li>Approval-required research datasets (CCS034, ACARS)</li>
                            <li>Completed deliveries with access URLs</li>
                        </ul>
                    </div>
                )}
            </TexasCollegeStaffChrome>
            {activeTab === 'ops' && (
                <ChatWidget
                    key={provisioningAgentId}
                    floating
                    agentId={provisioningAgentId}
                />
            )}
        </>
    );
}
