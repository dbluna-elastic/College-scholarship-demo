/**
 * OkMentalHealthPublicSections — Crisis quick tiles and public data snapshots for landing page.
 */

import { useContext, useEffect, useState } from 'react';
import { TemplateContext } from '../context/TemplateContext.jsx';
import {
    getClinicalStatewideRelapseRate,
    getCrisisCallCenterStats,
    getFraudHighRiskClaimCount,
    getOkHealthGrantCount,
} from '../../modules/utils/esqlQueries.js';
import { getGroupedDashboards, kibanaDashboardHref } from './mentalhealth/mentalhealthUi.js';

export default function OkMentalHealthPublicSections({ onStaffLoginClick, onOpenGrantsSearch }) {
    const template = useContext(TemplateContext);
    const primaryColor = template?.colors?.primary || '#003366';
    const secondaryColor = template?.colors?.secondary || '#2563eb';
    const crisis = template?.content?.crisisLanding || {};
    const reports = template?.content?.reportsSection || {};
    const tiles = Array.isArray(crisis.tiles) ? crisis.tiles : [];
    const agentId = template?.elastic?.fraudAgentId || 'ok-fraud';

    const [kpis, setKpis] = useState({ relapse: null, answerTime: null, highRisk: null, grants: null });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        Promise.all([
            getClinicalStatewideRelapseRate(agentId),
            getCrisisCallCenterStats(agentId),
            getFraudHighRiskClaimCount(agentId),
            getOkHealthGrantCount(template),
        ])
            .then(([relapse, crisisStats, highRisk, grants]) => {
                if (!cancelled) {
                    setKpis({
                        relapse,
                        answerTime: crisisStats?.avgAnswerSeconds != null ? Math.round(crisisStats.avgAnswerSeconds) : null,
                        highRisk,
                        grants,
                    });
                    setLoading(false);
                }
            })
            .catch(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [agentId, template]);

    const handleTileClick = (tile, e) => {
        if (tile.href === '#staff-login' && typeof onStaffLoginClick === 'function') {
            e.preventDefault();
            onStaffLoginClick();
        }
        if ((tile.href === '#programs' || tile.href === '#grants-search') && typeof onOpenGrantsSearch === 'function') {
            e.preventDefault();
            onOpenGrantsSearch();
        }
    };

    const grouped = getGroupedDashboards(template);
    const reportDashboards = [
        ...(grouped.clinical || []).slice(0, 1),
        ...(grouped.crisis || []).slice(0, 1),
        ...(grouped.fraud || []).slice(0, 1),
    ];

    return (
        <>
            <section id="crisis" className="border-b border-slate-200 bg-slate-100 py-10 md:py-12" aria-label="Crisis support">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: template?.typography?.fontFamily }}>
                        {crisis.sectionTitle || 'Crisis Support'}
                    </h2>
                    {crisis.sectionSubtitle && (
                        <p className="text-slate-600 mb-8 max-w-2xl">{crisis.sectionSubtitle}</p>
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
                                    {crisis.tileCta || 'Learn more'} →
                                </span>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            <section id="reports" className="bg-white py-12 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-center mb-2" style={{ color: template?.colors?.charcoal }}>
                        {reports.title || 'Data & Reports'}
                    </h2>
                    {reports.subtitle && (
                        <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">{reports.subtitle}</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        {[
                            { label: reports.kpiLabels?.relapseRate || 'Relapse rate', value: kpis.relapse != null ? `${kpis.relapse}%` : loading ? '…' : '—' },
                            { label: reports.kpiLabels?.avgAnswerTime || 'Avg answer time', value: kpis.answerTime != null ? `${kpis.answerTime}s` : loading ? '…' : '—' },
                            { label: reports.kpiLabels?.highRiskClaims || 'High-risk claims', value: kpis.highRisk != null ? kpis.highRisk.toLocaleString() : loading ? '…' : '—' },
                            { label: reports.kpiLabels?.activeGrants || 'Active grants', value: kpis.grants != null ? kpis.grants.toLocaleString() : loading ? '…' : '—' },
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
