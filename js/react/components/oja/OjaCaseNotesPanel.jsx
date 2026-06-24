/**
 * OjaCaseNotesPanel — recent follow-up and concerning case notes.
 */

import { useContext, useEffect, useState } from 'react';
import { TemplateContext } from '../../context/TemplateContext.jsx';
import { getOjaRecentCaseNotes } from '../../../modules/utils/ojaEsqlQueries.js';
import { OJA_CARD_CLASS, getOjaDashboards, kibanaDashboardHref } from './ojaUi.js';

export default function OjaCaseNotesPanel({ onYouthClick }) {
    const template = useContext(TemplateContext);
    const primaryColor = template?.colors?.primary || '#1B3A5C';

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        getOjaRecentCaseNotes(12)
            .then((notes) => {
                if (!cancelled) {
                    setRows(notes);
                    setLoading(false);
                }
            })
            .catch(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const dashboards = getOjaDashboards(template).notes || [];

    return (
        <div className="space-y-6">
            {dashboards.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {dashboards.map((dash) => (
                        <a
                            key={dash.id}
                            href={kibanaDashboardHref(template, dash.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: primaryColor }}
                        >
                            {dash.title}
                        </a>
                    ))}
                </div>
            )}

            <div className={OJA_CARD_CLASS}>
                <div className="p-5 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Notes requiring follow-up</h3>
                    <p className="text-sm text-gray-600">Follow-up flagged or negative/concerning sentiment</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-gray-600">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Youth</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Subject</th>
                                <th className="px-4 py-3">Sentiment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.note_id} className="border-t border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-3">{row.note_date}</td>
                                    <td className="px-4 py-3">
                                        <button
                                            type="button"
                                            className="font-semibold hover:underline"
                                            style={{ color: primaryColor }}
                                            onClick={() => onYouthClick?.(row.youth_id)}
                                        >
                                            {row.youth_id}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3">{row.note_type}</td>
                                    <td className="px-4 py-3">{row.subject}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                            row.sentiment === 'Negative' || row.sentiment === 'Concerning'
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {row.sentiment}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {!loading && rows.length === 0 && (
                                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No case notes found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
