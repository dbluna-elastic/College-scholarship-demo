/**
 * OjaAssessmentsPanel — high-risk assessments and recidivism snapshot.
 */

import { useContext, useEffect, useState } from 'react';
import { TemplateContext } from '../../context/TemplateContext.jsx';
import { getOjaHighRiskYouth, getOjaOverviewStats } from '../../../modules/utils/ojaEsqlQueries.js';
import { OJA_CARD_CLASS, getOjaDashboards, kibanaDashboardHref } from './ojaUi.js';

export default function OjaAssessmentsPanel({ onYouthClick }) {
    const template = useContext(TemplateContext);
    const primaryColor = template?.colors?.primary || '#1B3A5C';

    const [rows, setRows] = useState([]);
    const [recidivism, setRecidivism] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        Promise.allSettled([getOjaHighRiskYouth(15), getOjaOverviewStats()])
            .then((results) => {
                if (cancelled) return;
                const [assessmentsResult, statsResult] = results;
                if (assessmentsResult.status === 'fulfilled') setRows(assessmentsResult.value);
                if (statsResult.status === 'fulfilled') setRecidivism(statsResult.value.recidivism12mo);
                setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    const dashboards = getOjaDashboards(template).assessments || [];

    return (
        <div className="space-y-6">
            <div className={`${OJA_CARD_CLASS} p-5 flex flex-wrap items-center justify-between gap-4`}>
                <div>
                    <p className="text-sm text-gray-600">12-month recidivism (discharged youth)</p>
                    <p className="text-3xl font-bold" style={{ color: primaryColor }}>
                        {loading ? '…' : recidivism != null ? `${Math.round(recidivism * 100)}%` : '—'}
                    </p>
                </div>
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

            <div className={OJA_CARD_CLASS}>
                <div className="p-5 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Highest-risk assessments</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-gray-600">
                            <tr>
                                <th className="px-4 py-3">Youth ID</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Risk</th>
                                <th className="px-4 py-3">Score</th>
                                <th className="px-4 py-3">Recommended</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={`${row.youth_id}-${row.assessment_date}`} className="border-t border-gray-100 hover:bg-gray-50">
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
                                    <td className="px-4 py-3">{row.assessment_type}</td>
                                    <td className="px-4 py-3">{row.risk_level}</td>
                                    <td className="px-4 py-3 font-bold">{Number(row.overall_risk_score).toFixed(1)}</td>
                                    <td className="px-4 py-3">{row.recommended_supervision}</td>
                                </tr>
                            ))}
                            {!loading && rows.length === 0 && (
                                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No assessments found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
