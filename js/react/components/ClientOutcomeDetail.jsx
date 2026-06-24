/**
 * ClientOutcomeDetail — Clinical client profile and relapse outcome history.
 */

import { useContext, useEffect, useState } from 'react';
import { TemplateContext } from '../context/TemplateContext.jsx';
import { getClinicalClientDetail } from '../../modules/utils/esqlQueries.js';
import ChatWidget from './ChatWidget.jsx';

function formatTimestamp(ts) {
    if (ts == null) return '—';
    const date = new Date(ts);
    return Number.isNaN(date.getTime()) ? String(ts) : date.toLocaleString();
}

export default function ClientOutcomeDetail({ clientId, onBack, onLogout }) {
    const template = useContext(TemplateContext);
    const primaryColor = template?.colors?.primary || '#003366';
    const agentId = template?.elastic?.fraudAgentId || 'ok-fraud';

    const [profile, setProfile] = useState(null);
    const [outcomes, setOutcomes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!clientId) {
            setLoading(false);
            return undefined;
        }
        let cancelled = false;
        setLoading(true);
        setError(null);
        getClinicalClientDetail(clientId, agentId)
            .then(({ profile: p, outcomes: o }) => {
                if (!cancelled) {
                    setProfile(p);
                    setOutcomes(o);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err?.message || 'Failed to load');
                    setLoading(false);
                }
            });
        return () => { cancelled = true; };
    }, [clientId, agentId]);

    return (
        <div className="w-full min-h-screen bg-white">
            <header className="bg-[#1a2332] text-white py-2">
                <div className="max-w-7xl mx-auto px-4 flex justify-end gap-4">
                    <span className="text-sm">Clinical Client Detail</span>
                    {onLogout && (
                        <button type="button" onClick={onLogout} className="text-sm hover:opacity-80">Logout</button>
                    )}
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <button type="button" onClick={onBack} className="mb-6 text-sm font-medium text-gray-700 hover:opacity-80">
                    ← Back to portal
                </button>

                <h1 className="text-3xl font-bold mb-2" style={{ color: primaryColor }}>
                    {profile?.Name || clientId || 'Client'}
                </h1>
                <p className="text-gray-600 mb-8">Client ID: {clientId}</p>

                {loading && <p className="text-gray-500">Loading…</p>}
                {error && <p className="text-red-600">{error}</p>}

                {profile && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {[
                            ['County', profile.county],
                            ['Primary substance', profile.primary_substance],
                            ['Status', profile.status],
                            ['Age', profile.age],
                            ['Employment', profile.employment],
                            ['Referral source', profile.referral_source],
                            ['Housing at admission', profile.housing_status_at_admission],
                            ['Preferred language', profile.preferred_language],
                        ].map(([label, value]) => (
                            <div key={label} className="border border-gray-200 rounded-2xl p-4">
                                <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
                                <p className="text-gray-900 font-medium mt-1">{value ?? '—'}</p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b bg-gray-50">
                        <h2 className="text-lg font-bold text-gray-900">Outcome history</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b">
                                    <th className="px-6 py-3 font-semibold">Timestamp</th>
                                    <th className="px-6 py-3 font-semibold">County</th>
                                    <th className="px-6 py-3 font-semibold">Relapse</th>
                                    <th className="px-6 py-3 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {outcomes.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">{loading ? 'Loading…' : 'No outcome records'}</td></tr>
                                ) : (
                                    outcomes.map((row, i) => (
                                        <tr key={i} className="border-b border-gray-100">
                                            <td className="px-6 py-4">{formatTimestamp(row['@timestamp'])}</td>
                                            <td className="px-6 py-4">{row.County_Of_Relapse ?? '—'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${row.Relapse_Occurred ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                    {row.Relapse_Occurred ? 'Yes' : 'No'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">{row.status ?? '—'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <ChatWidget floating agentId={agentId} />
        </div>
    );
}
