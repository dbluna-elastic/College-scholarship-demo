/**
 * OkAgencyStaffDashboard — Grant program staff desk for okagency template.
 * Layout aligned with MentalHealthFraudDashboard / counselor mock: chrome, priority table,
 * KPIs, 2×2 grid, bottom row (expiring grants, pipeline bar, prime candidates).
 */

import { useContext } from 'react';
import { TemplateContext } from '../context/TemplateContext.jsx';
import { getSchemaLabels } from '../../config/schemaConfig.js';
import ChatWidget from './ChatWidget.jsx';
import OkAgencyPortalHeader from './okagency/OkAgencyPortalHeader.jsx';
import OkAgencyFooter from './okagency/OkAgencyFooter.jsx';
import { OKAGENCY_CARD_CLASS, OKAGENCY_PAGE_BG_CLASS } from './okagency/okagencyUi.js';

const HIGH_PRIORITY_ROWS = [
    {
        businessId: 'prairie-alloy-fabrication-llc',
        business: 'Prairie Alloy Fabrication LLC',
        awardId: 'MG-2026-0142',
        priority: 'Critical',
        lastActivity: '21 days ago',
        alert: 'Annual performance report overdue',
        financial: 'Match current; reimbursement hold',
    },
    {
        businessId: 'red-river-manufacturing-llc',
        business: 'Red River Manufacturing LLC',
        awardId: 'MG-2025-0801',
        priority: 'Critical',
        lastActivity: '14 days ago',
        alert: 'Award term ends in 38 days — renewal LOI not started',
        financial: 'Disbursed 72%; renewal match TBD',
    },
    {
        businessId: 'osage-food-solutions-inc',
        business: 'Osage Food Solutions Inc.',
        awardId: 'MG-2026-0091',
        priority: 'High',
        lastActivity: '9 days ago',
        alert: 'Quarterly draw certification pending review',
        financial: 'Match verified',
    },
    {
        businessId: 'tulsa-grid-services-cooperative',
        business: 'Tulsa Grid Services Cooperative',
        awardId: 'MG-2024-2204',
        priority: 'High',
        lastActivity: '6 days ago',
        alert: 'Post-award audit response due',
        financial: 'Final invoice clearance',
    },
];

const DOCUMENT_QUEUE = [
    { label: 'Renewal packet — Prairie Alloy Fabrication (MG-2026-0142)' },
    { label: 'SAM.gov entity validation — Osage Food Solutions' },
    { label: 'Cost-share documentation — Red River Manufacturing' },
];

const DEADLINES = [
    { label: 'Rural Jobs Match — full application deadline in 3 days' },
    { label: 'Innovation Corridor — award term expiration in 12 days' },
    { label: 'Export Development Match — renewal LOI window closes in 5 days' },
];

const CALENDAR_ITEMS = [
    { time: '9:00 AM', title: 'Site visit — Red River Manufacturing' },
    { time: '10:30 AM', title: 'Renewal intake call — Prairie Alloy' },
    { time: '2:00 PM', title: 'Interagency program sync (broadband)' },
];

const AT_RISK_LIST = [
    { businessId: 'cherokee-valley-logistics', name: 'Cherokee Valley Logistics', days: 40 },
    { businessId: 'stillwater-precision-machining', name: 'Stillwater Precision Machining', days: 35 },
    { businessId: 'enid-agricultural-co-op', name: 'Enid Agricultural Co-op', days: 28 },
    { businessId: 'lawton-municipal-utilities-auth', name: 'Lawton Municipal Utilities Auth.', days: 22 },
];

const EXPIRING_GRANTS = [
    { title: 'STEM Excellence Workforce Grant', amount: '$5,000 – $75K', expiresIn: 'Expires in 3 days', matches: 14 },
    { title: 'Academic Merit Innovation Voucher', amount: '$25K – $150K', expiresIn: 'Renewal window closes in 6 days', matches: 9 },
    { title: 'Main Street Revitalization (forecasted)', amount: 'Dependent', expiresIn: 'Pre-application opens in 11 days', matches: 22 },
];

const PIPELINE_SEGMENTS = [
    { key: 'submitted', count: 842, color: 'bg-slate-500' },
    { key: 'inReview', count: 318, color: 'bg-amber-500' },
    { key: 'awarded', count: 156, color: 'bg-emerald-600' },
    { key: 'renewal', count: 47, color: 'bg-orange-500' },
    { key: 'closed', count: 203, color: 'bg-slate-300' },
];

