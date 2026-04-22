/**
 * OK Commerce – Company Match Grants dashboard (okagency template).
 * Demo UI for companies tracking state match-grant applications and awards.
 */

import { useContext, useEffect, useState } from 'react';
import { TemplateContext } from '../context/TemplateContext.jsx';
import ChatWidget from './ChatWidget.jsx';
import { getOkGrantDashboardApplications } from '../../modules/utils/esqlQueries.js';

const DEMO_APPLICATIONS = [
    {
        id: 'MG-2026-0142',
        program: 'Rural Jobs Match',
        company: 'Red River Manufacturing LLC',
        submitted: '2026-01-12',
        stateMatch: '$125,000',
        privateMatch: '$125,000',
        status: 'Under review',
    },
    {
        id: 'MG-2026-0098',
        program: 'Innovation Corridor',
        company: 'Red River Manufacturing LLC',
        submitted: '2025-11-03',
        stateMatch: '$200,000',
        privateMatch: '$200,000',
        status: 'Approved – agreement pending',
    },
    {
        id: 'MG-2025-0801',
        program: 'Export Development Match',
        company: 'Red River Manufacturing LLC',
        submitted: '2025-08-20',
        stateMatch: '$75,000',
        privateMatch: '$75,000',
        status: 'Closed – disbursed',
    },
];

const DEMO_DEADLINES = [
    { label: 'Q2 grant round – letters of intent', date: 'Apr 15, 2026' },
    { label: 'Rural Jobs Match – full applications', date: 'May 1, 2026' },
    { label: 'Annual compliance report (MG-2025-0801)', date: 'Jun 30, 2026' },
];

