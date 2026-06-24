/**
 * CrisisOperationsPanel — Crisis call center & dispatch KPIs.
 */

import { useContext, useEffect, useState } from 'react';
import { TemplateContext } from '../../context/TemplateContext.jsx';
import {
    getCrisisCallCenterStats,
    getCrisisCallDispositions,
    getCrisisMcotOutcomes,
    getCrisisHousingAtDischarge,
} from '../../../modules/utils/esqlQueries.js';
import KibanaDashboardLinks from './KibanaDashboardLinks.jsx';
import { MH_CARD_CLASS } from './mentalhealthUi.js';

function BreakdownList({ title, rows, labelKey, valueKey }) {
    if (!rows?.length) return null;
    const max = Math.max(...rows.map((r) => Number(r[valueKey]) || 0), 1);
    return (
        <div className={`${MH_CARD_CLASS} p-6`}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
            <ul className="space-y-3">
                {rows.map((row) => (
                    <li key={row[labelKey]}>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700">{row[labelKey]}</span>
                            <span className="font-semibold text-gray-900">{Number(row[valueKey]).toLocaleString()}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-sky-600 rounded-full"
                                style={{ width: `${(Number(row[valueKey]) / max) * 100}%` }}
                            />
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function CrisisOperationsPanel() {
    const template = useContext(TemplateContext);
    const primaryColor = template?.colors?.primary || '#003366';
    const agentId = template?.elastic?.fraudAgentId || 'ok-fraud';
    const slaThreshold = template?.content?.staffDashboard?.crisisAlertThresholdSeconds ?? 120;

    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [dispositions, setDispositions] = useState([]);
    const [mcotOutcomes, setMcotOutcomes] = useState([]);
    const [housing, setHousing] = useState([]);

    useEffect(() => {
        let cancelled = false;
        setStatsLoading(true);
        Promise.all([
            getCrisisCallCenterStats(agentId),
            getCrisisCallDispositions(agentId, 6),
            getCrisisMcotOutcomes(agentId, 6),
            getCrisisHousingAtDischarge(agentId, 6),
        ])
            .then(([s, d, m, h]) => {
                if (!cancelled) {
                    setStats(s);
                    setDispositions(d);
                    setMcotOutcomes(m);
                    setHousing(h);
                    setStatsLoading(false);
                }
            })
            .catch(() => { if (!cancelled) setStatsLoading(false); });
        return () => { cancelled = true; };
    }, [agentId]);

    const slaBreached = stats?.avgAnswerSeconds != null && stats.avgAnswerSeconds > slaThreshold;

    return (
        <>
            {slaBreached && (
                <div className="mb-6 rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 text-orange-900 text-sm font-medium">
                    {template?.content?.staffDashboard?.crisisAlertMessage
                        || 'Crisis call answer time exceeds SLA — review call center staffing.'}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className={`${MH_CARD_CLASS} p-5`}>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Avg Call Answer Time</h4>
                    {statsLoading ? (
                        <p className="text-2xl font-bold text-gray-400">Loading…</p>
                    ) : (
                        <p className={`text-2xl font-bold ${slaBreached ? 'text-orange-600' : 'text-gray-900'}`}>
                            {stats?.avgAnswerSeconds != null ? `${Math.round(stats.avgAnswerSeconds)}s` : '—'}
                        </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">SLA target: {slaThreshold}s</p>
                </div>
                <div className={`${MH_CARD_CLASS} p-5`}>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Calls Received</h4>
                    <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                        {stats?.totalCalls != null ? stats.totalCalls.toLocaleString() : statsLoading ? '…' : '—'}
                    </p>
                </div>
                <div className={`${MH_CARD_CLASS} p-5`}>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Avg MCOT Response</h4>
                    <p className="text-2xl font-bold text-gray-900">
                        {stats?.avgMcotSeconds != null ? `${Math.round(stats.avgMcotSeconds)}s` : statsLoading ? '…' : '—'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <BreakdownList title="Outcome of Call" rows={dispositions} labelKey="Call_Disposition_Code" valueKey="cnt" />
                <BreakdownList title="MCOT Outcomes" rows={mcotOutcomes} labelKey="MCOT_Outcome_Code" valueKey="cnt" />
            </div>

            <BreakdownList title="Discharged Housing Status" rows={housing} labelKey="Discharge_Housing_Status" valueKey="cnt" />

            <KibanaDashboardLinks template={template} primaryColor={primaryColor} groups={['crisis']} />
        </>
    );
}
