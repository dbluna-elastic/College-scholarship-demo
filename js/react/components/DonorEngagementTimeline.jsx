/**
 * DonorEngagementTimeline — Multi-signal engagement drop visualization with annotations.
 */

import {
    buildEngagementTimelineSeries,
    buildTimelineAnnotations,
    buildEventAnnotationRows,
    buildKibanaTimelineUrl,
} from '../../modules/utils/engagementTimelineUtils.js';
import { formatCurrency, getDonorField } from '../../modules/utils/boosterDonorUtils.js';

const CHART_HEIGHT = 220;
const CHART_PADDING = { top: 16, right: 16, bottom: 28, left: 40 };

function DonorEngagementTimeline({
    donor,
    events,
    timelineConfig,
    kibanaUrl,
    dashboardId,
    donorId,
    primaryColor = '#0C2340',
    secondaryColor = '#F15A22',
}) {
    const startDay = timelineConfig?.startDate || '2024-03-01';
    const inflectionDate = timelineConfig?.inflectionDate || '2025-09-01';
    const { days, series, maxValue } = buildEngagementTimelineSeries(events, startDay);
    const annotations = buildTimelineAnnotations(donor, timelineConfig);
    const eventRows = buildEventAnnotationRows(events, inflectionDate);
    const kibanaHref = buildKibanaTimelineUrl(kibanaUrl, dashboardId, donorId);

    if (!days.length) {
        return (
            <div className="bg-white border border-gray-200 rounded-[32px] p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-2">Engagement drop timeline</h2>
                <p className="text-sm text-gray-500">
                    No daily engagement signals found. Run the daily data generator in <code className="text-xs">scripts/booster/</code> to populate timeline fields.
                </p>
            </div>
        );
    }

    const width = 900;
    const innerWidth = width - CHART_PADDING.left - CHART_PADDING.right;
    const innerHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
    const xAt = (index) => CHART_PADDING.left + (index / Math.max(days.length - 1, 1)) * innerWidth;
    const yAt = (value) => CHART_PADDING.top + innerHeight - (value / maxValue) * innerHeight;

    const paths = series.map((signal) => {
        const points = signal.values.map((value, index) => `${xAt(index)},${yAt(value)}`);
        return { ...signal, d: `M ${points.join(' L ')}` };
    });

    const annotationLines = annotations
        .map((annotation) => {
            const index = days.indexOf(annotation.date);
            if (index < 0) return null;
            return { ...annotation, x: xAt(index) };
        })
        .filter(Boolean);

    return (
        <div className="bg-white border border-gray-200 rounded-[32px] p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Engagement drop timeline</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Four signals overlaid — watch lines converge at the inflection point.
                    </p>
                </div>
                {kibanaHref && dashboardId && (
                    <a
                        href={kibanaHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-90"
                        style={{ backgroundColor: secondaryColor }}
                    >
                        Open in Kibana
                        <span aria-hidden>↗</span>
                    </a>
                )}
            </div>

            <div className="flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-wide">
                {series.map((signal) => (
                    <span key={signal.key} className="inline-flex items-center gap-2 text-gray-600">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: signal.color }} />
                        {signal.label}
                    </span>
                ))}
            </div>

            <div className="overflow-x-auto">
                <svg viewBox={`0 0 ${width} ${CHART_HEIGHT}`} className="w-full min-w-[640px] h-auto" role="img" aria-label="Donor engagement timeline chart">
                    {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                        const y = CHART_PADDING.top + innerHeight * (1 - tick);
                        return (
                            <g key={tick}>
                                <line x1={CHART_PADDING.left} y1={y} x2={width - CHART_PADDING.right} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                                <text x={CHART_PADDING.left - 8} y={y + 4} textAnchor="end" className="fill-gray-400 text-[10px]">
                                    {Math.round(maxValue * tick)}
                                </text>
                            </g>
                        );
                    })}

                    {annotationLines.map((annotation) => (
                        <g key={`${annotation.date}-${annotation.label}`}>
                            <line
                                x1={annotation.x}
                                y1={CHART_PADDING.top}
                                x2={annotation.x}
                                y2={CHART_PADDING.top + innerHeight}
                                stroke={annotation.tone === 'critical' ? '#ef4444' : '#22c55e'}
                                strokeWidth="2"
                                strokeDasharray={annotation.tone === 'critical' ? '0' : '4 4'}
                            />
                            <text x={annotation.x + 4} y={CHART_PADDING.top + 12} className="fill-gray-700 text-[10px] font-semibold">
                                {annotation.label}
                            </text>
                        </g>
                    ))}

                    {paths.map((path) => (
                        <path key={path.key} d={path.d} fill="none" stroke={path.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                    ))}

                    {[0, Math.floor(days.length / 2), days.length - 1].map((index) => (
                        <text
                            key={days[index]}
                            x={xAt(index)}
                            y={CHART_HEIGHT - 6}
                            textAnchor="middle"
                            className="fill-gray-500 text-[10px]"
                        >
                            {days[index]}
                        </text>
                    ))}
                </svg>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <h3 className="text-sm font-bold text-gray-900 mb-3">Signal deviation (recent)</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {(events || [])
                            .filter((e) => getDonorField(e, 'delta_from_baseline') != null && getDonorField(e, 'event_category'))
                            .slice(-12)
                            .reverse()
                            .map((event, index) => {
                                const delta = Number(getDonorField(event, 'delta_from_baseline'));
                                const negative = delta < 0;
                                return (
                                    <div key={index} className="flex items-center justify-between gap-3 text-xs">
                                        <span className="text-gray-600 truncate">{getDonorField(event, 'event_label') || getDonorField(event, 'event_type')}</span>
                                        <span className={`font-bold shrink-0 ${negative ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {delta > 0 ? '+' : ''}{delta.toFixed(2)}
                                        </span>
                                    </div>
                                );
                            })}
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <h3 className="text-sm font-bold text-gray-900 mb-3">Event annotations</h3>
                    <div className="overflow-x-auto max-h-48 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="text-gray-500 border-b border-gray-200">
                                    <th className="py-2 pr-3 font-semibold">Date</th>
                                    <th className="py-2 pr-3 font-semibold">Event</th>
                                    <th className="py-2 font-semibold">Signal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {eventRows.slice(0, 12).map((row, index) => (
                                    <tr key={index} className="border-b border-gray-100">
                                        <td className="py-2 pr-3 text-gray-500">{row.date}</td>
                                        <td className="py-2 pr-3 font-medium text-gray-800">{row.label}</td>
                                        <td className={`py-2 font-semibold ${row.tone === 'critical' ? 'text-red-600' : row.tone === 'positive' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {row.status === 'yes' ? 'Attended / Opened' : 'No-show'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {getDonorField(donor, 'giving_history.lifetime_total') != null && (
                <p className="text-xs text-gray-500 border-t border-gray-100 pt-4">
                    Lifetime giving {formatCurrency(getDonorField(donor, 'giving_history.lifetime_total'))} · Last gift {getDonorField(donor, 'giving_history.last_gift_date')?.slice?.(0, 10) ?? '—'}
                </p>
            )}
        </div>
    );
}

export default DonorEngagementTimeline;
