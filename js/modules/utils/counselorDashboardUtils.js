/**
 * Counselor dashboard display helpers (ported from Scholarship-Demo2026 dashboard.js).
 */

export function riskBadgeClass(riskLabel) {
    const label = String(riskLabel || '').toLowerCase();
    if (label === 'critical') return 'bg-red-100 text-red-800';
    if (label === 'at-risk') return 'bg-yellow-100 text-yellow-800';
    if (label === 'active') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
}

export function deriveLastLmsLogin(student) {
    const lmsScore = Number(student.lms_activity_score ?? 0);
    if (lmsScore < 30) return { text: '21 days ago', highlight: true };
    if (lmsScore < 50) return { text: '14 days ago', highlight: true };
    if (lmsScore < 70) return { text: '5 days ago', highlight: false };
    if (lmsScore < 90) return { text: '3 days ago', highlight: false };
    return { text: 'Today', highlight: false };
}

export function deriveAcademicAlert(student) {
    const gpa = Number(student.cumulative_gpa ?? student.gpa ?? 0);
    const lmsScore = Number(student.lms_activity_score ?? 0);
    if (gpa < 2.0) return 'Midterm Melt: Bio 101 (F)';
    if (gpa < 2.5) return 'Gateway Fail: Math 110 (D)';
    if (lmsScore < 30) return 'Ghosting: No replies';
    if (lmsScore < 50) return 'Submission Gaps: Eng 102';
    return 'On Track';
}

export function deriveFinancialStatus(student) {
    const bursarHolds = student.bursar_holds;
    const fafsaFiled = student.fafsa_filed !== false;
    const unmetNeed = Number(student.unmet_financial_need ?? 0);

    if (bursarHolds === true || bursarHolds === 'true') return 'Bursar Hold';
    if (typeof bursarHolds === 'number' && bursarHolds > 0) {
        return `Bursar Hold: $${bursarHolds.toLocaleString()}`;
    }
    if (!fafsaFiled) return 'FAFSA Not Filed';
    if (unmetNeed > 0) return 'Work-Study Change';
    return 'Clear';
}

export function sortHighPriorityStudents(students) {
    return [...students].sort((a, b) => {
        const riskA = String(a.risk_label || '').toLowerCase();
        const riskB = String(b.risk_label || '').toLowerCase();
        if (riskA === 'critical' && riskB !== 'critical') return -1;
        if (riskA !== 'critical' && riskB === 'critical') return 1;
        return Number(b.risk_score_normalized ?? 0) - Number(a.risk_score_normalized ?? 0);
    });
}

export const UNCLAIMED_SCHOLARSHIPS = [
    { name: 'STEM Excellence Scholarship', amount: '$5,000', daysUntilExpiry: 3, initials: 'SE' },
    { name: 'Academic Merit Award', amount: '$4,500', daysUntilExpiry: 5, initials: 'AM' },
    { name: 'First Generation Grant', amount: '$3,000', daysUntilExpiry: 2, initials: 'FG' },
    { name: 'Leadership Excellence Scholarship', amount: '$2,500', daysUntilExpiry: 7, initials: 'LE' },
    { name: 'Community Service Award', amount: '$1,500', daysUntilExpiry: 4, initials: 'CS' },
];

export const APPROACHING_DEADLINES = [
    'STEM Future Schol. - Due in 2 days',
    'STEM Future Schol. - Due in 3 days',
    'Academic Excellence - Due in 4 days',
];

export const APPOINTMENT_CALENDAR = [
    { time: '9:00 AM', name: 'David Luna' },
    { time: '10:30 AM', name: 'Bobby Suber' },
    { time: '2:00 PM', name: 'Christopher Phillips' },
];

export const CHAT_HISTORY_DATABASE = {
    'David Luna': {
        timestamp: '12/29/2025, 2:43:47 PM',
        question: 'tell me about the Robert "Pete" Pullen Jr. Scholarship in Analytical Chemistry',
        response: 'The Robert "Pete" Pullen Jr. Scholarship in Analytical Chemistry supports graduate students in analytical chemistry. For David as an undergraduate Computer Science major, your six matched scholarships totaling $19,000 are more relevant today.',
    },
    'Bobby Suber': {
        timestamp: '12/29/2025, 3:23:11 PM',
        question: 'What do you know about me',
        response: 'You are a Music major with a 3.7 GPA, Georgia residency, and $0 EFC. You have been matched with $19,000 in aid. Verify STEM scholarship eligibility since your major is Music.',
    },
    'Christopher Phillips': {
        timestamp: '12/30/2025, 8:00:03 AM',
        question: 'I want to change majors',
        response: 'Changing majors can affect major-specific awards like the STEM Excellence Scholarship. Meet with your advisor and financial aid before switching to understand SAP and scholarship impacts.',
    },
};
