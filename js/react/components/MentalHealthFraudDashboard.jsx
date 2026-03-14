/**
 * MentalHealthFraudDashboard - Fraud & Compliance staff dashboard for okmentalhealth template.
 * Layout inspired by Counselor Dashboard: high-priority cases table, metric cards, document queue,
 * deadlines, calendar, and at-risk list. Links to Kibana dashboards (ok-*) on gawdzilla.
 */

import { useContext, useState, useEffect } from 'react';
import { TemplateContext } from '../context/TemplateContext.jsx';
import { getSchemaLabels } from '../../config/schemaConfig.js';
import { getFraudYTDTotalLoss, getFraudTotalClaimsFlagged, getFraudHighPriorityCases } from '../../modules/utils/esqlQueries.js';
import ChatWidget from './ChatWidget.jsx';

// Placeholder data for fraud dashboard (replace with API/Elastic when available)
const DOCUMENT_QUEUE = [
    { label: 'Medical records – Case F-100023', icon: 'document' },
    { label: 'Billing statements – Provider B', icon: 'document' },
    { label: 'Investigation report – Case F-100045', icon: 'document' },
];

const DEADLINES = [
    { label: 'Case F-100023 – Due in 2 days' },
    { label: 'Provider B audit – Due in 3 days' },
    { label: 'Quarterly review – Due in 4 days' },
];

const CALENDAR_ITEMS = [
    { time: '9:00 AM', title: 'Case review – F-100023' },
    { time: '10:30 AM', title: 'Provider call – Provider B' },
    { time: '2:00 PM', title: 'Compliance briefing' },
];

const AT_RISK_LIST = [
    { name: 'Provider A – Metro BH', score: 40 },
    { name: 'Provider B – Rural SUD', score: 35 },
    { name: 'Provider C – Outpatient MH', score: 30 },
];

function formatLastActivity(ts) {
    if (ts == null) return '—';
    const date = typeof ts === 'number' ? new Date(ts) : new Date(ts);
    if (Number.isNaN(date.getTime())) return '—';
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    if (diffDays < 0) return date.toLocaleDateString();
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    return date.toLocaleDateString();
}

/** Pick first defined value from row for given keys (handles ESQL column name casing). */
function getField(row, ...keys) {
    for (const k of keys) {
        const v = row[k];
        if (v != null && v !== '') return v;
    }
    return null;
}

/** Fallback: first value in row that looks like a recipient ID (e.g. OK-MCD-123). */
function getRecipientIdFallback(row) {
    for (const v of Object.values(row)) {
        const s = v != null ? String(v).trim() : '';
        if (s === '') continue;
        if ((s.includes('MCD') || s.startsWith('OK-')) && /^[A-Za-z0-9_.-]+$/.test(s)) return s;
    }
    return null;
}

