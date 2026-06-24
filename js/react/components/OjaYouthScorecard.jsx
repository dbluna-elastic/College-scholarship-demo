/**
 * OjaYouthScorecard — youth profile drill-down with assessments, notes, and outcomes.
 */

import { useContext, useEffect, useState } from 'react';
import { TemplateContext } from '../context/TemplateContext.jsx';
import ChatWidget from './ChatWidget.jsx';
import OjaGenerateEmailButton from './oja/OjaGenerateEmailButton.jsx';
import {
    getOjaYouthById,
    getOjaYouthAssessments,
    getOjaYouthNotes,
    getOjaYouthOutcome,
} from '../../modules/utils/ojaEsqlQueries.js';
import { getSchemaLabels } from '../../config/schemaConfig.js';

export default function OjaYouthScorecard({ youthId, onBack, onLogout }) {
    const template = useContext(TemplateContext);
    const schemaLabels = getSchemaLabels(template);
    const primaryColor = template?.colors?.primary || '#1B3A5C';
    const agentId = template?.elastic?.agentId || 'ok-oja-data';

    const [profile, setProfile] = useState(null);
    const [assessments, setAssessments] = useState([]);
    const [notes, setNotes] = useState([]);
    const [outcome, setOutcome] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!youthId) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        Promise.all([
            getOjaYouthById(youthId),
            getOjaYouthAssessments(youthId),
            getOjaYouthNotes(youthId, 6),
            getOjaYouthOutcome(youthId),
        ])
            .then(([p, a, n, o]) => {
                if (!cancelled) {
                    setProfile(p);
                    setAssessments(a);
                    setNotes(n);
                    setOutcome(o);
                    setLoading(false);
                    if (!p) setError('Youth profile not found.');
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err?.message || 'Failed to load youth profile.');
                    setLoading(false);
                }
            });
        return () => { cancelled = true; };
    }, [youthId]);

    const fullName = profile ? `${profile.first_name} ${profile.last_name}` : youthId;

    return (
        <div className="w-full min-h-screen bg-white">
            <header className="bg-[#1a2332] text-white py-2">
                <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
                    <span className="text-sm">{schemaLabels.dashboardStaff}</span>
                    <div className="flex gap-3">
                        <button type="button" onClick={onBack} className="text-sm hover:opacity-80">← Back</button>
                        {onLogout && (
                            <button type="button" onClick={onLogout} className="text-sm hover:opacity-80">Logout</button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-10">
                {loading && <p className="text-gray-600">Loading youth profile…</p>}
                {error && <p className="text-red-600">{error}</p>}

                {profile && (
                    <div className="space-y-8">
                        <div className="rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <p className="text-sm text-gray-500">{profile.youth_id}</p>
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <h1 className="text-3xl font-black tracking-tight text-gray-900">{fullName}</h1>
                                <OjaGenerateEmailButton
                                    youthId={profile.youth_id}
                                    label={template?.content?.staffDashboard?.generateEmailLabel || 'Generate supervisor email'}
                                />
                            </div>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div><span className="text-gray-500">Status</span><p className="font-semibold">{profile.case_status} · {profile.supervision_level}</p></div>
                                <div><span className="text-gray-500">Offense</span><p className="font-semibold">{profile.primary_offense}</p></div>
                                <div><span className="text-gray-500">County / Officer</span><p className="font-semibold">{profile.county} · {profile.assigned_officer}</p></div>
                                <div><span className="text-gray-500">Intake</span><p className="font-semibold">{profile.intake_date}</p></div>
                                <div><span className="text-gray-500">Placement</span><p className="font-semibold">{profile.placement_type}</p></div>
                                <div><span className="text-gray-500">Flags</span><p className="font-semibold">
                                    {[profile.mental_health_flag && 'Mental health', profile.substance_abuse_flag && 'Substance use'].filter(Boolean).join(', ') || 'None'}
                                </p></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <section className="rounded-2xl border border-gray-200 p-5">
                                <h2 className="text-lg font-bold mb-4" style={{ color: primaryColor }}>Recent assessments</h2>
                                <ul className="space-y-3 text-sm">
                                    {assessments.map((row) => (
                                        <li key={row.assessment_id || `${row.assessment_date}-${row.assessment_type}`} className="border-b border-gray-100 pb-3">
                                            <p className="font-semibold">{row.assessment_type} — {row.risk_level} ({Number(row.overall_risk_score).toFixed(1)})</p>
                                            <p className="text-gray-600">{row.assessment_date} · {row.recommended_supervision} supervision</p>
                                        </li>
                                    ))}
                                    {assessments.length === 0 && <li className="text-gray-500">No assessments on file</li>}
                                </ul>
                            </section>

                            <section className="rounded-2xl border border-gray-200 p-5">
                                <h2 className="text-lg font-bold mb-4" style={{ color: primaryColor }}>Recent case notes</h2>
                                <ul className="space-y-3 text-sm">
                                    {notes.map((row) => (
                                        <li key={row.note_id} className="border-b border-gray-100 pb-3">
                                            <p className="font-semibold">{row.note_type}: {row.subject}</p>
                                            <p className="text-gray-600">{row.note_date} · {row.sentiment} · {row.author}</p>
                                        </li>
                                    ))}
                                    {notes.length === 0 && <li className="text-gray-500">No case notes on file</li>}
                                </ul>
                            </section>
                        </div>

                        {outcome && (
                            <section className="rounded-2xl border border-gray-200 p-5">
                                <h2 className="text-lg font-bold mb-4" style={{ color: primaryColor }}>Latest discharge outcome</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div><span className="text-gray-500">Discharge</span><p className="font-semibold">{outcome.discharge_date} — {outcome.discharge_reason}</p></div>
                                    <div><span className="text-gray-500">Recidivism (12 mo)</span><p className="font-semibold">{outcome.recidivism_12mo ? 'Yes' : 'No'}</p></div>
                                    <div><span className="text-gray-500">Program completed</span><p className="font-semibold">{outcome.program_completed ? 'Yes' : 'No'}</p></div>
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </main>

            <ChatWidget floating agentId={agentId} />
        </div>
    );
}