function formatSubmittedDisplay(value) {
    if (value == null || value === '' || value === '—') return '—';
    const t = new Date(value);
    if (Number.isNaN(t.getTime())) return String(value);
    return t.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function StatCard({ label, value, hint, primaryColor }) {
    return (
        <div
            className="rounded-[32px] border border-black/[0.05] bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.06)]"
            style={{ fontFamily: 'var(--font-family, inherit)' }}
        >
            <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
            <p className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900">{value}</p>
            {hint && (
                <p className="text-xs text-slate-500 mt-2" style={{ color: primaryColor }}>
                    {hint}
                </p>
            )}
        </div>
    );
}

function OkCommerceCompanyDashboard({ onLogout, campusId }) {
    const template = useContext(TemplateContext);
    const primaryColor = template?.colors?.primary || '#003366';
    const secondaryColor = template?.colors?.secondary || '#2E7D32';
    const accentColor = template?.colors?.accent || '#0ea5e9';
    const dash = template?.content?.dashboard || {};
    const [applicationsLoading, setApplicationsLoading] = useState(() =>
        Boolean(template?.elastic?.grantsDataIndex)
    );
    const [applicationRows, setApplicationRows] = useState(DEMO_APPLICATIONS);
    const [applicationsFromIndex, setApplicationsFromIndex] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const idx = template?.elastic?.grantsDataIndex;
        if (!template || !idx) {
            setApplicationRows(DEMO_APPLICATIONS);
            setApplicationsFromIndex(false);
            setApplicationsLoading(false);
            return undefined;
        }
        setApplicationsLoading(true);
        getOkGrantDashboardApplications(template)
            .then((apps) => {
                if (cancelled) return;
                if (apps.length > 0) {
                    setApplicationRows(apps);
                    setApplicationsFromIndex(true);
                } else {
                    setApplicationRows(DEMO_APPLICATIONS);
                    setApplicationsFromIndex(false);
                }
            })
            .finally(() => {
                if (!cancelled) setApplicationsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [
        template?.id,
        template?.elastic?.grantsDataIndex,
        template?.elastic?.grantsDataAgentId,
        template?.elastic?.dashboardGrantsMin,
        template?.elastic?.dashboardGrantsMax,
    ]);

    const pageTitle = dash.pageTitle || 'Company Match Grants';
    const pageSubtitle =
        dash.pageSubtitle ||
        'Track match-grant applications, awards, and compliance in one place.';
    const alertBar = dash.alertBar || template?.content?.blueBar?.newsletterText;

    if (!template) {
        return (
            <div className="text-center p-8">
                <p className="text-gray-600">Loading template...</p>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen w-full bg-slate-50"
            style={{ fontFamily: template?.typography?.fontFamily }}
        >
            <header
                className="sticky top-0 z-40 border-b border-black/[0.06] bg-white/90 backdrop-blur-xl shadow-sm"
            >
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
                    <div className="flex min-w-0 items-center gap-3">
                        <img
                            src={template.branding?.logo ?? ''}
                            alt=""
                            className="h-9 w-auto shrink-0"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                        <div className="min-w-0">
                            <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">
                                {template.branding?.institutionName}
                            </p>
                            <p className="truncate text-sm font-bold text-slate-900">{pageTitle}</p>
                        </div>
                    </div>
                    <nav className="hidden items-center gap-1 md:flex">
                        {template.navigation?.links?.map((link, i) => (
                            <a
                                key={i}
                                href={link.href}
                                className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>
                    <div className="flex shrink-0 items-center gap-2">
                        {campusId && (
                            <span className="hidden text-sm text-slate-600 sm:inline" title="Signed in account">
                                {campusId}
                            </span>
                        )}
                        <button
                            type="button"
                            className="rounded-full border border-black/[0.08] px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                            aria-label="Search"
                        >
                            <span className="hidden sm:inline">Search</span>
                            <svg className="mx-auto h-5 w-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                        {onLogout && (
                            <button
                                type="button"
                                onClick={onLogout}
                                className="rounded-full px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                                style={{ backgroundColor: primaryColor }}
                            >
                                Logout
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {alertBar && (
                <div
                    className="border-b border-white/10 px-4 py-3 text-center text-sm font-medium text-white md:px-8"
                    style={{ backgroundColor: primaryColor }}
                >
                    {alertBar}
                </div>
            )}

            <main className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-12">
                <div className="mb-10 max-w-3xl">
                    <h1 className="mb-3 text-4xl font-black tracking-tighter text-slate-900 md:text-5xl">
                        {dash.heroHeading || 'Your company dashboard'}
                    </h1>
                    <p className="text-lg text-slate-600">{pageSubtitle}</p>
                </div>

                <div className="mb-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label={dash.kpiOpenLabel || 'Open applications'}
                        value={dash.kpiOpenValue || '2'}
                        hint={dash.kpiOpenHint || 'Awaiting agency decision'}
                        primaryColor={accentColor}
                    />
                    <StatCard
                        label={dash.kpiApprovedLabel || 'Approved match (YTD)'}
                        value={dash.kpiApprovedValue || '$325K'}
                        hint={dash.kpiApprovedHint || 'State + private leverage'}
                        primaryColor={accentColor}
                    />
                    <StatCard
                        label={dash.kpiDisbursedLabel || 'Disbursed to date'}
                        value={dash.kpiDisbursedValue || '$150K'}
                        primaryColor={accentColor}
                    />
                    <StatCard
                        label={dash.kpiNextLabel || 'Next milestone'}
                        value={dash.kpiNextValue || 'Apr 15'}
                        hint={dash.kpiNextHint || 'LOI deadline'}
                        primaryColor={accentColor}
                    />
                </div>

                <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
                    <section className="lg:col-span-2">
                        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
                            <h2 className="text-xl font-extrabold tracking-tighter text-slate-900">
                                {dash.tableTitle || 'Match grant applications'}
                            </h2>
                            <button
                                type="button"
                                className="rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                                style={{ backgroundColor: secondaryColor }}
                            >
                                {dash.newApplicationCta || 'Start new application'}
                            </button>
                        </div>
                        <div className="overflow-hidden rounded-[32px] border border-black/[0.06] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[640px] text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            <th className="px-5 py-4">Reference</th>
                                            <th className="px-5 py-4">Program</th>
                                            <th className="px-5 py-4">Submitted</th>
                                            <th className="px-5 py-4">State match</th>
                                            <th className="px-5 py-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {applicationsLoading ? (
                                            <tr>
                                                <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                                                    {dash.applicationsLoading || 'Loading applications…'}
                                                </td>
                                            </tr>
                                        ) : (
                                            applicationRows.map((row) => (
                                            <tr key={row.id} className="border-b border-slate-100 last:border-0">
                                                <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-800">
                                                    {row.id}
                                                </td>
                                                <td className="px-5 py-4 text-slate-700">{row.program}</td>
                                                <td className="px-5 py-4 text-slate-600">
                                                    {formatSubmittedDisplay(row.submitted)}
                                                </td>
                                                <td className="px-5 py-4 font-medium text-slate-900">{row.stateMatch}</td>
                                                <td className="px-5 py-4">
                                                    <span
                                                        className="inline-block rounded-full px-3 py-1 text-xs font-semibold"
                                                        style={{
                                                            backgroundColor: `${primaryColor}14`,
                                                            color: primaryColor,
                                                        }}
                                                    >
                                                        {row.status}
                                                    </span>
                                                </td>
                                            </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <p className="mt-3 text-xs text-slate-500">
                            {applicationsFromIndex
                                ? dash.tableFootnoteFromIndex ||
                                  dash.tableFootnote ||
                                  'Programs and dates come from the state grant index; match amounts show an illustrative 50/50 split when totals are available.'
                                : dash.tableFootnote ||
                                  'Sample data for demonstration. Award amounts and statuses are illustrative.'}
                        </p>
                    </section>

                    <aside className="flex flex-col gap-6">
                        <div className="rounded-[32px] border border-black/[0.06] bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
                            <h3 className="mb-4 text-lg font-extrabold tracking-tighter text-slate-900">
                                {dash.deadlinesTitle || 'Upcoming deadlines'}
                            </h3>
                            <ul className="space-y-4">
                                {DEMO_DEADLINES.map((d, i) => (
                                    <li key={i} className="flex flex-col gap-1 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                                        <span className="text-sm font-medium text-slate-800">{d.label}</span>
                                        <span className="text-xs font-semibold" style={{ color: accentColor }}>
                                            {d.date}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div
                            className="rounded-[32px] border p-6 text-white shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
                            style={{ backgroundColor: primaryColor, borderColor: 'rgba(255,255,255,0.12)' }}
                        >
                            <h3 className="mb-2 text-lg font-extrabold tracking-tighter">
                                {dash.resourcesTitle || 'Program resources'}
                            </h3>
                            <p className="mb-4 text-sm text-white/85">
                                {dash.resourcesBody ||
                                    'Eligibility, match ratios, and reporting requirements vary by program. Review the official guidelines before you apply.'}
                            </p>
                            <a
                                href="#guidelines"
                                className="inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm hover:bg-white/25"
                            >
                                {dash.resourcesCta || 'View guidelines'}
                            </a>
                        </div>

                        {template.content?.promoBar?.text && (
                            <a
                                href={template.content.promoBar.href || '#'}
                                className="block rounded-2xl px-5 py-4 text-center text-sm font-semibold text-white transition-opacity hover:opacity-95"
                                style={{ backgroundColor: secondaryColor }}
                            >
                                {template.content.promoBar.text}
                            </a>
                        )}
                    </aside>
                </div>
            </main>

            <footer className="mt-auto text-white" style={{ backgroundColor: primaryColor }}>
                <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
                    <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-3">
                        <div>
                            <h3 className="mb-4 text-lg font-bold">{template.branding?.institutionName}</h3>
                            <p className="mb-2 text-sm text-white/80">{template.footer?.address}</p>
                            <p className="text-sm text-white/80">{template.footer?.phone}</p>
                        </div>
                        <div>
                            <h3 className="mb-4 text-lg font-bold">Quick links</h3>
                            <ul className="space-y-2">
                                {template.footer?.quickLinks?.map((link, i) => (
                                    <li key={i}>
                                        <a href={link.href} className="text-sm text-white/80 hover:text-white">
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="mb-4 text-lg font-bold">Connect</h3>
                            <div className="flex flex-wrap gap-4">
                                {template.footer?.socialMedia?.map((s, i) => (
                                    <a
                                        key={i}
                                        href={s.href}
                                        className="text-sm font-semibold text-white/80 hover:text-white"
                                        aria-label={s.label}
                                    >
                                        {s.platform}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="border-t border-white/20">
                    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
                        <p className="text-center text-sm text-white/70">
                            © 2026 {template.branding?.institutionName}. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>

            <ChatWidget floating />
        </div>
    );
}

export default OkCommerceCompanyDashboard;