const PRIME_CANDIDATES = [
    {
        businessId: 'prairie-alloy-fabrication-llc',
        initials: 'PA',
        name: 'Prairie Alloy Fabrication LLC',
        eligibility: 94,
        engagement: '2d ago',
        profile: '332112 / 48 FTE',
    },
    {
        businessId: 'red-river-manufacturing-llc',
        initials: 'RR',
        name: 'Red River Manufacturing LLC',
        eligibility: 91,
        engagement: '4d ago',
        profile: '332999 / 120 FTE',
    },
    {
        businessId: 'osage-food-solutions-inc',
        initials: 'OF',
        name: 'Osage Food Solutions Inc.',
        eligibility: 88,
        engagement: '1w ago',
        profile: '311421 / 22 FTE',
    },
    {
        businessId: 'tulsa-grid-services-cooperative',
        initials: 'TG',
        name: 'Tulsa Grid Services Cooperative',
        eligibility: 85,
        engagement: '3d ago',
        profile: '221122 / regional',
    },
];

function priorityBadgeClass(priority) {
    if (priority === 'Critical') return 'bg-red-100 text-red-800';
    if (priority === 'High') return 'bg-amber-100 text-amber-800';
    return 'bg-gray-100 text-gray-800';
}

function OkAgencyStaffDashboard({ onLogout, campusId, onBusinessClick }) {
    const template = useContext(TemplateContext);
    const schemaLabels = getSchemaLabels(template);
    const sd = template?.content?.staffDashboard || {};
    const primaryColor = template?.colors?.primary || '#003366';

    const pageTitle = sd.pageTitle || schemaLabels.dashboardStaff;
    const subtitle =
        sd.subtitle ||
        'Match state grants to eligible businesses. Prioritize renewals and expiring award terms.';

    if (!template) {
        return (
            <div className="text-center p-8">
                <p className="text-gray-600">Loading template...</p>
            </div>
        );
    }

    const kpiRenewalPct = Number(sd.kpiRenewalPercent);
    const renewalWidth = Number.isFinite(kpiRenewalPct) ? Math.min(100, Math.max(0, kpiRenewalPct)) : 72;

    const pl = (key, fallback) => {
        const seg = PIPELINE_SEGMENTS.find((s) => s.key === key);
        const labelMap = {
            submitted: sd.pipelineSubmitted,
            inReview: sd.pipelineInReview,
            awarded: sd.pipelineAwarded,
            renewal: sd.pipelineRenewal,
            closed: sd.pipelineClosed,
        };
        return { label: labelMap[key] || fallback, count: seg?.count ?? 0, color: seg?.color || 'bg-slate-400' };
    };

    const pipelineLegend = [
        pl('submitted', 'Submitted'),
        pl('inReview', 'In review'),
        pl('awarded', 'Awarded (active)'),
        pl('renewal', 'Renewal due'),
        pl('closed', 'Closed'),
    ];

    return (
        <div
            className={`min-h-screen w-full ${OKAGENCY_PAGE_BG_CLASS}`}
            style={{ fontFamily: template?.typography?.fontFamily }}
        >
            <OkAgencyPortalHeader
                position="sticky"
                showNavLinks
                onLogout={onLogout}
                campusId={campusId}
            />

            <section className="py-8">
                <div className="max-w-7xl mx-auto px-4">
                    <h2
                        className="text-4xl md:text-5xl font-bold mb-2"
                        style={{ fontFamily: 'var(--font-family)', color: primaryColor }}
                    >
                        {pageTitle}
                    </h2>
                    <p className="text-gray-600 mb-8">{subtitle}</p>

                    <div className={`${OKAGENCY_CARD_CLASS} overflow-hidden mb-8`}>
                        <div className="px-6 py-4 border-b border-slate-200">
                            <h3 className="text-xl font-bold text-gray-900">
                                {sd.priorityTableTitle || 'High-priority awards & renewals'}
                            </h3>
                        </div>
                        <div className="overflow-x-auto overflow-y-auto max-h-[22rem]">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="sticky top-0 z-10 bg-slate-50 px-6 py-3 font-semibold text-slate-900">
                                            {sd.colBusiness || 'Business / Award ID'}
                                        </th>
                                        <th className="sticky top-0 z-10 bg-slate-50 px-6 py-3 font-semibold text-slate-900">
                                            {sd.colPriority || 'Priority'}
                                        </th>
                                        <th className="sticky top-0 z-10 bg-slate-50 px-6 py-3 font-semibold text-slate-900">
                                            {sd.colLastActivity || 'Last portal activity'}
                                        </th>
                                        <th className="sticky top-0 z-10 bg-slate-50 px-6 py-3 font-semibold text-slate-900">
                                            {sd.colAlert || 'Compliance / renewal'}
                                        </th>
                                        <th className="sticky top-0 z-10 bg-slate-50 px-6 py-3 font-semibold text-slate-900">
                                            {sd.colFinancial || 'Match & disbursement'}
                                        </th>
                                        <th className="sticky top-0 z-10 bg-slate-50 px-6 py-3 font-semibold text-slate-900">
                                            {sd.colAction || 'Action'}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {HIGH_PRIORITY_ROWS.map((row) => (
                                        <tr key={row.awardId} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                {typeof onBusinessClick === 'function' ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => onBusinessClick(row.businessId)}
                                                        className="text-left font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded"
                                                        style={{ color: primaryColor }}
                                                    >
                                                        {row.business}
                                                    </button>
                                                ) : (
                                                    <span className="font-medium text-gray-900">{row.business}</span>
                                                )}
                                                <span className="text-gray-500 block text-xs">#{row.awardId}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${priorityBadgeClass(row.priority)}`}
                                                >
                                                    {row.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{row.lastActivity}</td>
                                            <td className="px-6 py-4 text-gray-700">{row.alert}</td>
                                            <td className="px-6 py-4 text-gray-600">{row.financial}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    <button
                                                        type="button"
                                                        className="px-3 py-1 text-xs font-medium rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100"
                                                    >
                                                        {sd.actionEmail || 'Email'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="px-3 py-1 text-xs font-medium rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100"
                                                    >
                                                        {sd.actionCall || 'Call'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="px-3 py-1 text-xs font-medium rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100"
                                                    >
                                                        {sd.actionSchedule || 'Schedule'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="px-3 py-1 text-xs font-medium rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100"
                                                    >
                                                        {sd.actionRefer || 'Refer'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="px-6 py-3 text-xs text-slate-500 border-t border-slate-100 bg-slate-50/80">
                            {sd.tableDemoFootnote ||
                                'Demonstration data. Officer actions are illustrative.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className={`${OKAGENCY_CARD_CLASS} p-6`}>
                            <h4 className="text-sm font-medium text-gray-600 mb-2">
                                {sd.kpiDisbursedLabel || 'State funds disbursed YTD'}
                            </h4>
                            <p className="text-3xl font-bold text-emerald-700">{sd.kpiDisbursedValue || '$18.4M'}</p>
                        </div>
                        <div className={`${OKAGENCY_CARD_CLASS} p-6`}>
                            <h4 className="text-sm font-medium text-gray-600 mb-2">
                                {sd.kpiRenewalLabel || 'Renewal & closeout package completion'}
                            </h4>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-blue-600"
                                        style={{ width: `${renewalWidth}%` }}
                                    />
                                </div>
                                <span className="text-2xl font-bold text-gray-900">{renewalWidth}%</span>
                            </div>
                        </div>
                        <div className={`${OKAGENCY_CARD_CLASS} p-6`}>
                            <h4 className="text-sm font-medium text-gray-600 mb-2">
                                {sd.kpiPipelineLabel || 'Applications in active pipeline'}
                            </h4>
                            <p className="text-3xl font-bold" style={{ color: primaryColor }}>
                                {sd.kpiPipelineValue || '842'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <div className={`${OKAGENCY_CARD_CLASS} p-6`}>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                                {sd.docQueueTitle || 'Renewal & compliance document queue'}
                            </h3>
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
                            <a
                                href="#documents"
                                className="inline-block mt-4 text-sm font-semibold hover:underline"
                                style={{ color: primaryColor }}
                            >
                                {sd.readMoreLink || 'Read more'}
                            </a>
                        </div>

                        <div className={`${OKAGENCY_CARD_CLASS} p-6`}>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                                {sd.deadlinesTitle || 'Approaching deadlines & expirations'}
                            </h3>
                            <ul className="space-y-3">
                                {DEADLINES.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="w-1 h-10 rounded-full bg-red-500 flex-shrink-0" aria-hidden />
                                        <span className="text-gray-700">{item.label}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className={`${OKAGENCY_CARD_CLASS} p-6`}>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                                {sd.calendarTitle || 'Program officer calendar'}
                            </h3>
                            <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                                <span>{sd.calendarToday || 'Today'}</span>
                            </div>
                            <ul className="space-y-3">
                                {CALENDAR_ITEMS.map((item, i) => (
                                    <li key={i} className="flex gap-3 text-gray-700">
                                        <span className="font-medium text-gray-900 w-20 flex-shrink-0">{item.time}</span>
                                        <span>{item.title}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className={`${OKAGENCY_CARD_CLASS} p-6`}>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                                {sd.atRiskTitle || 'Businesses — low portal activity'}
                            </h3>
                            <ul className="space-y-2">
                                {AT_RISK_LIST.map((item, i) => (
                                    <li key={i} className="flex justify-between items-center text-gray-700 gap-2">
                                        {typeof onBusinessClick === 'function' ? (
                                            <button
                                                type="button"
                                                onClick={() => onBusinessClick(item.businessId)}
                                                className="text-left hover:underline focus:outline-none focus:ring-2 focus:ring-offset-1 rounded min-w-0 truncate"
                                                style={{ color: primaryColor }}
                                            >
                                                {item.name}
                                            </button>
                                        ) : (
                                            <span className="truncate">{item.name}</span>
                                        )}
                                        <span className="font-semibold text-red-700 shrink-0">{item.days}</span>
                                    </li>
                                ))}
                            </ul>
                            <p className="text-xs text-gray-500 mt-3">
                                {sd.atRiskCaption || 'Days since last meaningful portal activity.'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className={`${OKAGENCY_CARD_CLASS} p-6 lg:col-span-1`}>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                                {sd.expiringTitle || 'Grants & award terms expiring soon'}
                            </h3>
                            <ul className="space-y-4">
                                {EXPIRING_GRANTS.map((g, i) => (
                                    <li key={i} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                                        <p className="font-semibold text-gray-900">{g.title}</p>
                                        <p className="text-sm text-gray-600">{g.amount}</p>
                                        <p className="text-sm text-amber-800 font-medium mt-1">{g.expiresIn}</p>
                                        <button
                                            type="button"
                                            className="mt-2 text-sm font-semibold hover:underline text-left"
                                            style={{ color: primaryColor }}
                                        >
                                            {sd.matchedBusinessesLink || 'Matched businesses'} ({g.matches})
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className={`${OKAGENCY_CARD_CLASS} p-6 lg:col-span-1`}>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                                {sd.pipelineTitle || 'Award pipeline status'}
                            </h3>
                            <div className="flex h-4 rounded-full overflow-hidden mb-4" role="img" aria-label="Pipeline distribution">
                                {PIPELINE_SEGMENTS.map((seg) => (
                                    <div
                                        key={seg.key}
                                        className={`${seg.color} min-w-[4px]`}
                                        style={{ flexGrow: seg.count, flexBasis: 0 }}
                                        title={`${seg.count}`}
                                    />
                                ))}
                            </div>
                            <ul className="space-y-2 text-sm">
                                {pipelineLegend.map((item) => (
                                    <li key={item.label} className="flex justify-between text-gray-700">
                                        <span>{item.label}</span>
                                        <span className="font-semibold text-gray-900">{item.count.toLocaleString()}</span>
                                    </li>
                                ))}
                            </ul>
                            <p className="text-xs text-gray-500 mt-4">
                                {sd.pipelineFootnote ||
                                    'Counts are illustrative totals across all open programs.'}
                            </p>
                        </div>

                        <div className={`${OKAGENCY_CARD_CLASS} p-6 lg:col-span-1`}>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                                {sd.primeTitle || 'Prime grant-match candidates'}
                            </h3>
                            <ul className="space-y-4">
                                {PRIME_CANDIDATES.map((c) => (
                                    <li key={c.name} className="flex gap-3 items-start">
                                        <span
                                            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                                            style={{ backgroundColor: primaryColor }}
                                        >
                                            {c.initials}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            {typeof onBusinessClick === 'function' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => onBusinessClick(c.businessId)}
                                                    className="font-semibold text-left truncate w-full hover:underline focus:outline-none focus:ring-2 focus:ring-offset-1 rounded"
                                                    style={{ color: primaryColor }}
                                                >
                                                    {c.name}
                                                </button>
                                            ) : (
                                                <p className="font-semibold text-gray-900 truncate">{c.name}</p>
                                            )}
                                            <p className="text-xs text-gray-600 mt-1">
                                                <span className="font-medium">{sd.primeColEligibility || 'Eligibility'}:</span>{' '}
                                                {c.eligibility}
                                                {' · '}
                                                <span className="font-medium">{sd.primeColEngagement || 'Last touch'}:</span>{' '}
                                                {c.engagement}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {sd.primeColProfile || 'NAICS / size'}: {c.profile}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <OkAgencyFooter />

            <ChatWidget floating />
        </div>
    );
}

export default OkAgencyStaffDashboard;
