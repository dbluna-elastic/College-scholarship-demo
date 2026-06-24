/**
 * Build engagement drop timeline series and annotations from booster-engagement-events rows.
 */

const SIGNAL_TYPES = [
    { key: 'email_open', label: 'Email opens', color: '#3b82f6' },
    { key: 'event_attendance', label: 'Event attendance', color: '#22c55e' },
    { key: 'portal_login', label: 'Portal logins', color: '#8b5cf6' },
];

/**
 * @param {*} row
 * @param {...string} keys
 * @returns {*}
 */
function field(row, ...keys) {
    if (!row) return null;
    for (const key of keys) {
        const value = row[key];
        if (value != null && value !== '') return value;
    }
    return null;
}

/**
 * @param {*} value
 * @returns {string|null}
 */
export function toDayKey(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
}

/**
 * @param {Array<Object>} events
 * @param {string} [startDay]
 * @returns {{ days: string[], series: Array<{ key: string, label: string, color: string, values: number[] }>, maxValue: number }}
 */
export function buildEngagementTimelineSeries(events, startDay = '2024-03-01') {
    const daySet = new Set();
    const buckets = new Map();

    (events || []).forEach((event) => {
        const day = toDayKey(field(event, 'event_date'));
        const type = field(event, 'event_type');
        if (!day || !type || day < startDay) return;
        if (!SIGNAL_TYPES.some((s) => s.key === type)) return;

        daySet.add(day);
        const bucketKey = `${day}|${type}`;
        const signal = Number(field(event, 'signal_value') ?? 0);
        buckets.set(bucketKey, (buckets.get(bucketKey) || 0) + (Number.isNaN(signal) ? 0 : signal));
    });

    const days = Array.from(daySet).sort();
    const series = SIGNAL_TYPES.map((signal) => ({
        ...signal,
        values: days.map((day) => buckets.get(`${day}|${signal.key}`) || 0),
    }));

    const maxValue = Math.max(1, ...series.flatMap((s) => s.values));
    return { days, series, maxValue };
}

/**
 * @param {Object|null} donor
 * @param {Object} [timelineConfig]
 * @returns {Array<{ date: string, label: string, tone: 'critical'|'positive'|'warning'|'info' }>}
 */
export function buildTimelineAnnotations(donor, timelineConfig = {}) {
    const annotations = [];
    const inflectionDate = timelineConfig.inflectionDate || '2025-09-01';
    const lastGiftDate = field(donor, 'giving_history.last_gift_date');
    const lastGiftAmount = field(donor, 'giving_history.lifetime_total');

    if (inflectionDate) {
        annotations.push({
            date: inflectionDate.slice(0, 10),
            label: 'Engagement dropped',
            tone: 'critical',
        });
    }

    if (lastGiftDate) {
        const day = toDayKey(lastGiftDate);
        if (day) {
            const amount = lastGiftAmount != null
                ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(lastGiftAmount))
                : null;
            annotations.push({
                date: day,
                label: amount ? `Last gift: ${amount}` : 'Last gift',
                tone: 'positive',
            });
        }
    }

    return annotations.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Named attendance/email events for the annotation table.
 * @param {Array<Object>} events
 * @param {string} [inflectionDate]
 * @returns {Array<Object>}
 */
export function buildEventAnnotationRows(events, inflectionDate = '2025-09-01') {
    return (events || [])
        .filter((event) => {
            const category = field(event, 'event_category');
            const label = field(event, 'event_label');
            return label && (category === 'attendance' || category === 'email');
        })
        .map((event) => {
            const day = toDayKey(field(event, 'event_date'));
            const signal = Number(field(event, 'signal_value') ?? 0);
            const afterInflection = day && inflectionDate && day >= inflectionDate.slice(0, 10);
            const attended = signal > 0;
            return {
                date: day,
                label: field(event, 'event_label'),
                category: field(event, 'event_category'),
                signalValue: signal,
                delta: field(event, 'delta_from_baseline'),
                status: attended ? 'yes' : 'no',
                tone: afterInflection && !attended ? 'critical' : attended ? 'positive' : 'warning',
            };
        })
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

/**
 * @param {string} kibanaUrl
 * @param {string} dashboardId
 * @param {string} donorId
 * @returns {string}
 */
export function buildKibanaTimelineUrl(kibanaUrl, dashboardId, donorId) {
    const base = String(kibanaUrl || '').replace(/\/$/, '');
    if (!base || !dashboardId) return base;
    const params = new URLSearchParams({
        '_a': `(filters:!((query:(match_phrase:(donor_id:'${donorId}')))))`,
        'time': '(from:now-18M,to:now)',
    });
    return `${base}/app/dashboards#/view/${dashboardId}?${params.toString()}`;
}

export { SIGNAL_TYPES };
