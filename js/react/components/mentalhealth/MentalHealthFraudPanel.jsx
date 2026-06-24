/**
 * MentalHealthFraudPanel — Fraud & compliance tab with live Elastic KPIs.
 */

import { useContext, useState, useEffect, useMemo } from 'react';
import { TemplateContext } from '../../context/TemplateContext.jsx';
import {
    getFraudYTDTotalLoss,
    getFraudTotalClaimsFlagged,
    getFraudHighPriorityCases,
    getFraudHighRiskClaimCount,
    getFraudLossByFlagType,
    getFraudInvestigationResolutionRate,
} from '../../../modules/utils/esqlQueries.js';
import KibanaDashboardLinks from './KibanaDashboardLinks.jsx';
import { MH_CARD_CLASS } from './mentalhealthUi.js';

function formatLastActivity(ts) {
    if (ts == null) return '—';
    const date = typeof ts === 'number' ? new Date(ts) : new Date(ts);
    if (Number.isNaN(date.getTime())) return '—';
    const diffDays = Math.floor((Date.now() - date) / (24 * 60 * 60 * 1000));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    return date.toLocaleDateString();
}

function getField(row, ...keys) {
    for (const k of keys) {
        const v = row[k];
        if (v != null && v !== '') return v;
    }
    return null;
}

function getRecipientIdFallback(row) {
    for (const v of Object.values(row)) {
        const s = v != null ? String(v).trim() : '';
        if (s === '') continue;
        if ((s.includes('MCD') || s.startsWith('OK-')) && /^[A-Za-z0-9_.-]+$/.test(s)) return s;
    }
    return null;
}

