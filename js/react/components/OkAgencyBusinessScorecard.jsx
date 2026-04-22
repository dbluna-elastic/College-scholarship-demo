/**
 * OkAgencyBusinessScorecard — Per-business grant eligibility scorecard (okagency staff flow).
 * Layout inspired by counselor student-success view: profile card, financial/eligibility card, activity metrics.
 */

import { useContext, useEffect, useMemo, useState } from 'react';
import { TemplateContext } from '../context/TemplateContext.jsx';
import ChatWidget from './ChatWidget.jsx';
import OkAgencyPortalHeader from './okagency/OkAgencyPortalHeader.jsx';
import OkAgencyFooter from './okagency/OkAgencyFooter.jsx';
import { OKAGENCY_CARD_CLASS, OKAGENCY_PAGE_BG_CLASS } from './okagency/okagencyUi.js';

function humanizeId(id) {
    if (!id || typeof id !== 'string') return 'Business';
    return id
        .split('-')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

const DEMO_SCORECARDS = {
    'prairie-alloy-fabrication-llc': {
        legalName: 'Prairie Alloy Fabrication LLC',
        tagline: 'Fabricated metal | 48 FTE | Subchapter S',
        location: 'Tulsa, Oklahoma',
        uei: 'E1N2K3L4M5N6',
        phone: '(918) 555-0142',
        email: 'controller@prairiealloy.example',
        eligibilityCurrent: 72,
        eligibilityMax: 100,
        compliancePct: 68,
        complianceWatch: true,
        revenuePct: 62,
        assetPct: 35,
        readinessScore: 720,
        readinessTier: 'mid',
        matchEligible: true,
        drawPct: 58,
        portalScore: 28,
        portalMax: 100,
        docScore: 52,
        docMax: 100,
        trainingScore: 9,
        trainingMax: 30,
        openFindings: 2,
        pastDue: 4,
        meetings: 1,
        costShareCurrent: 0.88,
        costShareMax: 1,
        initials: 'PA',
    },
    'red-river-manufacturing-llc': {
        legalName: 'Red River Manufacturing LLC',
        tagline: 'Industrial machinery | 120 FTE | C-Corp',
        location: 'Oklahoma City, Oklahoma',
        uei: 'R7V8W9X0Y1Z2',
        phone: '(405) 555-0801',
        email: 'grants@redrivermfg.example',
        eligibilityCurrent: 91,
        eligibilityMax: 100,
        compliancePct: 84,
        complianceWatch: false,
        revenuePct: 78,
        assetPct: 55,
        readinessScore: 890,
        readinessTier: 'high',
        matchEligible: true,
        drawPct: 72,
        portalScore: 62,
        portalMax: 100,
        docScore: 71,
        docMax: 100,
        trainingScore: 22,
        trainingMax: 30,
        openFindings: 0,
        pastDue: 1,
        meetings: 3,
        costShareCurrent: 0.95,
        costShareMax: 1,
        initials: 'RR',
    },
    'osage-food-solutions-inc': {
        legalName: 'Osage Food Solutions Inc.',
        tagline: 'Food manufacturing | 22 FTE | S-Corp',
        location: 'Pawhuska, Oklahoma',
        uei: 'O3S4A5G6E7F8',
        phone: '(918) 555-0091',
        email: 'finance@osagefoods.example',
        eligibilityCurrent: 88,
        eligibilityMax: 100,
        compliancePct: 76,
        complianceWatch: false,
        revenuePct: 55,
        assetPct: 42,
        readinessScore: 810,
        readinessTier: 'high',
        matchEligible: true,
        drawPct: 41,
        portalScore: 45,
        portalMax: 100,
        docScore: 60,
        docMax: 100,
        trainingScore: 15,
        trainingMax: 30,
        openFindings: 1,
        pastDue: 2,
        meetings: 2,
        costShareCurrent: 0.91,
        costShareMax: 1,
        initials: 'OF',
    },
    'tulsa-grid-services-cooperative': {
        legalName: 'Tulsa Grid Services Cooperative',
        tagline: 'Public utility cooperative | Regional',
        location: 'Tulsa, Oklahoma',
        uei: 'T9G0R1I2D3S4',
        phone: '(918) 555-2204',
        email: 'compliance@tulsagrid.example',
        eligibilityCurrent: 85,
        eligibilityMax: 100,
        compliancePct: 71,
        complianceWatch: true,
        revenuePct: 48,
        assetPct: 50,
        readinessScore: 655,
        readinessTier: 'mid',
        matchEligible: false,
        drawPct: 33,
        portalScore: 35,
        portalMax: 100,
        docScore: 48,
        docMax: 100,
        trainingScore: 11,
        trainingMax: 30,
        openFindings: 3,
        pastDue: 5,
        meetings: 0,
        costShareCurrent: 0.72,
        costShareMax: 1,
        initials: 'TG',
    },
    'cherokee-valley-logistics': {
        legalName: 'Cherokee Valley Logistics',
        tagline: 'Freight & warehousing | 35 FTE',
        location: 'Muskogee, Oklahoma',
        uei: 'C5V6L7O8G9H0',
        phone: '(918) 555-1000',
        email: 'ops@cherokeevalley.example',
        eligibilityCurrent: 58,
        eligibilityMax: 100,
        compliancePct: 52,
        complianceWatch: true,
        revenuePct: 44,
        assetPct: 28,
        readinessScore: 520,
        readinessTier: 'low',
        matchEligible: false,
        drawPct: 0,
        portalScore: 18,
        portalMax: 100,
        docScore: 30,
        docMax: 100,
        trainingScore: 6,
        trainingMax: 30,
        openFindings: 4,
        pastDue: 7,
        meetings: 0,
        costShareCurrent: 0.55,
        costShareMax: 1,
        initials: 'CV',
    },
    'stillwater-precision-machining': {
        legalName: 'Stillwater Precision Machining',
        tagline: 'Precision machining | 18 FTE',
        location: 'Stillwater, Oklahoma',
        uei: 'S1T2I3L4L5W6',
        phone: '(405) 555-2030',
        email: 'admin@stillwaterprecision.example',
        eligibilityCurrent: 64,
        eligibilityMax: 100,
        compliancePct: 61,
        complianceWatch: true,
        revenuePct: 50,
        assetPct: 32,
        readinessScore: 590,
        readinessTier: 'low',
        matchEligible: true,
        drawPct: 12,
        portalScore: 22,
        portalMax: 100,
        docScore: 38,
        docMax: 100,
        trainingScore: 8,
        trainingMax: 30,
        openFindings: 2,
        pastDue: 3,
        meetings: 1,
        costShareCurrent: 0.68,
        costShareMax: 1,
        initials: 'SP',
    },
    'enid-agricultural-co-op': {
        legalName: 'Enid Agricultural Co-op',
        tagline: 'Agricultural cooperative | 60 members',
        location: 'Enid, Oklahoma',
        uei: 'E7N8I9D0A1G2',
        phone: '(580) 555-1122',
        email: 'board@enidagcoop.example',
        eligibilityCurrent: 70,
        eligibilityMax: 100,
        compliancePct: 74,
        complianceWatch: false,
        revenuePct: 58,
        assetPct: 40,
        readinessScore: 695,
        readinessTier: 'mid',
        matchEligible: true,
        drawPct: 25,
        portalScore: 40,
        portalMax: 100,
        docScore: 55,
        docMax: 100,
        trainingScore: 14,
        trainingMax: 30,
        openFindings: 1,
        pastDue: 2,
        meetings: 2,
        costShareCurrent: 0.82,
        costShareMax: 1,
        initials: 'EA',
    },
    'lawton-municipal-utilities-auth': {
        legalName: 'Lawton Municipal Utilities Auth.',
        tagline: 'Municipal utility | Public entity',
        location: 'Lawton, Oklahoma',
        uei: 'L3M4U5N6I7C8',
        phone: '(580) 555-7788',
        email: 'grants@lawtonutilities.example',
        eligibilityCurrent: 81,
        eligibilityMax: 100,
        compliancePct: 79,
        complianceWatch: false,
        revenuePct: 70,
        assetPct: 62,
        readinessScore: 765,
        readinessTier: 'high',
        matchEligible: true,
        drawPct: 48,
        portalScore: 48,
        portalMax: 100,
        docScore: 64,
        docMax: 100,
        trainingScore: 18,
        trainingMax: 30,
        openFindings: 0,
        pastDue: 1,
        meetings: 4,
        costShareCurrent: 0.9,
        costShareMax: 1,
        initials: 'LM',
    },
};

function buildDefaultScorecard(businessId) {
    const name = humanizeId(businessId);
    return {
        legalName: name,
        tagline: 'Registered business | Oklahoma',
        location: 'Oklahoma',
        uei: '—',
        phone: '—',
        email: '—',
        eligibilityCurrent: 65,
        eligibilityMax: 100,
        compliancePct: 60,
        complianceWatch: true,
        revenuePct: 50,
        assetPct: 35,
        readinessScore: 600,
        readinessTier: 'mid',
        matchEligible: true,
        drawPct: 20,
        portalScore: 35,
        portalMax: 100,
        docScore: 45,
        docMax: 100,
        trainingScore: 10,
        trainingMax: 30,
        openFindings: 1,
        pastDue: 2,
        meetings: 1,
        costShareCurrent: 0.75,
        costShareMax: 1,
        initials: name
            .split(/\s+/)
            .map((w) => w[0])
            .filter(Boolean)
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'B',
    };
}

function getScorecardData(businessId) {
    if (!businessId) return buildDefaultScorecard('unknown');
    return DEMO_SCORECARDS[businessId] || buildDefaultScorecard(businessId);
}

function DonutGauge({ current, max, color, trackColor = '#e5e7eb', size = 96, stroke = 9 }) {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const pct = max > 0 ? Math.min(1, current / max) : 0;
    const offset = c * (1 - pct);
    return (
        <div className="relative inline-flex" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90" aria-hidden>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={offset}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-bold text-gray-900 leading-none">
                    {current}
                    <span className="text-gray-400 text-sm font-semibold">/{max}</span>
                </span>
            </div>
        </div>
    );
}

function HorizontalBar({ pct, color }) {
    const w = Math.min(100, Math.max(0, pct));
    return (
        <div className="h-2.5 w-full rounded-full bg-gray-200 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${w}%`, backgroundColor: color }} />
        </div>
    );
}

function OkAgencyBusinessScorecard({ businessId, onBack, onLogout, campusId }) {
    const template = useContext(TemplateContext);
    const bc = template?.content?.businessScorecard || {};
    const primaryColor = template?.colors?.primary || '#003366';
    const accentPurple = '#5b21b6';
    const data = useMemo(() => getScorecardData(businessId), [businessId]);
    const [query, setQuery] = useState('');

    useEffect(() => {
        setQuery(data.legalName);
    }, [data.legalName]);

    const readinessSubtitle =
        data.readinessTier === 'high'
            ? bc.readinessSubtitleHigh
            : data.readinessTier === 'low'
              ? bc.readinessSubtitleLow
              : bc.readinessSubtitleMid;

    if (!template) {
        return (
            <div className="text-center p-8">
                <p className="text-gray-600">Loading template...</p>
            </div>
        );
    }

    return (
        <div
            className={`min-h-screen w-full ${OKAGENCY_PAGE_BG_CLASS}`}
            style={{ fontFamily: template.typography?.fontFamily }}
        >
            <OkAgencyPortalHeader
                position="sticky"
                showNavLinks
                onLogout={onLogout}
                campusId={campusId}
            />

            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <button
                            type="button"
                            onClick={onBack}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
                        >
                            <span aria-hidden>←</span> {bc.back || 'Back'}
                        </button>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold" style={{ color: primaryColor }}>
                        {bc.pageTitle || 'Business grant eligibility scorecard'}
                    </h1>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex flex-1 min-w-0 gap-2">
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={bc.searchPlaceholder || 'Search…'}
                                className="flex-1 min-w-0 rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-blue-900/20 focus:outline-none"
                            />
                            <button
                                type="button"
                                className="shrink-0 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
                                style={{ backgroundColor: primaryColor }}
                            >
                                {bc.searchButton || 'Search'}
                            </button>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600">
                        {bc.viewingPrefix || 'Viewing'} <span className="font-semibold text-gray-900">{data.legalName}</span>.
                    </p>
                </div>

                {/* Profile card */}
                <section className={`mb-6 ${OKAGENCY_CARD_CLASS} p-6`}>
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">
                        {bc.cardProfileTitle || 'Organization profile'}
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-4 flex gap-4">
                            <div
                                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
                                style={{ backgroundColor: primaryColor }}
                            >
                                {data.initials}
                            </div>
                            <div>
                                <p className="text-xl font-bold text-gray-900">{data.legalName}</p>
                                <p className="text-sm text-gray-600 mt-1">{data.tagline}</p>
                            </div>
                        </div>
                        <div className="lg:col-span-4 space-y-2 text-sm text-gray-700">
                            <p>
                                <span className="font-medium text-gray-900">{bc.entityIdLabel || 'UEI'}:</span> {data.uei}
                            </p>
                            <p>
                                <span className="font-medium text-gray-900">{bc.phoneLabel || 'Phone'}:</span> {data.phone}
                            </p>
                            <p>
                                <span className="font-medium text-gray-900">{bc.emailLabel || 'Email'}:</span> {data.email}
                            </p>
                            <p>
                                <span className="font-medium text-gray-900">{bc.locationLabel || 'Location'}:</span>{' '}
                                {data.location}
                            </p>
                        </div>
                        <div className="lg:col-span-4 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-end">
                            <div className="flex flex-col items-center">
                                <DonutGauge
                                    current={data.eligibilityCurrent}
                                    max={data.eligibilityMax}
                                    color={primaryColor}
                                />
                                <p className="text-xs text-center text-gray-600 mt-2 max-w-[7rem]">
                                    {bc.eligibilityGaugeLabel || 'Eligibility index'}
                                </p>
                            </div>
                            <div className="flex-1 w-full max-w-xs">
                                <p className="text-xs font-medium text-gray-600 mb-2">
                                    {bc.complianceBarLabel || 'Compliance'}
                                </p>
                                <HorizontalBar pct={data.compliancePct} color={accentPurple} />
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-sm font-semibold text-gray-900">{data.compliancePct}%</span>
                                    <span
                                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                            data.complianceWatch
                                                ? 'bg-amber-100 text-amber-900'
                                                : 'bg-emerald-100 text-emerald-900'
                                        }`}
                                    >
                                        {data.complianceWatch
                                            ? bc.complianceTagWatch || 'Watch'
                                            : bc.complianceTagOnTrack || 'On track'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Financial & alignment */}
                <section className={`mb-6 ${OKAGENCY_CARD_CLASS} p-6`}>
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">
                        {bc.cardFinancialTitle || 'Financial & grant alignment'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                        <div className="md:col-span-4 space-y-5">
                            <div>
                                <p className="text-xs font-medium text-gray-600 mb-2">
                                    {bc.revenueBarLabel || 'Annual revenue'}
                                </p>
                                <HorizontalBar pct={data.revenuePct} color={accentPurple} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-600 mb-2">
                                    {bc.assetBarLabel || 'Assets'}
                                </p>
                                <HorizontalBar pct={data.assetPct} color={accentPurple} />
                            </div>
                        </div>
                        <div className="md:col-span-4 text-center py-4">
                            <p className="text-xs font-medium text-gray-500 mb-1 flex items-center justify-center gap-1">
                                <span aria-hidden>★</span> {bc.readinessTitle || 'Grant readiness score'}
                            </p>
                            <p className="text-5xl font-black tracking-tight text-gray-900">{data.readinessScore}</p>
                            <p className="text-sm text-gray-600 mt-2 max-w-xs mx-auto">{readinessSubtitle}</p>
                        </div>
                        <div className="md:col-span-4 space-y-4">
                            <p className="text-sm text-gray-800">
                                <span className="font-semibold">{bc.matchEligibleLabel || 'Match eligible'}:</span>{' '}
                                {data.matchEligible ? (
                                    <span className="text-emerald-700 font-semibold">{bc.matchYes || 'Yes'}</span>
                                ) : (
                                    <span className="text-gray-500 font-semibold">{bc.matchNo || 'No'}</span>
                                )}
                            </p>
                            <div>
                                <p className="text-xs font-medium text-gray-600 mb-2">
                                    {bc.drawProgressLabel || 'Draw-down'}
                                </p>
                                <HorizontalBar pct={data.drawPct} color="#64748b" />
                                <p className="text-xs text-gray-500 mt-1">{data.drawPct}% of approved award drawn</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Activity metrics */}
                <section className={`${OKAGENCY_CARD_CLASS} p-6`}>
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-6">
                        {bc.cardActivityTitle || 'Engagement & compliance'}
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        <div className="lg:col-span-5 flex flex-wrap justify-center gap-8">
                            <div className="flex flex-col items-center">
                                <DonutGauge
                                    current={data.portalScore}
                                    max={data.portalMax}
                                    color="#dc2626"
                                    size={88}
                                    stroke={8}
                                />
                                <p className="text-xs text-center text-gray-600 mt-2 w-24">
                                    {bc.portalEngagementLabel || 'Portal engagement'}
                                </p>
                            </div>
                            <div className="flex flex-col items-center">
                                <DonutGauge
                                    current={data.docScore}
                                    max={data.docMax}
                                    color="#dc2626"
                                    size={88}
                                    stroke={8}
                                />
                                <p className="text-xs text-center text-gray-600 mt-2 w-24">
                                    {bc.documentSlaLabel || 'Document SLA'}
                                </p>
                            </div>
                            <div className="flex flex-col items-center">
                                <DonutGauge
                                    current={data.trainingScore}
                                    max={data.trainingMax}
                                    color="#dc2626"
                                    size={88}
                                    stroke={8}
                                />
                                <p className="text-xs text-center text-gray-600 mt-2 w-24">
                                    {bc.trainingLabel || 'Training'}
                                </p>
                            </div>
                        </div>
                        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                            <div>
                                <p className="text-3xl font-bold text-amber-600">{data.openFindings}</p>
                                <p className="text-xs text-gray-600 mt-1">{bc.counterOpenFindings || 'Findings'}</p>
                            </div>
                            <div>
                                <p
                                    className={`text-3xl font-bold ${
                                        data.pastDue === 0 ? 'text-emerald-700' : 'text-amber-600'
                                    }`}
                                >
                                    {data.pastDue}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">{bc.counterPastDueTasks || 'Past-due'}</p>
                            </div>
                            <div>
                                <p
                                    className={`text-3xl font-bold ${
                                        data.meetings === 0 ? 'text-red-600' : 'text-emerald-700'
                                    }`}
                                >
                                    {data.meetings}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">{bc.counterOfficerMeetings || 'Meetings'}</p>
                            </div>
                        </div>
                        <div className="lg:col-span-3 flex flex-col items-center justify-center">
                            <DonutGauge
                                current={Math.round(data.costShareCurrent * 100)}
                                max={Math.round(data.costShareMax * 100)}
                                color="#16a34a"
                                size={88}
                                stroke={8}
                            />
                            <p className="text-xs text-center text-gray-600 mt-2 w-28">
                                {bc.costShareRatioLabel || 'Cost-share ratio'}
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-8 border-t border-gray-100 pt-4">
                        {bc.demoFootnote || 'Demonstration metrics.'}
                    </p>
                </section>
            </main>

            <OkAgencyFooter />

            <ChatWidget floating />
        </div>
    );
}

export default OkAgencyBusinessScorecard;
