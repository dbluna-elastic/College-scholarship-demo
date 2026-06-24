/**
 * ClinicalOutcomesPanel — Substance use client outcomes tab.
 */

import { useContext, useEffect, useState } from 'react';
import { TemplateContext } from '../../context/TemplateContext.jsx';
import {
    getClinicalStatewideRelapseRate,
    getClinicalRelapseByCounty,
    getClinicalSubstanceBreakdown,
    getClinicalActiveClientCount,
    getClinicalClientList,
} from '../../../modules/utils/esqlQueries.js';
import KibanaDashboardLinks from './KibanaDashboardLinks.jsx';
import { MH_CARD_CLASS } from './mentalhealthUi.js';

export default function ClinicalOutcomesPanel({ onClientClick }) {
    const template = useContext(TemplateContext);
    const primaryColor = template?.colors?.primary || '#003366';
    const agentId = template?.elastic?.fraudAgentId || 'ok-fraud';

    const [relapseRate, setRelapseRate] = useState(null);
    const [activeClients, setActiveClients] = useState(null);
    const [counties, setCounties] = useState([]);
    const [substances, setSubstances] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            getClinicalStatewideRelapseRate(agentId),
            getClinicalActiveClientCount(agentId),
            getClinicalRelapseByCounty(agentId, 10),
            getClinicalSubstanceBreakdown(agentId, 8),
            getClinicalClientList(agentId, 20),
        ])
            .then(([rate, active, countyRows, substanceRows, clientRows]) => {
                if (!cancelled) {
                    setRelapseRate(rate);
                    setActiveClients(active);
                    setCounties(countyRows);
                    setSubstances(substanceRows);
                    setClients(clientRows);
                    setLoading(false);
                }
            })
            .catch(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [agentId]);

    const maxSubstance = Math.max(...substances.map((r) => Number(r.cnt) || 0), 1);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className={`${MH_CARD_CLASS} p-5`}>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Statewide Relapse Rate</h4>
                    <p className="text-3xl font-bold" style={{ color: primaryColor }}>
                        {loading ? '…' : relapseRate != null ? `${relapseRate}%` : '—'}
                    </p>
                </div>
                <div className={`${MH_CARD_CLASS} p-5`}>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Active Clients</h4>
                    <p className="text-3xl font-bold text-gray-900">
                        {loading ? '…' : activeClients != null ? activeClients.toLocaleString() : '—'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className={`${MH_CARD_CLASS} p-6`}>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Relapse Rate by County</h3>
                    {counties.length === 0 ? (
                        <p className="text-gray-500 text-sm">{loading ? 'Loading…' : 'No county data available.'}</p>
                    ) : (
                        <ul className="space-y-2 max-h-64 overflow-y-auto">
                            {counties.map((row) => (
                                <li key={row.County_Of_Relapse} className="flex justify-between text-sm text-gray-700">
                                    <span>{row.County_Of_Relapse}</span>
                                    <span className="font-semibold">{Math.round(Number(row.relapse_rate) * 100)}%</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className={`${MH_CARD_CLASS} p-6`}>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Primary Substance Breakdown</h3>
                    <ul className="space-y-3">
                        {substances.map((row) => (
                            <li key={row.primary_substance}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>{row.primary_substance}</span>
                                    <span className="font-semibold">{Number(row.cnt).toLocaleString()}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full"
                                        style={{ width: `${(Number(row.cnt) / maxSubstance) * 100}%`, backgroundColor: primaryColor }}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className={`${MH_CARD_CLASS} overflow-hidden mb-8`}>
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900">Recent Clients</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="px-6 py-3 font-semibold">Client ID</th>
                                <th className="px-6 py-3 font-semibold">Name</th>
                                <th className="px-6 py-3 font-semibold">County</th>
                                <th className="px-6 py-3 font-semibold">Primary Substance</th>
                                <th className="px-6 py-3 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">{loading ? 'Loading…' : 'No clients found'}</td></tr>
                            ) : (
                                clients.map((row) => (
                                    <tr key={row.Client_ID} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            {typeof onClientClick === 'function' ? (
                                                <button type="button" onClick={() => onClientClick(row.Client_ID)} className="font-medium underline" style={{ color: primaryColor }}>
                                                    {row.Client_ID}
                                                </button>
                                            ) : row.Client_ID}
                                        </td>
                                        <td className="px-6 py-4">{row.Name ?? '—'}</td>
                                        <td className="px-6 py-4">{row.county ?? '—'}</td>
                                        <td className="px-6 py-4">{row.primary_substance ?? '—'}</td>
                                        <td className="px-6 py-4">{row.status ?? '—'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <KibanaDashboardLinks template={template} primaryColor={primaryColor} groups={['clinical']} />
        </>
    );
}
