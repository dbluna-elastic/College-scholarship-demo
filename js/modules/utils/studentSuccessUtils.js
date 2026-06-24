/**
 * Student Success Dashboard display logic (ported from Scholarship-Demo2026 dashboard.js).
 */

const GAUGE_CIRCUMFERENCE = 2 * Math.PI * 56;
const GPA_CIRCUMFERENCE = 2 * Math.PI * 36;
const TOTAL_CREDITS = 150;
const MAX_WORK_STUDY_HOURS = 20;

function parseNum(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function formatDateOfBirth(dob) {
    if (!dob) return '—';
    if (typeof dob === 'string' && dob.includes('-')) {
        const date = new Date(dob);
        if (!Number.isNaN(date.getTime())) {
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        }
    }
    return String(dob);
}

function calcAge(dob) {
    if (!dob) return '—';
    try {
        const birthDate = new Date(dob);
        if (Number.isNaN(birthDate.getTime())) return '—';
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
        return String(age);
    } catch {
        return '—';
    }
}

function isTruthy(value) {
    return value === true || value === 'true' || value === 'Yes';
}

function isOnCampus(housingStatus) {
    const s = String(housingStatus || '').toLowerCase();
    return s.includes('on-campus') || s.includes('oncampus') || s.includes('on campus')
        || s === 'on-campus' || s === 'residential' || s === 'dormitory' || s === 'dorm';
}

function gaugeColor(score, ranges) {
    if (ranges.red && score >= ranges.red.min && score <= ranges.red.max) return 'stroke-red-600';
    if (ranges.yellow && score >= ranges.yellow.min && score <= ranges.yellow.max) return 'stroke-yellow-500';
    if (ranges.green && score >= ranges.green.min && score <= ranges.green.max) return 'stroke-green-600';
    return 'stroke-gray-400';
}

function buildGauge(score, max, colorRanges, { decimals } = {}) {
    const clamped = Math.max(0, Math.min(max, score));
    const offset = GAUGE_CIRCUMFERENCE - (clamped / max) * GAUGE_CIRCUMFERENCE;
    const value = decimals != null ? clamped.toFixed(decimals) : String(Math.round(clamped));
    return {
        value,
        offset,
        strokeClass: gaugeColor(clamped, colorRanges),
    };
}

function saiNeedBadge(saiValue) {
    if (saiValue >= -1500 && saiValue <= 0) {
        return { text: 'High Need', className: 'bg-green-100 text-green-800' };
    }
    if (saiValue >= 1 && saiValue <= 20000) {
        return { text: 'Moderate Need', className: 'bg-yellow-100 text-yellow-800' };
    }
    if (saiValue > 20000) {
        return { text: 'Lower Need', className: 'bg-gray-100 text-gray-800' };
    }
    return { text: 'High Need', className: 'bg-green-100 text-green-800' };
}

function formatDollars(value) {
    const n = Math.round(parseNum(value));
    return `$${n.toLocaleString()}`;
}

/**
 * Build display model for Student Success Dashboard from raw ES student document.
 */
export function buildStudentSuccessViewModel(student) {
    if (!student) return null;

    const firstName = student.first_name || student.firstName || '';
    const lastName = student.last_name || student.lastName || '';
    const fullName = student.full_name || `${firstName} ${lastName}`.trim() || 'Unknown Student';
    const classLevel = student.class_level || student.classLevel || '';
    const major = student.major || student.field_of_study || '';
    const programText = classLevel && major ? `${classLevel} | ${major}` : (classLevel || major || '—');

    const dob = student.date_of_birth || student.dateOfBirth || student.dob || '';
    const housingStatus = student.housing_status || student.housingStatus || student.residence_type || student.residenceType;
    const onCampus = isOnCampus(housingStatus);

    const militaryStatus = student.military_status || student.militaryStatus || student.is_military || student.isMilitary;
    const showMilitary = isTruthy(militaryStatus)
        || String(militaryStatus || '').toLowerCase() === 'active'
        || String(militaryStatus || '').toLowerCase() === 'veteran'
        || String(militaryStatus || '').toLowerCase() === 'reserve';

    const gpa = parseNum(student.cumulative_gpa ?? student.gpa ?? student.cgpa);
    const hoursCompleted = parseNum(student.hours_completed ?? student.hoursCompleted ?? student.credits_completed);
    const creditsPercent = Math.min(100, (hoursCompleted / TOTAL_CREDITS) * 100);
    const creditHoursEnrolled = parseNum(student.credit_hours_enrolled ?? student.creditHoursEnrolled ?? student.current_credits);

    const isMarried = student.marital_status === 'Married' || student.marital_status === 'married'
        || student.is_married === true || student.isMarried === true;

    const studentIncome = parseNum(student.student_annual_income ?? student.studentIncome ?? student.student_income);
    const spouseIncome = parseNum(student.spouse_annual_income ?? student.spouseIncome ?? student.spouse_income);
    const assetValue = parseNum(student.asset_value ?? student.cashAssetValue ?? student.assetValue);
    const unmetNeed = parseNum(student.unmet_financial_need ?? student.unmetFinancialNeed);
    const needMax = isMarried
        ? Math.max(studentIncome, assetValue, unmetNeed, spouseIncome, 1)
        : Math.max(studentIncome, assetValue, unmetNeed, 1);

    const saiValue = parseNum(student.sai_value ?? student.saiValue ?? student.sai);
    const workStudyEligible = student.work_study_eligible ?? student.workStudyEligible;
    const workStudyHours = parseNum(student.work_study_hours ?? student.workStudyHours ?? student.work_study_hours_completed);
    const numDependents = parseNum(student.number_of_dependents ?? student.numDependents ?? student.dependents);
    const spouseEnrolled = student.spouse_enrolled ?? student.spouseEnrolled ?? student.spouse_enrolled_in_college;

    const bursarHolds = student.bursar_holds ?? student.bursarHolds;
    const hasBursarHold = bursarHolds === true || bursarHolds === 'true'
        || (typeof bursarHolds === 'number' && bursarHolds > 0);

    const lmsScore = Math.max(0, Math.min(100, parseNum(student.lms_activity_score ?? student.lmsActivityScore)));
    const emailOpenRate = Math.max(0, Math.min(100, parseNum(student.email_open_rate ?? student.emailOpenRate)));
    const cardSwipes = parseNum(student.card_swipes_last_7_days ?? student.card_swipes_wifi ?? student.cardSwipesWifi ?? student.wifi_logins);

    const wifiMax = onCampus ? 30 : 10;
    const wifiRanges = onCampus
        ? { red: { min: 0, max: 10 }, yellow: { min: 11, max: 20 }, green: { min: 21, max: 30 } }
        : { red: { min: 0, max: 3 }, yellow: { min: 4, max: 6 }, green: { min: 7, max: 10 } };

    const assignmentsOverdue = Math.round(parseNum(student.assignments_overdue ?? student.assignmentsOverdue));
    const withdrawalRequests = Math.round(parseNum(student.course_withdrawal_requests ?? student.courseWithdrawalRequests));
    const advisorMeetings = Math.round(parseNum(student.advisor_meetings ?? student.advisorMeetings ?? student.advisor_meetings_attended));
    const creditRatio = Math.max(0, Math.min(1, parseNum(student.credit_accumulation_ratio ?? student.creditAccumulationRatio)));

    const scoreColorRanges = {
        red: { min: 1, max: 30 },
        yellow: { min: 31, max: 60 },
        green: { min: 61, max: 100 },
    };

    const creditRatioRanges = {
        red: { min: 0.5, max: 0.65 },
        yellow: { min: 0.66, max: 0.8 },
        green: { min: 0.81, max: 1 },
    };

    function metricColor(value, rules) {
        for (const rule of rules) {
            if (value >= rule.min && value <= rule.max) return rule.color;
        }
        return 'text-gray-900';
    }

    return {
        hero: {
            fullName,
            programText,
            dateOfBirth: formatDateOfBirth(dob),
            age: calcAge(dob),
            studentId: student.student_id || student.campus_id || student.campusId || '—',
            phone: student.phone_number || student.phoneNumber || student.phone || '—',
            email: student.email || '—',
            location: student.state_of_residence || student.residencyState || student.state || '—',
            showFirstGen: isTruthy(student.first_generation ?? student.firstGeneration ?? student.is_first_generation),
            housing: housingStatus ? {
                text: onCampus ? 'On-Campus' : 'Off-Campus',
                className: onCampus ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800',
            } : null,
            showMilitary,
            gpa: {
                value: gpa.toFixed(1),
                offset: GPA_CIRCUMFERENCE - (Math.min(gpa, 4) / 4) * GPA_CIRCUMFERENCE,
            },
            credits: {
                percent: creditsPercent,
                text: `${Math.round(hoursCompleted)} / ${TOTAL_CREDITS} Credits Completed`,
                enrolled: creditHoursEnrolled > 0 ? String(Math.round(creditHoursEnrolled)) : '—',
            },
        },
        need: {
            hasBursarHold,
            studentIncome: {
                amount: formatDollars(studentIncome),
                percent: needMax > 0 ? (studentIncome / needMax) * 100 : 0,
            },
            assetValue: {
                amount: formatDollars(assetValue),
                percent: needMax > 0 ? (assetValue / needMax) * 100 : 0,
            },
            unmetNeed: unmetNeed > 0 ? {
                amount: formatDollars(unmetNeed),
                percent: needMax > 0 ? (unmetNeed / needMax) * 100 : 0,
            } : null,
            spouseIncome: isMarried ? {
                amount: formatDollars(spouseIncome),
                percent: needMax > 0 ? (spouseIncome / needMax) * 100 : 0,
            } : null,
            sai: {
                value: Math.round(saiValue).toLocaleString(),
                isNegative: saiValue < 0,
                badge: saiNeedBadge(saiValue),
            },
            workStudy: {
                eligible: isTruthy(workStudyEligible),
                hours: workStudyHours,
                hoursText: workStudyHours > 0 ? `${Math.round(workStudyHours)} Hours` : '0 Hours',
                hoursPercent: Math.min(100, (workStudyHours / MAX_WORK_STUDY_HOURS) * 100),
            },
            dependents: numDependents > 0 ? {
                text: numDependents === 1 ? '1 Dependent' : `${Math.round(numDependents)} Dependents`,
            } : null,
            showSpouseEnrolled: isTruthy(spouseEnrolled) || String(spouseEnrolled || '').toLowerCase() === 'yes',
        },
        risk: {
            lms: buildGauge(lmsScore, 100, scoreColorRanges),
            email: buildGauge(emailOpenRate, 100, scoreColorRanges),
            wifi: {
                ...buildGauge(cardSwipes, wifiMax, wifiRanges),
                scaleLabel: onCampus ? '(0-30 scale)' : '(0-10 scale)',
                maxLabel: onCampus ? '/ 30' : '/ 10',
            },
            assignmentsOverdue: {
                value: assignmentsOverdue.toLocaleString(),
                colorClass: metricColor(assignmentsOverdue, [
                    { min: 0, max: 2, color: 'text-green-600' },
                    { min: 3, max: 4, color: 'text-yellow-600' },
                    { min: 5, max: 999, color: 'text-red-600' },
                ]),
            },
            withdrawalRequests: {
                value: withdrawalRequests.toLocaleString(),
                colorClass: metricColor(withdrawalRequests, [
                    { min: 0, max: 0, color: 'text-green-600' },
                    { min: 1, max: 1, color: 'text-yellow-600' },
                    { min: 2, max: 999, color: 'text-red-600' },
                ]),
            },
            advisorMeetings: {
                value: advisorMeetings.toLocaleString(),
                colorClass: metricColor(advisorMeetings, [
                    { min: 0, max: 0, color: 'text-red-600' },
                    { min: 1, max: 3, color: 'text-yellow-600' },
                    { min: 4, max: 999, color: 'text-green-600' },
                ]),
            },
            creditRatio: buildGauge(creditRatio, 1, creditRatioRanges, { decimals: 2 }),
        },
    };
}
