/**
 * BoosterEngagementDashboard — Athletic advancement staff dashboard for texascollege template.
 * Surfaces at-risk donors, major gifts, affinity intelligence, and Kibana dashboard links.
 */

import { useContext, useEffect, useState } from 'react';
import { TemplateContext } from '../context/TemplateContext.jsx';
import { getSchemaLabels } from '../../config/schemaConfig.js';
import {
    getBoosterDonorStats,
    getBoosterAtRiskDonors,
    getBoosterAtRiskMajorGifts,
    getBoosterTopAffinityDonors,
    getBoosterEngagementEventSummary,
    getBoosterCaseMetrics,
} from '../../modules/utils/esqlQueries.js';
import ChatWidget from './ChatWidget.jsx';
import ClickableDonorName from './ClickableDonorName.jsx';

const BOOSTER_AGENT = 'booster-donor-data';

function getField(row, ...keys) {
    for (const k of keys) {
        const v = row[k];
        if (v != null && v !== '') return v;
    }
    return null;
}

function formatCurrency(value) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value));
}

function formatPercent(value) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return `${Math.round(Number(value) * 100)}%`;
}

function formatDate(value) {
    if (value == null) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
}

function BoosterEngagementDashboard({ onLogout, onDonorClick }) {
    const template = useContext(TemplateContext);
    const schemaLabels = getSchemaLabels(template);
    const primaryColor = template?.colors?.primary || '#0C2340';
    const secondaryColor = template?.colors?.secondary || '#F15A22';
    const kibanaUrl = (template?.elastic?.kibanaUrl || '').replace(/\/$/, '');
    const dashboards = template?.elastic?.dashboards || [];
    const agentId = template?.elastic?.boosterDataAgentId || BOOSTER_AGENT;

    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState(null);

    const [atRiskDonors, setAtRiskDonors] = useState([]);
    const [atRiskLoading, setAtRiskLoading] = useState(true);
    const [atRiskError, setAtRiskError] = useState(null);

    const [majorGifts, setMajorGifts] = useState([]);
    const [majorGiftsLoading, setMajorGiftsLoading] = useState(true);
    const [majorGiftsError, setMajorGiftsError] = useState(null);

    const [topAffinity, setTopAffinity] = useState([]);
    const [topAffinityLoading, setTopAffinityLoading] = useState(true);

    const [engagementEvents, setEngagementEvents] = useState([]);
    const [caseMetrics, setCaseMetrics] = useState([]);

    useEffect(() => {
        let cancelled = false;
        setStatsLoading(true);
        setStatsError(null);
        getBoosterDonorStats(agentId)
            .then((data) => {
                if (!cancelled) {
                    setStats(data);
                    setStatsLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setStatsError(err?.message || 'Failed to load');
                    setStatsLoading(false);
                }
            });
        return () => { cancelled = true; };
    }, [agentId]);

    useEffect(() => {
        let cancelled = false;
        setAtRiskLoading(true);
        setAtRiskError(null);
        getBoosterAtRiskDonors(agentId)
            .then((rows) => {
                if (!cancelled) {
                    setAtRiskDonors(rows);
                    setAtRiskLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setAtRiskError(err?.message || 'Failed to load');
                    setAtRiskLoading(false);
                }
            });
        return () => { cancelled = true; };
    }, [agentId]);

    useEffect(() => {
        let cancelled = false;
        setMajorGiftsLoading(true);
        setMajorGiftsError(null);
        getBoosterAtRiskMajorGifts(agentId)
            .then((rows) => {
                if (!cancelled) {
                    setMajorGifts(rows);
                    setMajorGiftsLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setMajorGiftsError(err?.message || 'Failed to load');
                    setMajorGiftsLoading(false);
                }
            });
        return () => { cancelled = true; };
    }, [agentId]);

    useEffect(() => {
        let cancelled = false;
        setTopAffinityLoading(true);
        getBoosterTopAffinityDonors(agentId)
            .then((rows) => {
                if (!cancelled) {
                    setTopAffinity(rows);
                    setTopAffinityLoading(false);
                }
            })
            .catch(() => {
                if (!cancelled) setTopAffinityLoading(false);
            });
        getBoosterEngagementEventSummary(agentId).then((rows) => {
            if (!cancelled) setEngagementEvents(rows);
        });
        getBoosterCaseMetrics(agentId).then((rows) => {
            if (!cancelled) setCaseMetrics(rows);
        });
        return () => { cancelled = true; };
    }, [agentId]);

    if (!template) {
        return (
            <div className="text-center p-8">
                <p className="text-gray-600">Loading template...</p>
            </div>
        );
    }

    const dashboardHref = (id) => `${kibanaUrl}/app/dashboards#/view/${id}`;

    return (
        <div className="w-full min-h-screen bg-white" style={{ fontFamily: template?.typography?.fontFamily }}>
            <header className="text-white py-2" style={{ backgroundColor: primaryColor }}>
                <div className="max-w-7xl mx-auto px-4 flex justify-end items-center gap-4">
                    <span className="text-sm">{schemaLabels.dashboardStaff}</span>
                    {onLogout && (
                        <button
                            type="button"
                            onClick={onLogout}
                            className="px-4 py-1.5 text-sm font-medium hover:opacity-80 transition-opacity"
                        >
                            Logout
                        </button>
                    )}
                </div>
            </header>

            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-20">
                    <div className="flex items-center gap-3">
                        <img
                            src={template.branding?.logo}
                            alt={template.branding?.institutionName}
                            className="h-10 w-auto"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <span className="text-xl font-black tracking-tighter" style={{ color: primaryColor }}>
                            {template.branding?.institutionName}
                        </span>
                    </div>
                    <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-700">
                        {template.navigation?.links?.slice(0, 4).map((link, i) => (
                            <a key={i} href={link.href} className="hover:opacity-80" style={{ color: primaryColor }}>
                                {link.label}
                            </a>
                        ))}
                    </div>
                </div>
            </nav>

            <section className="py-8 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4">
                    <h2
                        className="text-4xl md:text-5xl font-black tracking-tighter mb-2"
                        style={{ color: primaryColor }}
                    >
                        {schemaLabels.dashboardStaff}
                    </h2>
                    <p className="text-gray-600 mb-8 max-w-3xl">
                        Live insights from athletic-boosters, booster-engagement-events, and booster-case-metrics
                        on the gawdzilla Elastic deployment.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white border border-gray-200 rounded-[32px] p-6 shadow-sm">
                            <h4 className="text-sm font-medium text-gray-600 mb-2">Total Donors</h4>
                            {statsLoading ? (
                                <p className="text-3xl font-bold text-gray-400">Loading…</p>
                            ) : statsError ? (
                                <p className="text-sm text-red-600">{statsError}</p>
                            ) : (
                                <p className="text-3xl font-black" style={{ color: primaryColor }}>
                                    {stats?.donorCount?.toLocaleString() ?? '—'}
                                </p>
                            )}
                        </div>
                        <div className="bg-white border border-gray-200 rounded-[32px] p-6 shadow-sm">
                            <h4 className="text-sm font-medium text-gray-600 mb-2">Avg Affinity Score</h4>
                            {statsLoading ? (
                                <p className="text-3xl font-bold text-gray-400">Loading…</p>
                            ) : (
                                <p className="text-3xl font-black" style={{ color: secondaryColor }}>
                                    {stats?.avgAffinity != null ? stats.avgAffinity.toFixed(1) : '—'}
                                </p>
                            )}
                        </div>
                        <div className="bg-white border border-gray-200 rounded-[32px] p-6 shadow-sm">
                            <h4 className="text-sm font-medium text-gray-600 mb-2">Lifetime Giving</h4>
                            {statsLoading ? (
                                <p className="text-3xl font-bold text-gray-400">Loading…</p>
                            ) : (
                                <p className="text-2xl md:text-3xl font-black" style={{ color: primaryColor }}>
                                    {formatCurrency(stats?.totalLifetimeGiving)}
                                </p>
                            )}
                        </div>
                        <div className="bg-white border border-gray-200 rounded-[32px] p-6 shadow-sm">
                            <h4 className="text-sm font-medium text-gray-600 mb-2">At-Risk Cases (30d)</h4>
                            <p className="text-3xl font-black" style={{ color: secondaryColor }}>
                                {caseMetrics.find((m) => m.metric_type === 'cases_last_30d')?.count ?? '—'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-[32px] overflow-hidden shadow-sm mb-8">
                        <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-xl font-bold text-gray-900">At-Risk Donors</h3>
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">affinity &lt; 40 or low email engagement</span>
                        </div>
                        <div className="overflow-x-auto max-h-[22rem] overflow-y-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 font-semibold">Donor</th>
                                        <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 font-semibold">Affinity</th>
                                        <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 font-semibold">Lifetime</th>
                                        <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 font-semibold">Email Open Rate</th>
                                        <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 font-semibold">Last Gift</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {atRiskLoading ? (
                                        <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading…</td></tr>
                                    ) : atRiskError ? (
                                        <tr><td colSpan={5} className="px-6 py-8 text-center text-red-600">{atRiskError}</td></tr>
                                    ) : atRiskDonors.length === 0 ? (
                                        <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No at-risk donors found</td></tr>
                                    ) : (
                                        atRiskDonors.map((row, i) => (
                                            <tr key={getField(row, 'donor_id') || i} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <ClickableDonorName
                                                        donorId={getField(row, 'donor_id')}
                                                        firstName={getField(row, 'first_name')}
                                                        lastName={getField(row, 'last_name')}
                                                        onDonorClick={onDonorClick}
                                                        primaryColor={primaryColor}
                                                    />
                                                    <span className="block text-xs text-gray-500">{getField(row, 'donor_id')}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                                        {getField(row, 'affinity_score')?.toFixed?.(1) ?? getField(row, 'affinity_score') ?? '—'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">{formatCurrency(getField(row, 'giving_history.lifetime_total'))}</td>
                                                <td className="px-6 py-4">{formatPercent(getField(row, 'engagement.email_open_rate_90d'))}</td>
                                                <td className="px-6 py-4 text-gray-600">{formatDate(getField(row, 'giving_history.last_gift_date'))}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <div className="bg-white border border-gray-200 rounded-[32px] p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">At-Risk Major Gifts</h3>
                            {majorGiftsLoading ? (
                                <p className="text-gray-500">Loading…</p>
                            ) : majorGiftsError ? (
                                <p className="text-red-600 text-sm">{majorGiftsError}</p>
                            ) : (
                                <ul className="space-y-3">
                                    {majorGifts.map((row, i) => (
                                        <li key={getField(row, 'donor_id') || i} className="flex justify-between items-start gap-4 border-b border-gray-100 pb-3">
                                            <div>
                                                <ClickableDonorName
                                                    donorId={getField(row, 'donor_id')}
                                                    firstName={getField(row, 'first_name')}
                                                    lastName={getField(row, 'last_name')}
                                                    onDonorClick={onDonorClick}
                                                    primaryColor={primaryColor}
                                                    className="text-gray-900"
                                                />
                                                <p className="text-xs text-gray-500">{getField(row, 'donor_id')}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold" style={{ color: primaryColor }}>
                                                    {formatCurrency(getField(row, 'giving_history.lifetime_total'))}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Affinity {getField(row, 'affinity_score')?.toFixed?.(1) ?? '—'} · Opens {formatPercent(getField(row, 'engagement.email_open_rate_90d'))}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="bg-white border border-gray-200 rounded-[32px] p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Top Affinity Donors</h3>
                            {topAffinityLoading ? (
                                <p className="text-gray-500">Loading…</p>
                            ) : (
                                <ul className="space-y-3">
                                    {topAffinity.map((row, i) => (
                                        <li key={getField(row, 'donor_id') || i} className="flex justify-between items-center">
                                            <div>
                                                <ClickableDonorName
                                                    donorId={getField(row, 'donor_id')}
                                                    firstName={getField(row, 'first_name')}
                                                    lastName={getField(row, 'last_name')}
                                                    onDonorClick={onDonorClick}
                                                    primaryColor={primaryColor}
                                                    className="text-gray-900"
                                                />
                                                <p className="text-xs text-gray-500">
                                                    {getField(row, 'degree')} · {getField(row, 'graduation_year')}
                                                </p>
                                            </div>
                                            <span className="font-black text-lg" style={{ color: secondaryColor }}>
                                                {getField(row, 'affinity_score')?.toFixed?.(1) ?? '—'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {engagementEvents.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-[32px] p-6 shadow-sm mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Engagement Events</h3>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {engagementEvents.map((row, i) => (
                                    <div key={i} className="rounded-2xl bg-gray-50 p-4 text-center border border-gray-100">
                                        <p className="text-2xl font-black" style={{ color: primaryColor }}>
                                            {Number(getField(row, 'events')).toLocaleString()}
                                        </p>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 mt-1">
                                            {getField(row, 'event_type')?.replace(/_/g, ' ') ?? '—'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {kibanaUrl && dashboards.length > 0 && (
                        <div className="p-6 bg-white border border-gray-200 rounded-[32px] shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Kibana Dashboards</h3>
                            <p className="text-gray-600 text-sm mb-4">
                                Open detailed visualizations in Kibana for booster engagement and donor intelligence.
                            </p>
                            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                                {dashboards.map((dash) => (
                                    <a
                                        key={dash.id}
                                        href={dashboardHref(dash.id)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                                        style={{ backgroundColor: secondaryColor }}
                                    >
                                        {dash.title}
                                        <span aria-hidden>↗</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <ChatWidget floating agentId={agentId} onDonorClick={onDonorClick} />
        </div>
    );
}

export default BoosterEngagementDashboard;
