/**
 * Derives advancement observations from a booster donor profile row.
 * @param {Object} donor - athletic-boosters document row
 * @returns {Array<{ level: 'critical'|'warning'|'positive'|'info', title: string, detail: string }>}
 */
export function buildDonorObservations(donor) {
    if (!donor) return [];

    const observations = [];
    const affinity = Number(donor.affinity_score);
    const lifetime = Number(donor['giving_history.lifetime_total'] ?? donor.giving_history?.lifetime_total ?? 0);
    const emailOpen = Number(donor['engagement.email_open_rate_90d'] ?? donor.engagement?.email_open_rate_90d);
    const gameAttendance = Number(donor['engagement.game_attendance_count'] ?? donor.engagement?.game_attendance_count ?? 0);
    const eventsYtd = Number(donor['engagement.events_attended_ytd'] ?? donor.engagement?.events_attended_ytd ?? 0);
    const iwave = Number(donor['wealth_signals.iwave_score'] ?? donor.wealth_signals?.iwave_score);
    const capacity = donor['wealth_signals.estimated_capacity'] ?? donor.wealth_signals?.estimated_capacity;
    const portfolio = donor.portfolio_status;
    const lastGift = donor['giving_history.last_gift_date'] ?? donor.giving_history?.last_gift_date;

    if (!Number.isNaN(affinity) && affinity < 40) {
        observations.push({
            level: 'critical',
            title: 'At-risk affinity',
            detail: `Affinity score is ${affinity.toFixed(1)} — prioritize personal outreach within 7 days.`,
        });
    } else if (!Number.isNaN(affinity) && affinity < 55) {
        observations.push({
            level: 'warning',
            title: 'Declining engagement signal',
            detail: `Affinity at ${affinity.toFixed(1)} — consider a stewardship touchpoint or event invite.`,
        });
    }

    if (!Number.isNaN(emailOpen) && emailOpen < 0.15) {
        observations.push({
            level: 'critical',
            title: 'Low email engagement',
            detail: `90-day open rate is ${Math.round(emailOpen * 100)}% — test a phone call or personalized note.`,
        });
    } else if (!Number.isNaN(emailOpen) && emailOpen >= 0.5) {
        observations.push({
            level: 'positive',
            title: 'Strong digital engagement',
            detail: `Email open rate ${Math.round(emailOpen * 100)}% — good channel for cultivation content.`,
        });
    }

    if (lifetime >= 50000 && !Number.isNaN(affinity) && affinity < 45) {
        observations.push({
            level: 'critical',
            title: 'Major gift at risk',
            detail: `${formatCurrency(lifetime)} lifetime giving with weakening engagement — escalate to major gifts officer.`,
        });
    }

    if (lifetime >= 100000) {
        observations.push({
            level: 'info',
            title: 'Major gift prospect',
            detail: `Lifetime giving of ${formatCurrency(lifetime)} qualifies for principal gift portfolio review.`,
        });
    }

    if (lifetime === 0) {
        observations.push({
            level: 'warning',
            title: 'No recorded gifts',
            detail: 'LYBUNT/SYBUNT candidate — evaluate first-time or reactivation solicitation strategy.',
        });
    }

    if (gameAttendance >= 10) {
        observations.push({
            level: 'positive',
            title: 'Game-day champion',
            detail: `${gameAttendance} games attended — leverage athletics passion in cultivation messaging.`,
        });
    }

    if (eventsYtd >= 2) {
        observations.push({
            level: 'positive',
            title: 'Active event participant',
            detail: `${eventsYtd} events attended YTD — strong candidate for leadership council invite.`,
        });
    }

    if (!Number.isNaN(iwave) && iwave >= 70) {
        observations.push({
            level: 'info',
            title: 'High wealth indicators',
            detail: `iWave score ${iwave}${capacity ? ` · estimated capacity ${capacity}` : ''} — consider capacity screening.`,
        });
    }

    if (portfolio === 'unassigned') {
        observations.push({
            level: 'warning',
            title: 'Unassigned portfolio',
            detail: 'No assigned gift officer — assign portfolio manager to improve continuity.',
        });
    }

    if (lastGift) {
        const lastGiftDate = new Date(lastGift);
        if (!Number.isNaN(lastGiftDate.getTime())) {
            const monthsAgo = Math.floor((Date.now() - lastGiftDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
            if (monthsAgo >= 18 && lifetime >= 10000) {
                observations.push({
                    level: 'warning',
                    title: 'Lapsed giving pattern',
                    detail: `Last gift was ${monthsAgo} months ago — renewal conversation recommended.`,
                });
            }
        }
    }

    if (observations.length === 0) {
        observations.push({
            level: 'info',
            title: 'Stable donor profile',
            detail: 'No immediate risk flags — maintain regular stewardship cadence.',
        });
    }

    return observations;
}

/**
 * @param {number|null|undefined} value
 * @returns {string}
 */
export function formatCurrency(value) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value));
}

/**
 * @param {number|null|undefined} value
 * @returns {string}
 */
export function formatPercent(value) {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return `${Math.round(Number(value) * 100)}%`;
}

/**
 * @param {*} value
 * @returns {string}
 */
export function formatDate(value) {
    if (value == null) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
}

/**
 * @param {Object} row
 * @param {...string} keys
 * @returns {*}
 */
export function getDonorField(row, ...keys) {
    if (!row) return null;
    for (const k of keys) {
        const v = row[k];
        if (v != null && v !== '') return v;
    }
    return null;
}

/**
 * Sanitize phone for tel: links.
 * @param {string} phone
 * @returns {string}
 */
export function phoneToTel(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    return digits ? `tel:+1${digits.length === 10 ? digits : digits}` : '';
}
