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
    idLabel: 'Email or username',
    idPlaceholder: 'Enter email or username',
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
    idLabel: 'Email or username',
    idPlaceholder: 'Enter email or username',
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

const SCHOOL_LOGIN_DEFAULTS = {
    welcomeTitle: 'Welcome back',
    signInButton: 'Sign in',
    emailDivider: 'Or sign in with email',
    ssoButtonLabel: 'Continue with campus SSO',
    features: [
        'Access scholarship search and financial aid tools',
        'Track application status and deadlines',
        'Connect with counselors and academic advisors',
        'Explore programs and eligibility requirements',
    ],
};

const AGENCY_LOGIN_DEFAULTS = {
    welcomeTitle: 'Welcome back',
    signInButton: 'Sign in',
    emailDivider: 'Or sign in with email',
    ssoButtonLabel: 'SSO through employer',
    features: [
        'Search state grant opportunities and programs',
        'Track deadlines and application status',
        'Access compliance and reporting resources',
        'Connect with program staff and authorized users',
    ],
};

/**
 * Login panel copy and feature list for the sign-in modal.
 * Template `login` overrides merge on top of schema defaults.
 * @param {Object} template
 * @returns {Object}
 */
export function getLoginConfig(template) {
    const labels = getSchemaLabels(template);
    const base = labels.schema === 'agency' ? AGENCY_LOGIN_DEFAULTS : SCHOOL_LOGIN_DEFAULTS;
    const overrides = template?.login || {};
    const headline =
        overrides.headline
        || template?.content?.heroTitle
        || template?.branding?.tagline
        || 'Your portal for programs and services';
    return {
        ...base,
        ...overrides,
        headline,
        features: overrides.features || base.features,
    };
}

export { SCHOOL_LABELS, AGENCY_LABELS };