function MentalHealthFraudDashboard({ onLogout, onRecipientClick }) {
    const template = useContext(TemplateContext);
    const schemaLabels = getSchemaLabels(template);
    const primaryColor = template?.colors?.primary || '#5D5FEF';
    const kibanaUrl = template?.elastic?.kibanaUrl || '';
    const [totalLossYtd, setTotalLossYtd] = useState(null);
    const [totalLossError, setTotalLossError] = useState(null);
    const [totalLossLoading, setTotalLossLoading] = useState(true);
    const [totalClaimsFlagged, setTotalClaimsFlagged] = useState(null);
    const [totalClaimsFlaggedError, setTotalClaimsFlaggedError] = useState(null);
    const [totalClaimsFlaggedLoading, setTotalClaimsFlaggedLoading] = useState(true);
    const [highPriorityCases, setHighPriorityCases] = useState([]);
    const [highPriorityCasesLoading, setHighPriorityCasesLoading] = useState(true);
    const [highPriorityCasesError, setHighPriorityCasesError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setTotalLossLoading(true);
        setTotalLossError(null);
        getFraudYTDTotalLoss('ok-fraud')
            .then((value) => {
                if (!cancelled) {
                    setTotalLossYtd(value);
                    setTotalLossLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setTotalLossError(err?.message || 'Failed to load');
                    setTotalLossYtd(null);
                    setTotalLossLoading(false);
                }
            });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        let cancelled = false;
        setTotalClaimsFlaggedLoading(true);
        setTotalClaimsFlaggedError(null);
        getFraudTotalClaimsFlagged('ok-fraud')
            .then((value) => {
                if (!cancelled) {
                    setTotalClaimsFlagged(value);
                    setTotalClaimsFlaggedLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setTotalClaimsFlaggedError(err?.message || 'Failed to load');
                    setTotalClaimsFlagged(null);
                    setTotalClaimsFlaggedLoading(false);
                }
            });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        let cancelled = false;
        setHighPriorityCasesLoading(true);
        setHighPriorityCasesError(null);
        getFraudHighPriorityCases('ok-fraud')
            .then((cases) => {
                if (!cancelled) {
                    setHighPriorityCases(cases);
                    setHighPriorityCasesLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setHighPriorityCasesError(err?.message || 'Failed to load');
                    setHighPriorityCases([]);
                    setHighPriorityCasesLoading(false);
                }
            });
        return () => { cancelled = true; };
    }, []);

    if (!template) {
        return (
            <div className="text-center p-8">
                <p className="text-gray-600">Loading template...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-white">
            {/* 1. Global Header (Top Utility Bar) */}
            <header className="bg-[#1a2332] text-white py-2">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-end items-center gap-4">
                        <span className="text-sm">{schemaLabels.dashboardStaff}</span>
                        {onLogout && (
                            <button
                                onClick={onLogout}
                                className="px-4 py-1.5 text-sm font-medium hover:opacity-80 transition-opacity"
                            >
                                Logout
                            </button>
                        )}
                        <button className="p-1.5 hover:opacity-80 transition-opacity" aria-label="Language">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* 2. Main Navigation Row */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center">
                            <img
                                src={template.branding.logo}
                                alt={template.branding.institutionName}
                                className="h-12 w-auto"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'block';
                                }}
                            />
                            <span className="text-xl font-bold text-gray-900 hidden">
                                {template.branding.institutionName}
                            </span>
                        </div>
                        <div className="hidden md:flex items-center gap-8">
                            {template.navigation?.links?.map((link, index) => (
                                <a
                                    key={index}
                                    href={link.href}
                                    className="text-gray-900 font-medium hover:opacity-80 transition-colors"
                                    style={{ color: '#1a2332' }}
                                >
                                    {link.label}
                                </a>
                            ))}
                        </div>
                        <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search"
                                className="bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 text-sm w-40"
                            />
                        </div>
                    </div>
                </div>
            </nav>

            {/* 3. Blank Hero Section (match CounselorDashboard chrome) */}
            <section className="relative h-32 flex items-center justify-center bg-gray-50" />

            {/* 4. Fraud Dashboard Content */}
            <section className="py-8 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <h2
                        className="text-4xl md:text-5xl font-bold mb-2"
                        style={{ fontFamily: 'var(--font-family)', color: primaryColor }}
                    >
                        {schemaLabels.dashboardStaff}
                    </h2>
                    <p className="text-gray-600 mb-8">
                        Tools and resources for mental health and substance abuse fraud detection and compliance.
                    </p>

                    {/* High-Priority Fraud Cases Table */}
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm mb-8">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900">High-Priority Fraud Cases</h3>
                        </div>
                        <div className="overflow-x-auto overflow-y-auto max-h-[20rem]">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 font-semibold text-gray-900">Medicaid_Recipient_ID</th>
                                        <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 font-semibold text-gray-900">Risk Level</th>
                                        <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 font-semibold text-gray-900">@timestamp</th>
                                        <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 font-semibold text-gray-900">Flag_Type</th>
                                        <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 font-semibold text-gray-900">Agency_Type</th>
                                        <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 font-semibold text-gray-900">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {highPriorityCasesLoading ? (
                                        <tr className="border-b border-gray-100">
                                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                                Loading…
                                            </td>
                                        </tr>
                                    ) : highPriorityCasesError ? (
                                        <tr className="border-b border-gray-100">
                                            <td colSpan={6} className="px-6 py-8 text-center text-red-600">
                                                {highPriorityCasesError}
                                            </td>
                                        </tr>
                                    ) : highPriorityCases.length === 0 ? (
                                        <tr className="border-b border-gray-100">
                                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                                No high-priority cases
                                            </td>
                                        </tr>
                                    ) : (
                                        highPriorityCases.map((row, i) => {
                                            const recipientId = getField(row, 'Medicaid_Recipient_ID', 'medicaid_recipient_id', 'MedicaidRecipientID') ?? getRecipientIdFallback(row);
                                            const claimId = getField(row, 'Claim_ID', 'claim_id', 'ClaimId', 'claimid', 'Claim_Number', 'claim_number');
                                            const isClickable = recipientId && typeof onRecipientClick === 'function';
                                            return (
                                            <tr key={String(claimId ?? getField(row, 'Claim_ID', 'claim_id', 'ClaimId', 'Claim_Number') ?? i)} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    {isClickable ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => onRecipientClick(recipientId)}
                                                            className="font-medium text-left underline cursor-pointer hover:opacity-80 transition-opacity"
                                                            style={{ color: primaryColor }}
                                                        >
                                                            {recipientId}
                                                        </button>
                                                    ) : (
                                                        <span className="font-medium text-gray-900">{recipientId ?? '—'}</span>
                                                    )}
                                                    <span className="text-gray-500 block text-xs">#{claimId ?? '—'}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                            row.Priority === 'Critical'
                                                                ? 'bg-red-100 text-red-800'
                                                                : row.Priority === 'High'
                                                                ? 'bg-amber-100 text-amber-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}
                                                    >
                                                        {row.Priority ?? 'Medium'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">{formatLastActivity(getField(row, '@timestamp', 'timestamp'))}</td>
                                                <td className="px-6 py-4 text-gray-700">{getField(row, 'Flag_Type', 'flag_type') ?? '—'}</td>
                                                <td className="px-6 py-4 text-gray-600">{getField(row, 'Agency_Type', 'agency_type') ?? '—'}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        <button
                                                            type="button"
                                                            className="px-3 py-1 text-xs font-medium rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100"
                                                        >
                                                            Flag
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="px-3 py-1 text-xs font-medium rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100"
                                                        >
                                                            Investigate
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Summary Metric Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <h4 className="text-sm font-medium text-gray-600 mb-2">Total Potential Fraud Detected YTD</h4>
                            {totalLossLoading ? (
                                <p className="text-3xl font-bold text-gray-400">Loading…</p>
                            ) : totalLossError ? (
                                <p className="text-lg font-medium text-red-600">{totalLossError}</p>
                            ) : totalLossYtd != null ? (
                                <p className="text-3xl font-bold text-green-700">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalLossYtd)}
                                </p>
                            ) : (
                                <p className="text-3xl font-bold text-gray-500">—</p>
                            )}
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <h4 className="text-sm font-medium text-gray-600 mb-2">Investigation Resolution Rate</h4>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-blue-600"
                                        style={{ width: '78%' }}
                                    />
                                </div>
                                <span className="text-2xl font-bold text-gray-900">78%</span>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <h4 className="text-sm font-medium text-gray-600 mb-2">Total Claims Flagged</h4>
                            {totalClaimsFlaggedLoading ? (
                                <p className="text-3xl font-bold text-gray-400">Loading…</p>
                            ) : totalClaimsFlaggedError ? (
                                <p className="text-lg font-medium text-red-600">{totalClaimsFlaggedError}</p>
                            ) : totalClaimsFlagged != null ? (
                                <p className="text-3xl font-bold" style={{ color: primaryColor }}>{totalClaimsFlagged.toLocaleString()}</p>
                            ) : (
                                <p className="text-3xl font-bold text-gray-500">—</p>
                            )}
                        </div>
                    </div>

                    {/* Grid: Document Queue, Deadlines, Calendar, At-Risk */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Document Request Queue */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Document Request Queue</h3>
                            <ul className="space-y-3">
                                {DOCUMENT_QUEUE.map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-gray-700">
                                        <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span>{item.label}</span>
                                    </li>
                                ))}
                            </ul>
                            <a href="#documents" className="inline-block mt-4 text-sm font-semibold hover:underline" style={{ color: primaryColor }}>Read more</a>
                        </div>

                        {/* Investigation Deadlines */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Investigation Deadlines</h3>
                            <ul className="space-y-3">
                                {DEADLINES.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="w-1 h-10 rounded-full bg-red-500 flex-shrink-0" aria-hidden />
                                        <span className="text-gray-700">{item.label}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Meeting Calendar */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Investigation Meetings</h3>
                            <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                                <span>Today</span>
                            </div>
                            <ul className="space-y-3">
                                {CALENDAR_ITEMS.map((item, i) => (
                                    <li key={i} className="flex gap-3 text-gray-700">
                                        <span className="font-medium text-gray-900 w-16 flex-shrink-0">{item.time}</span>
                                        <span>{item.title}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* At-Risk / No Recent Activity */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">High-Risk Providers (Monitor)</h3>
                            <ul className="space-y-2">
                                {AT_RISK_LIST.map((item, i) => (
                                    <li key={i} className="flex justify-between items-center text-gray-700">
                                        <span>{item.name}</span>
                                        <span className="font-semibold text-gray-900">{item.score}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Kibana Dashboards (ok-*) */}
                    {kibanaUrl && (
                        <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-2xl">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Kibana Dashboards</h3>
                            <p className="text-gray-600 text-sm mb-4">
                                Dashboards whose titles start with &quot;ok-&quot; are available in Kibana for deeper analysis.
                            </p>
                            <a
                                href={`${kibanaUrl.replace(/\/$/, '')}/app/dashboards`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white hover:opacity-90 transition-opacity"
                                style={{ backgroundColor: primaryColor }}
                            >
                                Open Kibana dashboards (ok-*)
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        </div>
                    )}
                </div>
            </section>

            {/* 5. Footer */}
            <footer className="bg-[#1a2332] text-white">
                <div className="border-t border-gray-700" />
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        <div>
                            <h3 className="font-bold text-lg mb-4">{template.branding.institutionName}</h3>
                            <p className="text-gray-300 text-sm mb-2">{template.footer?.address || ''}</p>
                            <p className="text-gray-300 text-sm">{template.footer?.phone || ''}</p>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
                            <ul className="space-y-2">
                                {template.footer?.quickLinks?.map((link, index) => (
                                    <li key={index}>
                                        <a href={link.href} className="text-gray-300 text-sm hover:text-white transition-colors">
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-4">Connect</h3>
                            <div className="flex gap-4">
                                {template.footer?.socialMedia?.map((social, index) => (
                                    <a
                                        key={index}
                                        href={social.href}
                                        className="text-gray-300 hover:text-white transition-colors font-semibold"
                                        aria-label={social.label}
                                    >
                                        {social.platform}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="border-t border-gray-700">
                    <div className="max-w-7xl mx-auto px-4 py-6">
                        <p className="text-center text-gray-400 text-sm">
                            © 2026 {template.branding.institutionName}. All Rights Reserved.
                        </p>
                    </div>
                </div>
            </footer>

            <ChatWidget floating={true} agentId="ok-fraud" />
        </div>
    );
}

export default MentalHealthFraudDashboard;
