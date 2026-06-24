/**
 * Student dashboard helpers (ported from Scholarship-Demo2026 dashboard.js).
 */

export function formatStudentDisplayName(student, fallback = 'Student') {
    if (!student) return fallback;
    if (student.full_name) return student.full_name;
    const first = student.first_name || student.firstName || '';
    const last = student.last_name || student.lastName || '';
    const combined = `${first} ${last}`.trim();
    return combined || fallback;
}

export function buildStudentProfileForForms(student, loginId = '') {
    const fullName = formatStudentDisplayName(student, loginId || 'Student');
    const parts = fullName.split(/\s+/);
    const firstName = student?.first_name || student?.firstName || parts[0] || fullName;
    const lastName = student?.last_name || student?.lastName || parts.slice(1).join(' ');
    const idPart = String(loginId || fullName).replace(/\s+/g, '').toLowerCase();
    return {
        firstName,
        lastName,
        email: student?.email || `${idPart}@student.edu`,
        major: student?.major || student?.field_of_study || 'General Studies',
        fullName,
    };
}

/**
 * Net price estimate derived from student financial fields (Demo2026-style scaling).
 */
export function buildNetPriceEstimate(student) {
    const tuitionAndFees = 4152;
    const housingAndFood = 1973;
    const books = 147;
    const transport = 183;
    const personalExpenses = 260;
    const directCostsTotal = tuitionAndFees + housingAndFood;
    const indirectCostsTotal = books + transport + personalExpenses;
    const costOfAttendance = directCostsTotal + indirectCostsTotal;

    const sai = Number(student?.sai_value ?? student?.sai ?? 0);
    const unmet = Number(student?.unmet_financial_need ?? 0);
    const pellGrant = sai <= 0 ? 933 : Math.min(933, Math.max(0, 6000 - sai));
    const scholarshipAid = unmet > 0 ? Math.min(unmet, 2800) : 0;
    const totalAid = pellGrant + scholarshipAid;
    const estimatedNetPrice = Math.max(0, costOfAttendance - totalAid);

    return {
        estimatedNetPrice,
        directCosts: {
            total: directCostsTotal,
            tuition: tuitionAndFees,
            housing: housingAndFood,
        },
        indirectCosts: {
            total: indirectCostsTotal,
            books,
            transportation: transport,
            personal: personalExpenses,
        },
        costOfAttendance,
        needBasedAid: {
            total: pellGrant,
            pellGrant,
        },
        grantsAndScholarships: totalAid,
    };
}

export function scholarshipCardId(scholarship, index) {
    return scholarship?.id || `scholarship-${index}`;
}
