/**
 * WyomingClassifyPanel — staff KPIs, pending queue, agencies, and public-share spillage.
 */

import { useContext, useEffect, useState } from 'react';
import { TemplateContext } from '../../context/TemplateContext.jsx';
import {
    getWyoOverviewStats,
    getWyoCountsByLevel,
    getWyoPendingQueue,
    getWyoCountsByAgency,
    getWyoPublicShareSpillage,
} from '../../../modules/utils/wyomingClassifyEsqlQueries.js';
import {
    WYO_CARD_CLASS,
    getWyoDashboards,
    kibanaDashboardHref,
    levelBadgeClass,
} from './wyomingUi.js';

function formatCategories(value) {
    if (Array.isArray(value)) return value.filter(Boolean).join(', ') || '—';
    if (typeof value === 'string' && value.trim()) return value;
    return '—';
}

export default function WyomingClassifyPanel() {
    const template = useContext(TemplateContext);
    const primaryColor = template?.colors?.primary || 'var(--primary-color)';
    const staff = template?.content?.staffDashboard || {};
    const kpiLabels = template?.content?.reportsSection?.kpiLabels || {};

    const [stats, setStats] = useState(null);
    const [levels, setLevels] = useState([]);
    const [queue, setQueue] = useState([]);
    const [agencies, setAgencies] = useState([]);
    const [spillage, setSpillage] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        Promise.allSettled([
            getWyoOverviewStats(),
            getWyoCountsByLevel(),
            getWyoPendingQueue(20),
            getWyoCountsByAgency(),
            getWyoPublicShareSpillage(10),
        ]).then((results) => {
            if (cancelled) return;
            const [statsResult, levelsResult, queueResult, agenciesResult, spillageResult] = results;
            if (statsResult.status === 'fulfilled') setStats(statsResult.value);
            if (levelsResult.status === 'fulfilled') setLevels(levelsResult.value);
            if (queueResult.status === 'fulfilled') setQueue(queueResult.value);
            if (agenciesResult.status === 'fulfilled') setAgencies(agenciesResult.value);
            if (spillageResult.status === 'fulfilled') setSpillage(spillageResult.value);
            const failed = results.find((r) => r.status === 'rejected');
            if (failed) setError(failed.reason?.message || staff.loadError || 'Failed to load classification data');
            setLoading(false);
        });
        return () => { cancelled = true; };
    }, [staff.loadError]);

    const dashboards = getWyoDashboards(template).overview || getWyoDashboards(template).all || [];

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: kpiLabels.totalDocs || 'Total documents', value: stats?.totalDocs },
                    { label: kpiLabels.restricted || 'Restricted', value: stats?.restricted },
                    { label: kpiLabels.pendingReview || 'Pending review', value: stats?.pendingReview },
                    { label: kpiLabels.spillageAlerts || 'Spillage alerts', value: stats?.spillageAlerts },
                ].map((kpi) => (
                    <div key={kpi.label} className={`${WYO_CARD_CLASS} p-5`}>
                        <p className="text-sm text-gray-600">{kpi.label}</p>
                        <p className="text-2xl font-bold mt-1" style={{ color: primaryColor }}>
                            {loading ? '…' : kpi.value != null ? kpi.value.toLocaleString() : '—'}
                        </p>
                    </div>
                ))}
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={WYO_CARD_CLASS}>
                    <div className="p-5 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900">{staff.levelsHeading || 'Documents by level'}</h3>
                        <p className="text-sm text-gray-600">{staff.levelsSubtitle || ''}</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-left text-gray-600">
                                <tr>
                                    <th className="px-4 py-3">{staff.colLevel || 'Level'}</th>
                                    <th className="px-4 py-3">{staff.colCount || 'Count'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {levels.map((row) => (
                                    <tr key={row.level} className="border-t border-gray-100">
                                        <td className="px-4 py-3">
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${levelBadgeClass(row.level)}`}>
                                                {row.level}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-semibold">{row.count.toLocaleString()}</td>
                                    </tr>
                                ))}
                                {!loading && levels.length === 0 && (
                                    <tr>
                                        <td colSpan={2} className="px-4 py-6 text-center text-gray-500">{staff.emptyLevels || 'No classified documents found'}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={WYO_CARD_CLASS}>
                    <div className="p-5 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900">{staff.agenciesHeading || 'Owner agencies'}</h3>
                        <p className="text-sm text-gray-600">{staff.agenciesSubtitle || ''}</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-left text-gray-600">
                                <tr>
                                    <th className="px-4 py-3">{staff.colAgency || 'Agency'}</th>
                                    <th className="px-4 py-3">{staff.colCount || 'Count'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {agencies.map((row) => (
                                    <tr key={row.agency} className="border-t border-gray-100">
                                        <td className="px-4 py-3 font-semibold text-gray-900">{row.agency}</td>
                                        <td className="px-4 py-3">{row.count.toLocaleString()}</td>
                                    </tr>
                                ))}
                                {!loading && agencies.length === 0 && (
                                    <tr>
                                        <td colSpan={2} className="px-4 py-6 text-center text-gray-500">{staff.emptyAgencies || 'No agency breakdown found'}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className={WYO_CARD_CLASS}>
                <div className="p-5 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">{staff.queueHeading || 'Pending review'}</h3>
                    <p className="text-sm text-gray-600">{staff.queueSubtitle || ''}</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-gray-600">
                            <tr>
                                <th className="px-4 py-3">{staff.colFile || 'File'}</th>
                                <th className="px-4 py-3">{staff.colAgency || 'Agency'}</th>
                                <th className="px-4 py-3">{staff.colLevel || 'Level'}</th>
                                <th className="px-4 py-3">{staff.colConfidence || 'Confidence'}</th>
                                <th className="px-4 py-3">{staff.colZone || 'Zone'}</th>
                                <th className="px-4 py-3">{staff.colCategories || 'Categories'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {queue.map((row, idx) => (
                                <tr key={`${row.fileName}-${idx}`} className="border-t border-gray-100">
                                    <td className="px-4 py-3 font-semibold text-gray-900">{row.fileName}</td>
                                    <td className="px-4 py-3">{row.agency}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${levelBadgeClass(row.level)}`}>
                                            {row.level}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {row.confidence != null ? `${Math.round(row.confidence * 100)}%` : '—'}
                                    </td>
                                    <td className="px-4 py-3">{row.zone}</td>
                                    <td className="px-4 py-3">{formatCategories(row.categories)}</td>
                                </tr>
                            ))}
                            {!loading && queue.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">{staff.emptyQueue || 'No pending reviews found'}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className={WYO_CARD_CLASS}>
                <div className="p-5 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">{staff.spillageHeading || 'Public-share spillage'}</h3>
                    <p className="text-sm text-gray-600">{staff.spillageSubtitle || ''}</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-gray-600">
                            <tr>
                                <th className="px-4 py-3">{staff.colFile || 'File'}</th>
                                <th className="px-4 py-3">{staff.colAgency || 'Agency'}</th>
                                <th className="px-4 py-3">{staff.colLevel || 'Level'}</th>
                                <th className="px-4 py-3">{staff.colZone || 'Zone'}</th>
                                <th className="px-4 py-3">{staff.colCategories || 'Categories'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {spillage.map((row, idx) => (
                                <tr key={`${row.fileName}-${idx}`} className="border-t border-gray-100">
                                    <td className="px-4 py-3 font-semibold text-gray-900">{row.fileName}</td>
                                    <td className="px-4 py-3">{row.agency}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${levelBadgeClass(row.level)}`}>
                                            {row.level}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{row.zone}</td>
                                    <td className="px-4 py-3">{formatCategories(row.categories)}</td>
                                </tr>
                            ))}
                            {!loading && spillage.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500">{staff.emptySpillage || 'No restricted documents in public share'}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className={`${WYO_CARD_CLASS} p-6`}>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{staff.kibanaHeading || 'Kibana'}</h3>
                <p className="text-sm text-gray-600 mb-4">
                    {staff.kibanaBody || ''}
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
                </div>
            </div>
        </div>
    );
}
