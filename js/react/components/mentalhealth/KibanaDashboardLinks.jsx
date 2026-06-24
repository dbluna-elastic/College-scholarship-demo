/**
 * Kibana dashboard link buttons grouped by domain.
 */

import { getGroupedDashboards, kibanaDashboardHref } from './mentalhealthUi.js';

function DashboardGroup({ title, dashboards, template, primaryColor }) {
    if (!dashboards?.length) return null;
    return (
        <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
            <div className="flex flex-wrap gap-2">
                {dashboards.map((dash) => (
                    <a
                        key={dash.id}
                        href={kibanaDashboardHref(template, dash.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: primaryColor }}
                    >
                        {dash.title}
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                ))}
            </div>
        </div>
    );
}

export default function KibanaDashboardLinks({ template, primaryColor, groups }) {
    const grouped = getGroupedDashboards(template);
    const labels = {
        fraud: 'Fraud & Compliance',
        crisis: 'Crisis Services',
        clinical: 'Clinical Outcomes',
        grants: 'Grants & Performance',
        other: 'Additional Dashboards',
    };

    const keys = groups || Object.keys(grouped);

    return (
        <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Kibana Dashboards</h3>
            <p className="text-gray-600 text-sm mb-4">
                Open Oklahoma analytics dashboards in Kibana for detailed exploration and time-range analysis.
            </p>
            {keys.map((key) => (
                <DashboardGroup
                    key={key}
                    title={labels[key] || key}
                    dashboards={grouped[key]}
                    template={template}
                    primaryColor={primaryColor}
                />
            ))}
        </div>
    );
}
