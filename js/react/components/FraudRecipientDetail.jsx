/**
 * FraudRecipientDetail - Detail page for a single Medicaid recipient (fraud case-worker view).
 * Shows all records from ok-fraud-* for the given Medicaid_Recipient_ID.
 */

import { useContext, useState, useEffect } from 'react';
import { TemplateContext } from '../context/TemplateContext.jsx';
import { getSchemaLabels } from '../../config/schemaConfig.js';
import { getFraudRecipientDetail } from '../../modules/utils/esqlQueries.js';
import ChatWidget from './ChatWidget.jsx';

function getField(row, ...keys) {
    for (const k of keys) {
        const v = row[k];
        if (v != null && v !== '') return v;
    }
    return null;
}

function formatTimestamp(ts) {
    if (ts == null) return '—';
    const date = typeof ts === 'number' ? new Date(ts) : new Date(ts);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString();
}

function FraudRecipientDetail({ medicaidRecipientId, onBack, onLogout }) {
    const template = useContext(TemplateContext);
    const schemaLabels = getSchemaLabels(template);
    const primaryColor = template?.colors?.primary || '#5D5FEF';
    const [detailRows, setDetailRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!medicaidRecipientId) {
            setLoading(false);
            setDetailRows([]);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(null);
        getFraudRecipientDetail(medicaidRecipientId, 'ok-fraud')
            .then((rows) => {
                if (!cancelled) {
                    setDetailRows(rows);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err?.message || 'Failed to load');
                    setDetailRows([]);
                    setLoading(false);
                }
            });
        return () => { cancelled = true; };
    }, [medicaidRecipientId]);

    if (!template) {
        return (
            <div className="text-center p-8">
                <p className="text-gray-600">Loading template...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-white">
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

            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={onBack}
                                className="flex items-center gap-2 text-gray-700 hover:opacity-80 transition-opacity font-medium"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back to dashboard
                            </button>
                        </div>
                        <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
                            <span className="text-sm text-gray-600">Recipient detail</span>
                        </div>
                    </div>
                </div>
            </nav>

            <section className="py-8 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <h2
                        className="text-2xl md:text-3xl font-bold mb-2"
                        style={{ fontFamily: 'var(--font-family)', color: primaryColor }}
                    >
                        Recipient detail: {medicaidRecipientId ?? '—'}
                    </h2>

                    {loading ? (
                        <p className="text-gray-500 py-8">Loading…</p>
                    ) : error ? (
                        <div className="py-8">
                            <p className="text-red-600 mb-4">{error}</p>
                            <button
                                type="button"
                                onClick={onBack}
                                className="px-4 py-2 rounded-full text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-100"
                            >
                                Back to dashboard
                            </button>
                        </div>
                    ) : detailRows.length === 0 ? (
                        <div className="py-8">
                            <p className="text-gray-500 mb-4">No records found for this recipient.</p>
                            <button
                                type="button"
                                onClick={onBack}
                                className="px-4 py-2 rounded-full text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-100"
                            >
                                Back to dashboard
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto overflow-y-auto max-h-[32rem]">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 font-semibold text-gray-900">@timestamp</th>
                                            <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 font-semibold text-gray-900">Claim_ID</th>
                                            <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 font-semibold text-gray-900">Flag_Type</th>
                                            <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 font-semibold text-gray-900">Total_Loss_Value</th>
                                            <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 font-semibold text-gray-900">Amount_Submitted</th>
                                            <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 font-semibold text-gray-900">Investigator_Assigned</th>
                                            <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 font-semibold text-gray-900">Agency_Type</th>
                                            <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 font-semibold text-gray-900">Priority</th>
                                            <th className="sticky top-0 z-10 bg-gray-50 px-6 py-3 font-semibold text-gray-900">Risk_Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detailRows.map((row, i) => (
                                            <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="px-6 py-4 text-gray-600">{formatTimestamp(getField(row, '@timestamp', 'timestamp'))}</td>
                                                <td className="px-6 py-4 text-gray-900">{getField(row, 'Claim_ID', 'claim_id', 'ClaimId', 'claimid', 'Claim_Number', 'claim_number') ?? '—'}</td>
                                                <td className="px-6 py-4 text-gray-700">{getField(row, 'Flag_Type', 'flag_type') ?? '—'}</td>
                                                <td className="px-6 py-4 text-gray-700">{getField(row, 'Total_Loss_Value', 'total_loss_value') != null ? Number(getField(row, 'Total_Loss_Value', 'total_loss_value'))?.toLocaleString() : '—'}</td>
                                                <td className="px-6 py-4 text-gray-700">{getField(row, 'Amount_Submitted', 'amount_submitted') != null ? Number(getField(row, 'Amount_Submitted', 'amount_submitted'))?.toLocaleString() : '—'}</td>
                                                <td className="px-6 py-4 text-gray-700">{getField(row, 'Investigator_Assigned', 'investigator_assigned') ?? '—'}</td>
                                                <td className="px-6 py-4 text-gray-600">{getField(row, 'Agency_Type', 'agency_type') ?? '—'}</td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                            getField(row, 'Priority', 'priority') === 'Critical'
                                                                ? 'bg-red-100 text-red-800'
                                                                : getField(row, 'Priority', 'priority') === 'High'
                                                                ? 'bg-amber-100 text-amber-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}
                                                    >
                                                        {getField(row, 'Priority', 'priority') ?? '—'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-700">{getField(row, 'Risk_Score', 'risk_score') ?? '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <ChatWidget floating={true} agentId="ok-fraud" />
        </div>
    );
}

export default FraudRecipientDetail;
