/**
 * SnapFraudPanel — Fraud intelligence tab with live Elastic KPIs and flagged entities.
 */

import { useContext, useEffect, useState } from 'react';
import { TemplateContext } from '../../context/TemplateContext.jsx';
import {
    getSnapOverviewStats,
    getSnapTopFlaggedEntities,
    getSnapSameCentStores,
    getSnapCrossStateIds,
} from '../../../modules/utils/snapFraudEsqlQueries.js';
import {
    SNAP_CARD_CLASS,
    getSnapDashboards,
    kibanaDashboardHref,
    kibanaCasesHref,
    kibanaAgentHref,
} from './snapFraudUi.js';

function severityBadge(severity) {
    const colors = {
        high: 'bg-red-100 text-red-800',
        medium: 'bg-amber-100 text-amber-800',
        low: 'bg-gray-100 text-gray-700',
    };
    return (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${colors[severity] || colors.low}`}>
            {severity || 'low'}
        </span>
    );
}

export default function SnapFraudPanel() {
    const template = useContext(TemplateContext);
    const primaryColor = template?.colors?.primary || '#1B5E20';
    const seeded = template?.elastic?.seededEntities || {};

    const [stats, setStats] = useState(null);
    const [flagged, setFlagged] = useState([]);
    const [sameCent, setSameCent] = useState([]);
    const [crossState, setCrossState] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        Promise.allSettled([
            getSnapOverviewStats(),
            getSnapTopFlaggedEntities(12),
            getSnapSameCentStores(8),
            getSnapCrossStateIds(6),
        ])
            .then((results) => {
                if (cancelled) return;
                const [statsResult, flaggedResult, sameCentResult, crossStateResult] = results;
                if (statsResult.status === 'fulfilled') setStats(statsResult.value);
                if (flaggedResult.status === 'fulfilled') setFlagged(flaggedResult.value);
                if (sameCentResult.status === 'fulfilled') setSameCent(sameCentResult.value);
                if (crossStateResult.status === 'fulfilled') setCrossState(crossStateResult.value);
                const failed = results.find((r) => r.status === 'rejected');
                if (failed) setError(failed.reason?.message || 'Failed to load SNAP data');
                setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    const dashboards = getSnapDashboards(template).fraud || [];

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Transactions (7d)', value: stats?.transactions7d },
                    { label: 'Flagged retailers', value: stats?.flaggedStores },
                    { label: 'Cross-state IDs', value: stats?.crossStateIds },
                    { label: 'Deceased beneficiary txs', value: stats?.deceasedTx },
                ].map((kpi) => (
                    <div key={kpi.label} className={`${SNAP_CARD_CLASS} p-5`}>
                        <p className="text-sm text-gray-600">{kpi.label}</p>
                        <p className="text-2xl font-bold mt-1" style={{ color: primaryColor }}>
                            {loading ? '…' : kpi.value != null ? kpi.value.toLocaleString() : '—'}
                        </p>
                    </div>
                ))}
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}. Ensure snap-* indices are loaded on gawdzilla and OK_KIBANA_API_KEY is set.
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={SNAP_CARD_CLASS}>
                    <div className="p-5 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900">Top fraud signals</h3>
                        <p className="text-sm text-gray-600">Combined same-cent, manual entry, and balance-drain patterns</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-left text-gray-600">
                                <tr>
                                    <th className="px-4 py-3">Entity</th>
                                    <th className="px-4 py-3">Signal</th>
                                    <th className="px-4 py-3">Metric</th>
                                    <th className="px-4 py-3">Severity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {flagged.map((row, idx) => (
                                    <tr key={`${row.entity_id}-${idx}`} className="border-t border-gray-100">
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-gray-900">{row.entity_id}</p>
                                            <p className="text-xs text-gray-500">{row.entity_type}</p>
                                        </td>
                                        <td className="px-4 py-3">{row.signal}</td>
                                        <td className="px-4 py-3">{row.metric}</td>
                                        <td className="px-4 py-3">{severityBadge(row.severity)}</td>
                                    </tr>
                                ))}
                                {!loading && flagged.length === 0 && (
                                    <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">No flagged entities found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={SNAP_CARD_CLASS}>
                    <div className="p-5 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900">Same-cent trafficking</h3>
                        <p className="text-sm text-gray-600">Stores with &gt;60% round-dollar EBT transactions</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-left text-gray-600">
                                <tr>
                                    <th className="px-4 py-3">Store</th>
                                    <th className="px-4 py-3">Same-cent %</th>
                                    <th className="px-4 py-3">Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sameCent.map((row) => (
                                    <tr key={row.store_id} className="border-t border-gray-100">
                                        <td className="px-4 py-3 font-semibold" style={{ color: row.store_id === seeded.sameCentStore ? primaryColor : undefined }}>
                                            {row.store_id}
                                            {row.store_id === seeded.sameCentStore && (
                                                <span className="ml-2 text-xs font-normal text-emerald-700">(seeded)</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {row.pct_round != null ? `${Math.round(Number(row.pct_round) * 100)}%` : '—'}
                                        </td>
                                        <td className="px-4 py-3">{row.same_cent}/{row.total}</td>
                                    </tr>
                                ))}
                                {!loading && sameCent.length === 0 && (
                                    <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-500">No records found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className={SNAP_CARD_CLASS}>
                <div className="p-5 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Cross-state identity matches</h3>
                    <p className="text-sm text-gray-600">SSN hashes appearing in multiple states</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-gray-600">
                            <tr>
                                <th className="px-4 py-3">SSN hash</th>
                                <th className="px-4 py-3">States</th>
                                <th className="px-4 py-3">State list</th>
                            </tr>
                        </thead>
                        <tbody>
                            {crossState.map((row) => (
                                <tr key={row.ssn_hash} className="border-t border-gray-100">
                                    <td className="px-4 py-3 font-mono text-xs">{row.ssn_hash}</td>
                                    <td className="px-4 py-3">{row.states}</td>
                                    <td className="px-4 py-3">
                                        {Array.isArray(row.state_list) ? row.state_list.join(', ') : row.state_list}
                                    </td>
                                </tr>
                            ))}
                            {!loading && crossState.length === 0 && (
                                <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-500">No records found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className={`${SNAP_CARD_CLASS} p-6`}>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Kibana & workflows</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Open the investigator dashboard, cases, or Agent Builder for deeper analysis and alert-driven workflows.
                </p>
                <div className="flex flex-wrap gap-3">
                    {dashboards.map((dash) => (
                        <a
                            key={dash.id}
                            href={kibanaDashboardHref(template, dash.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 rounded-full text-xs font-semibold text-white hover:opacity-90"
                            style={{ backgroundColor: primaryColor }}
                        >
                            {dash.title}
                        </a>
                    ))}
                    <a
                        href={kibanaCasesHref(template)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-full text-xs font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                        Open Cases
                    </a>
                    <a
                        href={kibanaAgentHref(template)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-full text-xs font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                        Agent Builder
                    </a>
                </div>
            </div>
        </div>
    );
}
