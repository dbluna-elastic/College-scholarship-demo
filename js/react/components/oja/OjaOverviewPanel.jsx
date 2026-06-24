/**
 * OjaOverviewPanel — active caseload, county breakdown, high-priority youth.
 */

import { useContext, useEffect, useState } from 'react';
import { TemplateContext } from '../../context/TemplateContext.jsx';
import {
    getOjaOverviewStats,
    getOjaHighPriorityYouth,
    getOjaCountyBreakdown,
} from '../../../modules/utils/ojaEsqlQueries.js';
import { OJA_CARD_CLASS, getOjaDashboards, kibanaDashboardHref } from './ojaUi.js';

export default function OjaOverviewPanel({ onYouthClick }) {
    const template = useContext(TemplateContext);
    const primaryColor = template?.colors?.primary || '#1B3A5C';

    const [stats, setStats] = useState(null);
    const [youth, setYouth] = useState([]);
    const [counties, setCounties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.allSettled([
            getOjaOverviewStats(),
            getOjaHighPriorityYouth(12),
            getOjaCountyBreakdown(8),
        ])
            .then((results) => {
                if (cancelled) return;
                const [statsResult, youthResult, countiesResult] = results;
                if (statsResult.status === 'fulfilled') setStats(statsResult.value);
                if (youthResult.status === 'fulfilled') setYouth(youthResult.value);
                if (countiesResult.status === 'fulfilled') setCounties(countiesResult.value);
                setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    const dashboards = getOjaDashboards(template).overview || [];

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Active supervision', value: stats?.activeYouth },
                    { label: 'Pending intakes', value: stats?.pendingYouth },
                    { label: 'Avg risk score', value: stats?.avgRisk != null ? stats.avgRisk.toFixed(1) : null },
                    { label: '12-mo recidivism', value: stats?.recidivism12mo != null ? `${Math.round(stats.recidivism12mo * 100)}%` : null },
                ].map((kpi) => (
                    <div key={kpi.label} className={`${OJA_CARD_CLASS} p-5`}>
                        <p className="text-sm text-gray-600">{kpi.label}</p>
                        <p className="text-2xl font-bold mt-1" style={{ color: primaryColor }}>
                            {loading ? '…' : kpi.value != null ? (typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value) : '—'}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={OJA_CARD_CLASS}>
                    <div className="p-5 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900">High-priority youth</h3>
                        <p className="text-sm text-gray-600">Active or pending cases with intensive or moderate supervision</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-left text-gray-600">
                                <tr>
                                    <th className="px-4 py-3">Youth</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">County</th>
                                    <th className="px-4 py-3">Officer</th>
                                </tr>
                            </thead>
                            <tbody>
                                {youth.map((row) => (
                                    <tr key={row.youth_id} className="border-t border-gray-100 hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                className="font-semibold text-left hover:underline"
                                                style={{ color: primaryColor }}
                                                onClick={() => onYouthClick?.(row.youth_id)}
                                            >
                                                {row.first_name} {row.last_name}
                                            </button>
                                            <p className="text-xs text-gray-500">{row.youth_id}</p>
                                        </td>
                                        <td className="px-4 py-3">{row.case_status} · {row.supervision_level}</td>
                                        <td className="px-4 py-3">{row.county}</td>
                                        <td className="px-4 py-3">{row.assigned_officer}</td>
                                    </tr>
                                ))}
                                {!loading && youth.length === 0 && (
                                    <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">No records found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={OJA_CARD_CLASS}>
                    <div className="p-5 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900">Caseload by county</h3>
                    </div>
                    <ul className="divide-y divide-gray-100">
                        {counties.map((row) => (
                            <li key={row.county} className="flex justify-between px-5 py-3 text-sm">
                                <span className="font-medium text-gray-800">{row.county}</span>
                                <span className="font-bold" style={{ color: primaryColor }}>{Number(row.caseload).toLocaleString()}</span>
                            </li>
                        ))}
                        {!loading && counties.length === 0 && (
                            <li className="px-5 py-6 text-center text-gray-500">No county data</li>
                        )}
                    </ul>
                </div>
            </div>

            {dashboards.length > 0 && (
                <div className={`${OJA_CARD_CLASS} p-6`}>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Kibana dashboards</h3>
                    <div className="flex flex-wrap gap-2">
                        {dashboards.map((dash) => (
                            <a
                                key={dash.id}
                                href={kibanaDashboardHref(template, dash.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 rounded-full text-xs font-semibold text-white"
                                style={{ backgroundColor: primaryColor }}
                            >
                                {dash.title}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
