/**
 * Schema configuration for template types: School vs Agency
 * Abstracts terminology so the same app can render School (Student/Teacher/GPA) or Agency (Citizen/Case Worker/Status) demos.
 */

/** @typedef {'school' | 'agency'} SchemaType */

/**
 * Default labels for School schema (educational institutions)
 */
const SCHOOL_LABELS = {
    schema: 'school',
    primaryRole: 'student',
    staffRole: 'counselor',
    idLabel: 'CampusID',
    idPlaceholder: 'Enter your CampusID',
    dashboardPrimary: 'Student Dashboard',
    dashboardStaff: 'Counselor Dashboard',
    profileTitle: 'Student Information',
    profileNotFound: 'Student Profile Not Found',
    welcomeNameFallback: 'Student',
    disclaimer: 'By logging into this system, you agree to comply with university policies.',
    ssoTitle: 'Duo for CampusID Single Sign-On',
    secureSessionNote: 'University services that use SSO login will always direct you to a',
    statusLabel: 'GPA',
    statusPlaceholder: 'e.g., GPA, major, residency',
    incomeLabel: 'Student Income ($)',
};

/**
 * Default labels for Agency schema (state agency / government)
 */
const AGENCY_LABELS = {
    schema: 'agency',
    primaryRole: 'citizen',
    staffRole: 'caseworker',
    idLabel: 'Case ID',
    idPlaceholder: 'Enter your Case ID or User ID',
    dashboardPrimary: 'Citizen Dashboard',
    dashboardStaff: 'Case Worker Dashboard',
    profileTitle: 'Case Information',
    profileNotFound: 'Case Profile Not Found',
    welcomeNameFallback: 'Citizen',
    disclaimer: 'By logging in, you agree to comply with agency policies and applicable state law.',
    ssoTitle: 'Agency Single Sign-On',
    secureSessionNote: 'Agency services that use SSO will always direct you to an official agency address.',
    statusLabel: 'Status',
    statusPlaceholder: 'e.g., case status, program, location',
    incomeLabel: 'Household Income ($)',
};

/**
 * Get schema labels for a template
 * @param {Object} template - Template object (may have template.schema and optional template.schemaLabels overrides)
 * @returns {Object} Labels object for the template's schema type
 */
export function getSchemaLabels(template) {
    if (!template) return SCHOOL_LABELS;
    const type = template.schema || 'school';
    const base = type === 'agency' ? AGENCY_LABELS : SCHOOL_LABELS;
    const overrides = template.schemaLabels || {};
    return { ...base, ...overrides };
}

/**
 * Check if the current template uses the Agency schema
 * @param {Object} template - Template object
 * @returns {boolean}
 */
export function isAgencySchema(template) {
    return template?.schema === 'agency';
}

export { SCHOOL_LABELS, AGENCY_LABELS };
