/**
 * GrantsProgramsPanel — Grant portfolio stats and Kibana performance dashboard links.
 */

import { useContext, useEffect, useState } from 'react';
import { TemplateContext } from '../../context/TemplateContext.jsx';
import { getOkGrantPortfolioStats } from '../../../modules/utils/esqlQueries.js';
import KibanaDashboardLinks from './KibanaDashboardLinks.jsx';
import { MH_CARD_CLASS } from './mentalhealthUi.js';

export default function GrantsProgramsPanel({ onOpenGrantsSearch }) {
    const template = useContext(TemplateContext);
    const primaryColor = template?.colors?.primary || '#003366';
    const gs = template?.content?.grantsSearch || {};

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        getOkGrantPortfolioStats(template)
            .then((data) => { if (!cancelled) { setStats(data); setLoading(false); } })
            .catch(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [template]);

    const catalog = template?.grantsCatalog || [];
    const fallbackActive = catalog.filter((g) => g.status === 'active').length;

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total programs', value: stats?.total ?? catalog.length },
                    { label: 'Active', value: stats?.active ?? fallbackActive },
                    { label: 'Forecasted', value: stats?.forecasted ?? catalog.filter((g) => g.status === 'forecasted').length },
                    { label: 'Closed', value: stats?.closed ?? catalog.filter((g) => g.status === 'closed').length },
                ].map((kpi) => (
                    <div key={kpi.label} className={`${MH_CARD_CLASS} p-5`}>
                        <h4 className="text-sm font-medium text-gray-600 mb-2">{kpi.label}</h4>
                        <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                            {loading ? '…' : Number(kpi.value ?? 0).toLocaleString()}
                        </p>
                    </div>
                ))}
            </div>

            <div className={`${MH_CARD_CLASS} p-6 mb-8`}>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Public grant search</h3>
                <p className="text-gray-600 text-sm mb-4">
                    {gs.intro || 'Search behavioral health and crisis funding opportunities indexed from ok-grant-data.'}
                </p>
                {typeof onOpenGrantsSearch === 'function' && (
                    <button
                        type="button"
                        onClick={onOpenGrantsSearch}
                        className="px-5 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-90"
                        style={{ backgroundColor: primaryColor }}
                    >
                        Open grant search
                    </button>
                )}
            </div>

            <div className={`${MH_CARD_CLASS} p-6 mb-8`}>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Sample health & crisis programs</h3>
                <ul className="space-y-3">
                    {catalog.slice(0, 5).map((grant) => (
                        <li key={grant.id} className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm border-b border-gray-100 pb-3">
                            <span className="font-medium text-gray-900">{grant.title}</span>
                            <span className="text-gray-500 capitalize">{grant.status} · {grant.category}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <KibanaDashboardLinks template={template} primaryColor={primaryColor} groups={['grants']} />
        </>
    );
}