export default function MentalHealthFraudPanel({ onRecipientClick, flagFilter, onFlagFilterChange }) {
    const template = useContext(TemplateContext);
    const primaryColor = template?.colors?.primary || '#003366';
    const agentId = template?.elastic?.fraudAgentId || 'ok-fraud';

    const [totalLossYtd, setTotalLossYtd] = useState(null);
    const [totalLossLoading, setTotalLossLoading] = useState(true);
    const [totalLossError, setTotalLossError] = useState(null);
    const [totalClaimsFlagged, setTotalClaimsFlagged] = useState(null);
    const [totalClaimsFlaggedLoading, setTotalClaimsFlaggedLoading] = useState(true);
    const [highRiskCount, setHighRiskCount] = useState(null);
    const [resolutionRate, setResolutionRate] = useState(null);
    const [resolutionLoading, setResolutionLoading] = useState(true);
    const [lossByFlag, setLossByFlag] = useState([]);
    const [highPriorityCases, setHighPriorityCases] = useState([]);
    const [casesLoading, setCasesLoading] = useState(true);
    const [casesError, setCasesError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setTotalLossLoading(true);
        getFraudYTDTotalLoss(agentId)
            .then((v) => { if (!cancelled) { setTotalLossYtd(v); setTotalLossLoading(false); } })
            .catch((err) => { if (!cancelled) { setTotalLossError(err?.message); setTotalLossLoading(false); } });
        return () => { cancelled = true; };
    }, [agentId]);

    useEffect(() => {
        let cancelled = false;
        setTotalClaimsFlaggedLoading(true);
        getFraudTotalClaimsFlagged(agentId)
            .then((v) => { if (!cancelled) { setTotalClaimsFlagged(v); setTotalClaimsFlaggedLoading(false); } })
            .catch(() => { if (!cancelled) setTotalClaimsFlaggedLoading(false); });
        getFraudHighRiskClaimCount(agentId)
            .then((v) => { if (!cancelled) setHighRiskCount(v); });
        getFraudLossByFlagType(agentId, 5)
            .then((rows) => { if (!cancelled) setLossByFlag(rows); });
        return () => { cancelled = true; };
    }, [agentId]);

    useEffect(() => {
        let cancelled = false;
        setResolutionLoading(true);
        getFraudInvestigationResolutionRate(agentId)
            .then((v) => { if (!cancelled) { setResolutionRate(v); setResolutionLoading(false); } })
            .catch(() => { if (!cancelled) setResolutionLoading(false); });
        return () => { cancelled = true; };
    }, [agentId]);

    useEffect(() => {
        let cancelled = false;
        setCasesLoading(true);
        setCasesError(null);
        getFraudHighPriorityCases(agentId)
            .then((cases) => { if (!cancelled) { setHighPriorityCases(cases); setCasesLoading(false); } })
            .catch((err) => { if (!cancelled) { setCasesError(err?.message); setCasesLoading(false); } });
        return () => { cancelled = true; };
    }, [agentId]);

    const filteredCases = useMemo(() => {
        if (!flagFilter) return highPriorityCases;
        return highPriorityCases.filter((row) => {
            const ft = getField(row, 'Flag_Type', 'flag_type');
            return ft && String(ft).toLowerCase() === flagFilter.toLowerCase();
        });
    }, [highPriorityCases, flagFilter]);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className={`${MH_CARD_CLASS} p-5`}>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Total Potential Fraud YTD</h4>
                    {totalLossLoading ? (
                        <p className="text-2xl font-bold text-gray-400">Loading…</p>
                    ) : totalLossError ? (
                        <p className="text-sm text-red-600">{totalLossError}</p>
                    ) : (
                        <p className="text-2xl font-bold text-green-700">
                            {totalLossYtd != null
                                ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalLossYtd)
                                : '—'}
                        </p>
                    )}
                </div>
                <div className={`${MH_CARD_CLASS} p-5`}>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">High-Risk Claims</h4>
                    <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                        {highRiskCount != null ? highRiskCount.toLocaleString() : '—'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Risk Score ≥ 75</p>
                </div>
                <div className={`${MH_CARD_CLASS} p-5`}>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Claims Flagged</h4>
                    {totalClaimsFlaggedLoading ? (
                        <p className="text-2xl font-bold text-gray-400">Loading…</p>
                    ) : (
                        <p className="text-2xl font-bold text-gray-900">
                            {totalClaimsFlagged != null ? totalClaimsFlagged.toLocaleString() : '—'}
                        </p>
                    )}
                </div>
                <div className={`${MH_CARD_CLASS} p-5`}>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Investigation Resolution</h4>
                    {resolutionLoading ? (
                        <p className="text-2xl font-bold text-gray-400">Loading…</p>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-blue-600" style={{ width: `${resolutionRate ?? 0}%` }} />
                            </div>
                            <span className="text-xl font-bold">{resolutionRate != null ? `${resolutionRate}%` : '—'}</span>
                        </div>
                    )}
                </div>
            </div>

            {lossByFlag.length > 0 && (
                <div className={`${MH_CARD_CLASS} p-6 mb-8`}>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Loss by Flag Type</h3>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => onFlagFilterChange?.(null)}
                            className={`px-4 py-2 text-sm font-semibold rounded-full border ${!flagFilter ? 'text-white border-transparent' : 'border-gray-300 text-gray-700'}`}
                            style={!flagFilter ? { backgroundColor: primaryColor } : undefined}
                        >
                            All
                        </button>
                        {lossByFlag.map((row) => (
                            <button
                                key={row.Flag_Type}
                                type="button"
                                onClick={() => onFlagFilterChange?.(row.Flag_Type)}
                                className={`px-4 py-2 text-sm font-semibold rounded-full border ${
                                    flagFilter === row.Flag_Type ? 'text-white border-transparent' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                                style={flagFilter === row.Flag_Type ? { backgroundColor: primaryColor } : undefined}
                            >
                                {row.Flag_Type}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className={`${MH_CARD_CLASS} overflow-hidden mb-8`}>
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900">High-Priority Fraud Cases</h3>
                    {flagFilter && (
                        <span className="text-sm text-gray-500">Filtered: {flagFilter}</span>
                    )}
                </div>
                <div className="overflow-x-auto max-h-[20rem]">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="sticky top-0 bg-gray-50 px-6 py-3 font-semibold">Recipient</th>
                                <th className="sticky top-0 bg-gray-50 px-6 py-3 font-semibold">Priority</th>
                                <th className="sticky top-0 bg-gray-50 px-6 py-3 font-semibold">Timestamp</th>
                                <th className="sticky top-0 bg-gray-50 px-6 py-3 font-semibold">Flag Type</th>
                                <th className="sticky top-0 bg-gray-50 px-6 py-3 font-semibold">Agency</th>
                            </tr>
                        </thead>
                        <tbody>
                            {casesLoading ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading…</td></tr>
                            ) : casesError ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-red-600">{casesError}</td></tr>
                            ) : filteredCases.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No cases match</td></tr>
                            ) : (
                                filteredCases.map((row, i) => {
                                    const recipientId = getField(row, 'Medicaid_Recipient_ID', 'medicaid_recipient_id') ?? getRecipientIdFallback(row);
                                    const claimId = getField(row, 'Claim_ID', 'claim_id');
                                    const clickable = recipientId && typeof onRecipientClick === 'function';
                                    return (
                                        <tr key={String(claimId ?? i)} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                {clickable ? (
                                                    <button type="button" onClick={() => onRecipientClick(recipientId)} className="font-medium underline" style={{ color: primaryColor }}>
                                                        {recipientId}
                                                    </button>
                                                ) : (
                                                    <span className="font-medium">{recipientId ?? '—'}</span>
                                                )}
                                                <span className="text-gray-500 block text-xs">#{claimId ?? '—'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                    row.Priority === 'Critical' ? 'bg-red-100 text-red-800'
                                                        : row.Priority === 'High' ? 'bg-amber-100 text-amber-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {row.Priority ?? 'Medium'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{formatLastActivity(getField(row, '@timestamp', 'timestamp'))}</td>
                                            <td className="px-6 py-4 text-gray-700">{getField(row, 'Flag_Type', 'flag_type') ?? '—'}</td>
                                            <td className="px-6 py-4 text-gray-600">{getField(row, 'Agency_Type', 'agency_type') ?? '—'}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <KibanaDashboardLinks template={template} primaryColor={primaryColor} groups={['fraud', 'other']} />
        </>
    );
}
