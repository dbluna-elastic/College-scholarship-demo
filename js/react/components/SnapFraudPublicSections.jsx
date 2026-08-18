/**
 * SnapFraudPublicSections — Detection scenario tiles and public KPI snapshots.
 */

import { useContext, useEffect, useState } from 'react';
import { TemplateContext } from '../context/TemplateContext.jsx';
import { getSnapOverviewStats } from '../../modules/utils/snapFraudEsqlQueries.js';
import { getSnapDashboards, kibanaDashboardHref } from './snapfraud/snapFraudUi.js';

export default function SnapFraudPublicSections({ onStaffLoginClick }) {
    const template = useContext(TemplateContext);
    const primaryColor = template?.colors?.primary || '#1B5E20';
    const secondaryColor = template?.colors?.secondary || '#2E7D32';
    const programs = template?.content?.programsLanding || {};
    const reports = template?.content?.reportsSection || {};
    const tiles = Array.isArray(programs.tiles) ? programs.tiles : [];
    const seeded = template?.elastic?.seededEntities || {};

    const [kpis, setKpis] = useState({
        transactions7d: null,
        flaggedStores: null,
        crossStateIds: null,
        deceasedTx: null,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        getSnapOverviewStats()
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

    const dashboards = getSnapDashboards(template);
    const reportDashboards = (dashboards.fraud || []).slice(0, 1);

    return (
        <>
            <section id="programs" className="border-b border-slate-200 bg-slate-100 py-10 md:py-12" aria-label="Detection scenarios">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: template?.typography?.fontFamily }}>
                        {programs.sectionTitle || 'Detection Scenarios'}
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
                        {reports.title || 'Fraud Intelligence Snapshot'}
                    </h2>
                    {reports.subtitle && (
                        <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">{reports.subtitle}</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        {[
                            {
                                label: reports.kpiLabels?.transactions7d || 'Transactions (7 days)',
                                value: kpis.transactions7d != null ? kpis.transactions7d.toLocaleString() : loading ? '…' : '—',
                            },
                            {
                                label: reports.kpiLabels?.flaggedStores || 'Flagged retailers',
                                value: kpis.flaggedStores != null ? kpis.flaggedStores.toLocaleString() : loading ? '…' : '—',
                            },
                            {
                                label: reports.kpiLabels?.crossStateIds || 'Cross-state identities',
                                value: kpis.crossStateIds != null ? kpis.crossStateIds.toLocaleString() : loading ? '…' : '—',
                            },
                            {
                                label: reports.kpiLabels?.deceasedTx || 'Deceased beneficiary txs',
                                value: kpis.deceasedTx != null ? kpis.deceasedTx.toLocaleString() : loading ? '…' : '—',
                            },
                        ].map((kpi) => (
                            <div key={kpi.label} className="rounded-2xl border border-gray-200 p-6 text-center">
                                <p className="text-sm font-medium text-gray-600 mb-2">{kpi.label}</p>
                                <p className="text-3xl font-bold" style={{ color: secondaryColor }}>{kpi.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mb-10 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-6">
                        <h3 className="text-sm font-bold text-emerald-900 mb-3 uppercase tracking-wide">Seeded demo entities</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-emerald-900">
                            <p><span className="font-semibold">Same-cent:</span> Store {seeded.sameCentStore}</p>
                            <p><span className="font-semibold">Manual entry:</span> Store {seeded.manualEntryStore}</p>
                            <p><span className="font-semibold">Volume spike:</span> Store {seeded.volumeSpikeStore}</p>
                            <p><span className="font-semibold">Large baskets:</span> Store {seeded.largeBasketStore}</p>
                            <p><span className="font-semibold">Drains:</span> Store {seeded.drainStore}</p>
                            <p><span className="font-semibold">Rapid baskets:</span> {seeded.rapidBasketHousehold}</p>
                            <p><span className="font-semibold">Cross-state:</span> {seeded.crossStateSsn?.slice(0, 24)}…</p>
                            <p><span className="font-semibold">Deceased:</span> {seeded.deceasedHousehold}</p>
                        </div>
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
