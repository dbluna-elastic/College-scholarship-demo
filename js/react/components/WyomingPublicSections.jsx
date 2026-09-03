/**
 * WyomingPublicSections — classification level tiles and live KPI snapshot.
 */

import { useContext, useEffect, useState } from 'react';
import { TemplateContext } from '../context/TemplateContext.jsx';
import { getWyoOverviewStats } from '../../modules/utils/wyomingClassifyEsqlQueries.js';
import { getWyoDashboards, kibanaDashboardHref } from './wyoming/wyomingUi.js';

export default function WyomingPublicSections({ onStaffLoginClick }) {
    const template = useContext(TemplateContext);
    const primaryColor = template?.colors?.primary || 'var(--primary-color)';
    const secondaryColor = template?.colors?.secondary || 'var(--secondary-color)';
    const programs = template?.content?.programsLanding || {};
    const reports = template?.content?.reportsSection || {};
    const tiles = Array.isArray(programs.tiles) ? programs.tiles : [];
    const seeded = template?.elastic?.seededEntities || {};

    const [kpis, setKpis] = useState({
        totalDocs: null,
        restricted: null,
        pendingReview: null,
        spillageAlerts: null,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        getWyoOverviewStats()
            .then((stats) => {
                if (!cancelled) {
                    setKpis(stats);
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

    const dashboards = getWyoDashboards(template);
    const reportDashboards = (dashboards.overview || dashboards.all || []).slice(0, 1);

    const formatKpi = (value) => (value != null ? value.toLocaleString() : loading ? '…' : '—');

    return (
        <>
            <section id="programs" className="border-b border-slate-200 bg-slate-100 py-10 md:py-12" aria-label={programs.sectionTitle || 'Classification levels'}>
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 tracking-tighter" style={{ fontFamily: template?.typography?.fontFamily }}>
                        {programs.sectionTitle || 'Classification levels'}
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
                    <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 tracking-tighter" style={{ color: template?.colors?.charcoal || '#1e293b' }}>
                        {reports.title || 'Classification snapshot'}
                    </h2>
                    {reports.subtitle && (
                        <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">{reports.subtitle}</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        {[
                            { label: reports.kpiLabels?.totalDocs || 'Total documents', value: formatKpi(kpis.totalDocs) },
                            { label: reports.kpiLabels?.restricted || 'Restricted', value: formatKpi(kpis.restricted) },
                            { label: reports.kpiLabels?.pendingReview || 'Pending review', value: formatKpi(kpis.pendingReview) },
                            { label: reports.kpiLabels?.spillageAlerts || 'Spillage alerts', value: formatKpi(kpis.spillageAlerts) },
                        ].map((kpi) => (
                            <div key={kpi.label} className="rounded-2xl border border-gray-200 p-6 text-center">
                                <p className="text-sm font-medium text-gray-600 mb-2">{kpi.label}</p>
                                <p className="text-3xl font-bold" style={{ color: secondaryColor }}>{kpi.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mb-10 rounded-2xl border border-amber-100 bg-amber-50/70 p-6">
                        <h3 className="text-sm font-bold text-amber-950 mb-3 uppercase tracking-wide">
                            {reports.seededHeading || 'Demo corpus (synthetic)'}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-amber-950">
                            <p><span className="font-semibold">Documents:</span> {seeded.corpusSize || '—'}</p>
                            <p><span className="font-semibold">Hold-out:</span> {seeded.holdOut || '—'}</p>
                            <p><span className="font-semibold">Planted spillage:</span> {seeded.plantedSpillageFile || '—'}</p>
                        </div>
                        {reports.seededNote && (
                            <p className="mt-3 text-sm text-amber-900/80">{reports.seededNote}</p>
                        )}
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
