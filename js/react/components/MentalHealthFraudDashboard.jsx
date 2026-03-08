/**
 * MentalHealthFraudDashboard - Fraud & Compliance staff dashboard for okmentalhealth template.
 * Layout inspired by Counselor Dashboard: high-priority cases table, metric cards, document queue,
 * deadlines, calendar, and at-risk list. Links to Kibana dashboards (ok-*) on gawdzilla.
 */

import { useContext } from 'react';
import { TemplateContext } from '../context/TemplateContext.jsx';
import { getSchemaLabels } from '../../config/schemaConfig.js';
import ChatWidget from './ChatWidget.jsx';

// Placeholder data for fraud dashboard (replace with API/Elastic when available)
const HIGH_PRIORITY_CASES = [
    { id: 'F-100023', name: 'Provider A – Metro BH', riskLevel: 'Critical', lastActivity: '14 days ago', fraudIndicator: 'Duplicate claim detected', claimStatus: 'Under review', actions: ['Flag', 'Investigate', 'Refer'] },
    { id: 'F-100011', name: 'Provider B – Rural SUD', riskLevel: 'High', lastActivity: '21 days ago', fraudIndicator: 'Unusual billing pattern', claimStatus: 'Flagged', actions: ['Email', 'Refer to Compliance'] },
    { id: 'F-100045', name: 'Provider C – Outpatient MH', riskLevel: 'Medium', lastActivity: '7 days ago', fraudIndicator: 'Suspicious diagnosis code', claimStatus: 'Clear', actions: ['Flag', 'Schedule'] },
];

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

function MentalHealthFraudDashboard({ onLogout }) {
    const template = useContext(TemplateContext);
    const schemaLabels = getSchemaLabels(template);
    const primaryColor = template?.colors?.primary || '#5D5FEF';
    const kibanaUrl = template?.elastic?.kibanaUrl || '';

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
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-6 py-3 font-semibold text-gray-900">Case / Provider</th>
                                        <th className="px-6 py-3 font-semibold text-gray-900">Risk Level</th>
                                        <th className="px-6 py-3 font-semibold text-gray-900">Last Activity</th>
                                        <th className="px-6 py-3 font-semibold text-gray-900">Fraud Indicator</th>
                                        <th className="px-6 py-3 font-semibold text-gray-900">Claim Status</th>
                                        <th className="px-6 py-3 font-semibold text-gray-900">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {HIGH_PRIORITY_CASES.map((row, i) => (
                                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <span className="font-medium text-gray-900">{row.name}</span>
                                                <span className="text-gray-500 block text-xs">#{row.id}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                        row.riskLevel === 'Critical'
                                                            ? 'bg-red-100 text-red-800'
                                                            : row.riskLevel === 'High'
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}
                                                >
                                                    {row.riskLevel}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{row.lastActivity}</td>
                                            <td className="px-6 py-4 text-gray-700">{row.fraudIndicator}</td>
                                            <td className="px-6 py-4 text-gray-600">{row.claimStatus}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {row.actions.slice(0, 2).map((action, j) => (
                                                        <button
                                                            key={j}
                                                            className="px-3 py-1 text-xs font-medium rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100"
                                                        >
                                                            {action}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Summary Metric Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <h4 className="text-sm font-medium text-gray-600 mb-2">Total Potential Fraud Detected YTD</h4>
                            <p className="text-3xl font-bold text-green-700">$187,400</p>
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
                            <p className="text-3xl font-bold" style={{ color: primaryColor }}>312</p>
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

            <ChatWidget floating={true} />
        </div>
    );
}

export default MentalHealthFraudDashboard;
