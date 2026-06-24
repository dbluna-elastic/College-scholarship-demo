/**
 * OkOjaPublicSections — Programs tiles and public KPI snapshots for OJA landing.
 */

import { useContext, useEffect, useState } from 'react';
import { TemplateContext } from '../context/TemplateContext.jsx';
import { getOjaOverviewStats } from '../../modules/utils/ojaEsqlQueries.js';
import { getOjaDashboards, kibanaDashboardHref } from './oja/ojaUi.js';

export default function OkOjaPublicSections({ onStaffLoginClick }) {
    const template = useContext(TemplateContext);
    const primaryColor = template?.colors?.primary || '#1B3A5C';
    const secondaryColor = template?.colors?.secondary || '#2E75B6';
    const programs = template?.content?.programsLanding || {};
    const reports = template?.content?.reportsSection || {};
    const tiles = Array.isArray(programs.tiles) ? programs.tiles : [];

    const [kpis, setKpis] = useState({ activeYouth: null, avgRisk: null, recidivism12: null, pending: null });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        getOjaOverviewStats()
            .then((stats) => {
                if (!cancelled) {
                    setKpis({
                        activeYouth: stats.activeYouth,
                        avgRisk: stats.avgRisk,
                        recidivism12: stats.recidivism12mo,
                        pending: stats.pendingYouth,
                    });
                    setLoading(false);
                }
            })
            .catch(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const handleTileClick = (tile, e) => {
        if (tile.href === '#staff-login' && typeof onStaffLoginClick === 'function') {
            e.preventDefault();
            onStaffLoginClick();
        }
    };

    const dashboards = getOjaDashboards(template);
    const reportDashboards = [
        ...(dashboards.overview || []).slice(0, 1),
        ...(dashboards.assessments || []).slice(0, 1),
    ];

    return (
        <>
            <section id="programs" className="border-b border-slate-200 bg-slate-100 py-10 md:py-12" aria-label="Programs and supervision">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: template?.typography?.fontFamily }}>
                        {programs.sectionTitle || 'Programs & Supervision'}
                    </h2>
                    {programs.sectionSubtitle && (
                        <p className="text-slate-600 mb-8 max-w-2xl">{programs.sectionSubtitle}</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {tiles.map((tile, idx) => (
                            <a
                                key={idx}
                                href={tile.href || '#'}
                                onClick={(e) => handleTileClick(tile, e)}
                                className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <h3 className="text-base font-bold group-hover:underline" style={{ color: primaryColor }}>
                                    {tile.label}
                                </h3>
                                {tile.description && (
                                    <p className="mt-2 flex-1 text-sm text-slate-600">{tile.description}</p>
                                )}
                                <span className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                                    {programs.tileCta || 'Learn more'} →
                                </span>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            <section id="reports" className="bg-white py-12 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-center mb-2" style={{ color: template?.colors?.charcoal || '#1e293b' }}>
                        {reports.title || 'Data & Performance'}
                    </h2>
                    {reports.subtitle && (
                        <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">{reports.subtitle}</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        {[
                            { label: reports.kpiLabels?.activeYouth || 'Active cases', value: kpis.activeYouth != null ? kpis.activeYouth.toLocaleString() : loading ? '…' : '—' },
                            { label: 'Pending intakes', value: kpis.pending != null ? kpis.pending.toLocaleString() : loading ? '…' : '—' },
                            { label: reports.kpiLabels?.avgRisk || 'Avg risk score', value: kpis.avgRisk != null ? kpis.avgRisk.toFixed(1) : loading ? '…' : '—' },
                            { label: reports.kpiLabels?.recidivism12 || '12-mo recidivism', value: kpis.recidivism12 != null ? `${Math.round(kpis.recidivism12 * 100)}%` : loading ? '…' : '—' },
                        ].map((kpi) => (
                            <div key={kpi.label} className="rounded-2xl border border-gray-200 p-6 text-center">
                                <p className="text-sm font-medium text-gray-600 mb-2">{kpi.label}</p>
                                <p className="text-3xl font-bold" style={{ color: secondaryColor }}>{kpi.value}</p>
                            </div>
                        ))}
                    </div>
                    {reportDashboards.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-3">
                            {reportDashboards.map((dash) => (
                                <a
                                    key={dash.id}
                                    href={kibanaDashboardHref(template, dash.id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-5 py-2 rounded-full text-sm font-semibold text-white hover:opacity-90"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    {dash.title}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
