/**
 * BoosterDonorScorecard — Donor advancement scorecard with observations and outreach actions.
 */

import { useContext, useEffect, useMemo, useState } from 'react';
import { TemplateContext } from '../context/TemplateContext.jsx';
import { getSchemaLabels } from '../../config/schemaConfig.js';
import {
    getBoosterDonorById,
    getBoosterDonorEngagementEvents,
    getBoosterDonorEngagementTimeline,
} from '../../modules/utils/esqlQueries.js';
import {
    buildDonorObservations,
    appendEngagementDropObservations,
    formatCurrency,
    formatDate,
    formatPercent,
    getDonorField,
    phoneToTel,
} from '../../modules/utils/boosterDonorUtils.js';
import ChatWidget from './ChatWidget.jsx';
import BoosterGenerateEmailButton from './BoosterGenerateEmailButton.jsx';
import DonorEngagementTimeline from './DonorEngagementTimeline.jsx';

const BOOSTER_AGENT = 'booster-donor-data';

const OBSERVATION_STYLES = {
    critical: 'bg-red-50 border-red-200 text-red-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    positive: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    info: 'bg-sky-50 border-sky-200 text-sky-900',
};

function BoosterDonorScorecard({ donorId, onBack, onLogout, onDonorClick }) {
    const template = useContext(TemplateContext);
    const schemaLabels = getSchemaLabels(template);
    const primaryColor = template?.colors?.primary || '#0C2340';
    const secondaryColor = template?.colors?.secondary || '#F15A22';
    const agentId = template?.elastic?.boosterDataAgentId || BOOSTER_AGENT;
    const advancementPhone = template?.footer?.phone || '(555) 458-4000';

    const [donor, setDonor] = useState(null);
    const [events, setEvents] = useState([]);
    const [timelineEvents, setTimelineEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const timelineConfig = template?.elastic?.engagementTimeline || {};
    const timelineStartDate = timelineConfig.startDate || '2024-03-01';

    useEffect(() => {
        if (!donorId) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(null);

        Promise.all([
            getBoosterDonorById(donorId, agentId),
            getBoosterDonorEngagementEvents(donorId, agentId),
            getBoosterDonorEngagementTimeline(donorId, agentId, timelineStartDate),
        ])
            .then(([profile, engagementEvents, timeline]) => {
                if (!cancelled) {
                    setDonor(profile);
                    setEvents(engagementEvents);
                    setTimelineEvents(timeline);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err?.message || 'Failed to load donor');
                    setLoading(false);
                }
            });

        return () => { cancelled = true; };
    }, [donorId, agentId, timelineStartDate]);

    const observations = useMemo(
        () => appendEngagementDropObservations(
            buildDonorObservations(donor),
            timelineEvents,
            timelineConfig.inflectionDate
        ),
        [donor, timelineEvents, timelineConfig.inflectionDate]
    );

    const firstName = getDonorField(donor, 'first_name');
    const lastName = getDonorField(donor, 'last_name');
    const fullName = [firstName, lastName].filter(Boolean).join(' ');
    const email = getDonorField(donor, 'email');
    const affinity = getDonorField(donor, 'affinity_score');
    const institutionName = template?.branding?.institutionName || 'Athletics';
    const mailto = email
        ? `mailto:${email}?subject=${encodeURIComponent(`${institutionName} Athletics — ${fullName || donorId}`)}`
        : null;
    const telAdvancement = phoneToTel(advancementPhone);

    if (!template) {
        return (
            <div className="text-center p-8">
                <p className="text-gray-600">Loading template...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-50" style={{ fontFamily: template?.typography?.fontFamily }}>
            <header className="text-white py-2" style={{ backgroundColor: primaryColor }}>
                <div className="max-w-7xl mx-auto px-4 flex justify-end items-center gap-4">
                    <span className="text-sm">{schemaLabels.dashboardStaff}</span>
                    {onLogout && (
                        <button type="button" onClick={onLogout} className="px-4 py-1.5 text-sm font-medium hover:opacity-80">
                            Logout
                        </button>
                    )}
                </div>
            </header>

            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 flex items-center h-16">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-700 hover:opacity-80 font-medium"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to dashboard
                    </button>
                </div>
            </nav>

            <section className="py-8">
                <div className="max-w-7xl mx-auto px-4">
                    {loading ? (
                        <p className="text-gray-500">Loading donor scorecard…</p>
                    ) : error ? (
                        <p className="text-red-600">{error}</p>
                    ) : !donor ? (
                        <p className="text-gray-600">Donor not found: {donorId}</p>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-[32px] p-8 shadow-sm">
                                    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Donor scorecard</p>
                                            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-gray-900">
                                                {fullName || donorId}
                                            </h1>
                                            <p className="text-sm text-gray-500 mt-1">{donorId}</p>
                                            <p className="text-sm text-gray-600 mt-2">
                                                {getDonorField(donor, 'degree')} · Class of {getDonorField(donor, 'graduation_year') ?? '—'}
                                                {getDonorField(donor, 'location.city') && (
                                                    <> · {getDonorField(donor, 'location.city')}, {getDonorField(donor, 'location.state')}</>
                                                )}
                                            </p>
                                        </div>
                                        <div className="text-center rounded-2xl border border-gray-200 px-6 py-4 min-w-[120px]">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Affinity</p>
                                            <p className="text-4xl font-black mt-1" style={{ color: secondaryColor }}>
                                                {affinity?.toFixed?.(1) ?? affinity ?? '—'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-3 mb-8">
                                        <BoosterGenerateEmailButton
                                            donorId={donorId}
                                            recipientEmail={email || ''}
                                            variant="primary"
                                        />
                                        {mailto && (
                                            <a
                                                href={mailto}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-90"
                                                style={{ backgroundColor: primaryColor }}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                Email donor
                                            </a>
                                        )}
                                        {telAdvancement && (
                                            <a
                                                href={telAdvancement}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-90"
                                                style={{ backgroundColor: secondaryColor }}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                Call advancement
                                            </a>
                                        )}
                                        {email && (
                                            <button
                                                type="button"
                                                onClick={() => navigator.clipboard?.writeText(email)}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
                                            >
                                                Copy email
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                        <Metric label="Lifetime giving" value={formatCurrency(getDonorField(donor, 'giving_history.lifetime_total'))} />
                                        <Metric label="Last gift" value={formatDate(getDonorField(donor, 'giving_history.last_gift_date'))} />
                                        <Metric label="Email opens (90d)" value={formatPercent(getDonorField(donor, 'engagement.email_open_rate_90d'))} />
                                        <Metric label="Games attended" value={getDonorField(donor, 'engagement.game_attendance_count') ?? '—'} />
                                        <Metric label="Events YTD" value={getDonorField(donor, 'engagement.events_attended_ytd') ?? '—'} />
                                        <Metric label="iWave score" value={getDonorField(donor, 'wealth_signals.iwave_score') ?? '—'} />
                                        <Metric label="Capacity" value={getDonorField(donor, 'wealth_signals.estimated_capacity') ?? '—'} />
                                        <Metric label="Portfolio" value={getDonorField(donor, 'portfolio_status') ?? '—'} />
                                    </div>

                                    {getDonorField(donor, 'bio_text') && (
                                        <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-6">
                                            {getDonorField(donor, 'bio_text')}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-white border border-gray-200 rounded-[32px] p-6 shadow-sm">
                                        <h2 className="text-lg font-bold text-gray-900 mb-4">Key observations</h2>
                                        <ul className="space-y-3">
                                            {observations.map((obs, i) => (
                                                <li
                                                    key={i}
                                                    className={`rounded-2xl border px-4 py-3 ${OBSERVATION_STYLES[obs.level] || OBSERVATION_STYLES.info}`}
                                                >
                                                    <p className="font-semibold text-sm">{obs.title}</p>
                                                    <p className="text-xs mt-1 opacity-90">{obs.detail}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="bg-white border border-gray-200 rounded-[32px] p-6 shadow-sm">
                                        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent engagement</h2>
                                        {events.length === 0 ? (
                                            <p className="text-sm text-gray-500">No recent events recorded.</p>
                                        ) : (
                                            <ul className="space-y-2">
                                                {events.map((ev, i) => (
                                                    <li key={i} className="flex justify-between gap-3 text-sm border-b border-gray-100 pb-2">
                                                        <span className="font-medium text-gray-800">
                                                            {getDonorField(ev, 'event_label') || String(getDonorField(ev, 'event_type')).replace(/_/g, ' ')}
                                                        </span>
                                                        <span className="text-gray-500 shrink-0">
                                                            {formatDate(getDonorField(ev, 'event_date'))}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <DonorEngagementTimeline
                                donor={donor}
                                events={timelineEvents}
                                timelineConfig={timelineConfig}
                                kibanaUrl={template?.elastic?.kibanaUrl}
                                dashboardId={timelineConfig.dashboardId}
                                donorId={donorId}
                                primaryColor={primaryColor}
                                secondaryColor={secondaryColor}
                            />
                        </>
                    )}
                </div>
            </section>

            <ChatWidget floating agentId={agentId} onDonorClick={onDonorClick} />
        </div>
    );
}

function Metric({ label, value }) {
    return (
        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{value}</p>
        </div>
    );
}

export default BoosterDonorScorecard;
