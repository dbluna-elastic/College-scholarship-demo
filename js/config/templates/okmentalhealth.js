/**
 * Oklahoma Department of Mental Health – State Agency Template
 * Public landing + staff portal (fraud, crisis, clinical outcomes, grants).
 */
export const okmentalhealthTemplate = {
    id: 'okmentalhealth',
    name: 'Oklahoma Department of Mental Health',

    branding: {
        institutionName: 'Oklahoma Department of Mental Health',
        tagline: 'Supporting wellness and recovery across Oklahoma.',
        logo: '/logo-okagency.svg',
    },

    header: {
        overlay: true,
        sticky: true,
        utilityIcons: ['search', 'globe', 'menu'],
        menuLabel: 'MENU',
    },

    content: {
        heroTitle: 'Supporting Wellness and Recovery',
        heroSubtitle: 'Access services, crisis support, and resources for mental health and substance use.',
        ctaText: 'Learn More',
        ctaSecondary: 'Sign Up for Updates',
        stateName: 'Oklahoma',
        stateAbbreviation: 'OK',
        welcomeMessage: 'Welcome to the Oklahoma Department of Mental Health Portal',
        blueBar: {
            newsletterText: 'Sign up for our Newsletter',
            scrollPromptText: 'Scroll to learn more',
            sidebarIcons: ['email', 'document'],
        },
        promoBar: {
            text: '24/7 Crisis Support: Oklahoma Mental Health Helpline — Call or text for immediate help.',
            href: '#crisis',
        },
        mainHeading: 'Care When and Where You Need It',
        mainTagline: 'STATEWIDE SERVICES WITH A LOCAL FOCUS',
        chatBubbleText: 'Can I help you find something?',
        chatAssistantTitle: 'ODMHSAS Assistant',
        chatAssistantSubtitle: 'Ask about crisis services, grants, fraud compliance, or program resources.',
        chatAssistantEmptyBody: 'Ask about behavioral health grants, crisis support, or staff analytics.',
        chatAssistantEmptyTry: 'Try: "What community mental health grants are open?"',
        crisisLanding: {
            sectionTitle: 'Crisis Support — Available 24/7',
            sectionSubtitle: 'Immediate help for Oklahomans in behavioral health crisis.',
            tileCta: 'Learn more',
            tiles: [
                {
                    label: 'Call or Text 988',
                    description: 'Connect with trained crisis counselors anytime, anywhere in Oklahoma.',
                    href: 'tel:988',
                },
                {
                    label: 'Mobile Crisis Teams',
                    description: 'MCOT dispatch for in-person stabilization and referral to care.',
                    href: '#reports',
                },
                {
                    label: 'Find Grants & Programs',
                    description: 'Search open funding for crisis units, SUD treatment, and school-based services.',
                    href: '#programs',
                },
                {
                    label: 'Staff Portal Login',
                    description: 'Authorized staff: access fraud, crisis, clinical, and grants dashboards.',
                    href: '#staff-login',
                },
            ],
        },
        reportsSection: {
            title: 'Data & Reports',
            subtitle: 'Statewide behavioral health performance snapshots. Staff can open full Kibana dashboards after login.',
            kpiLabels: {
                relapseRate: 'Statewide relapse rate',
                avgAnswerTime: 'Avg crisis answer time',
                highRiskClaims: 'High-risk fraud claims',
                activeGrants: 'Active health grants',
            },
        },
        grantsSearch: {
            pageTitle: 'Behavioral health grants',
            intro:
                'Search state grant opportunities for crisis services, substance use treatment, and community mental health programs.',
            keywordLabel: 'Keyword search',
            keywordHint: 'Search titles and descriptions (e.g. crisis, behavioral health, school-based).',
            keywordPlaceholder: 'What program are you looking for?',
            refineHeading: 'Refine results',
            statusHeading: 'Show',
            statusForecasted: 'Forecasted',
            statusActive: 'Active',
            statusClosed: 'Closed',
            postAwardLabel: 'Post-award information only',
            postAwardHint: 'Limit to opportunities with post-award reporting details.',
            excludeLoansLabel: 'Do not show loan opportunities',
            excludeMatchLabel: 'Do not show opportunities requiring matched funding',
            filterAgencyLabel: 'Agency',
            filterCategoryLabel: 'Category',
            filterApplicantLabel: 'Eligible applicant',
            filterDisbursementLabel: 'Disbursement method',
            filterAny: 'Any',
            applyFilters: 'Apply filters',
            resetFilters: 'Reset',
            resultsHeading: 'Results',
            displayRange: 'Displaying {start} – {end} of {total}',
            perPageLabel: 'Per page',
            saveSearch: 'Save current search',
            applySaved: 'Apply saved search',
            clearSaved: 'Clear saved',
            savedToast: 'Search saved for your next visit.',
            clearedToast: 'Saved search removed.',
            glossaryLabel: 'Glossary',
            glossaryHref: '#glossary',
            faqLabel: 'FAQ',
            faqHref: '#faq',
            helpfulResources: 'Helpful resources',
            colDeadline: 'Deadline',
            colTitle: 'Grant title',
            colOpenDate: 'Open date',
            colAgency: 'Agency',
            colMatch: 'Match funding?',
            colEstimated: 'Est. total funding',
            colRange: 'Est. low / high',
            colDisbursement: 'Funds disbursement',
            statusLabelForecasted: 'Forecasted',
            statusLabelActive: 'Active',
            statusLabelClosed: 'Closed',
            prevPage: 'Previous',
            nextPage: 'Next',
            noResults: 'No grants match your criteria. Try adjusting filters or keywords.',
            loadingResults: 'Loading opportunities…',
            fallbackNotice:
                'Showing sample data because the grant index was unavailable or returned no rows.',
            grantDetailDescription: 'Description',
            grantDetailCategory: 'Category',
            grantDetailEligibleApplicant: 'Eligible applicant',
            grantDetailPostAward: 'Post-award reporting',
            grantDetailLoan: 'Loan opportunity',
            grantDetailMatchRequired: 'Matched funding required',
            grantDetailYes: 'Yes',
            grantDetailNo: 'No',
            grantTitleExpandHint: 'Click title to show or hide details',
            defaultApplied: {
                category: 'health',
                excludeLoans: true,
            },
        },
        staffDashboard: {
            pageTitle: 'ODMHSAS Operations Portal',
            subtitle: 'Fraud compliance, crisis operations, clinical outcomes, and grant programs.',
            tabs: {
                fraud: 'Fraud & Compliance',
                crisis: 'Crisis Operations',
                clinical: 'Clinical Outcomes',
                grants: 'Grants & Programs',
            },
            crisisAlertThresholdSeconds: 120,
            crisisAlertMessage: 'Crisis call answer time exceeds SLA — review call center staffing.',
        },
    },

    colors: {
        primary: '#003366',
        secondary: '#2563eb',
        accent: '#0ea5e9',
        slate: '#475569',
        charcoal: '#1e293b',
        warning: '#FF4F00',
        bgBase: '#0B0B0B',
        bgSurface: '#161616',
        white: '#ffffff',
        pageMuted: '#f8fafc',
        cardBorder: 'rgba(15, 23, 42, 0.08)',
    },

    typography: {
        fontFamily: '"Open Sans", "Montserrat", Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        headingWeight: '700',
        headingTracking: '-0.02em',
    },

    navigation: {
        links: [
            { label: 'Crisis Services', href: '#crisis' },
            { label: 'Programs & Services', href: '#programs' },
            { label: 'Provider Resources', href: '#providers' },
            { label: 'Contact', href: '#contact' },
            { label: 'About', href: '#about' },
            { label: 'Data & Reports', href: '#reports' },
        ],
    },

    hero: {
        backgroundImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1920&q=80',
        mainHeading: 'Supporting Wellness and Recovery',
        subHeading: 'Access services, crisis support, and resources for mental health and substance use.',
        overlayOpacity: 0.7,
        ctaButtons: {
            primary: 'Scroll to learn more',
            secondary: 'Sign up for our Newsletter',
        },
    },

    footer: {
        address: '1200 N.E. 13th Street, Oklahoma City, OK 73117',
        phone: '(555) 123-4567',
        quickLinks: [
            { label: 'Crisis Line', href: '#crisis' },
            { label: 'Employment', href: '#employment' },
            { label: 'Privacy', href: '#privacy' },
            { label: 'Accessibility', href: '#accessibility' },
        ],
        socialMedia: [
            { platform: 'FB', href: '#facebook', label: 'Facebook' },
            { platform: 'TW', href: '#twitter', label: 'Twitter' },
            { platform: 'IG', href: '#instagram', label: 'Instagram' },
            { platform: 'LI', href: '#linkedin', label: 'LinkedIn' },
        ],
    },

    schema: 'agency',

    schemaLabels: {
        dashboardStaff: 'ODMHSAS Operations Portal',
        staffRole: 'authorized staff',
    },

    elastic: {
        agentId: 'ok-grants-data',
        fraudAgentId: 'ok-fraud',
        grantsDataIndex: 'ok-grant-data',
        grantsDataAgentId: 'ok-fraud',
        grantsSearchSize: 500,
        kibanaUrl: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
        dashboards: {
            fraud: [
                {
                    title: 'Medicaid Fraud — Executive Summary',
                    id: '46726649-5d76-4d66-b1ca-326ccef7681e',
                    role: 'executive',
                },
                {
                    title: 'Medicaid Fraud — Overview',
                    id: '90688957-e33d-42dd-bc96-c3e348be3b85',
                    role: 'investigator',
                },
            ],
            clinical: [
                {
                    title: 'Substance Abuse — Client Outcomes',
                    id: '3880ff5a-af96-4811-8071-09d5aff0054a',
                },
                {
                    title: 'ODMHSAS Clients',
                    id: '62cf2d83-4934-4dad-a9ea-0020449e51a2',
                },
            ],
            crisis: [
                {
                    title: 'Crisis Services — Call Center & Dispatch',
                    id: '030e8156-3e34-4cee-b485-0d64115ec8b8',
                },
            ],
            grants: [
                {
                    title: 'Grants — Search Performance',
                    id: '48e661bc-9939-4daa-946c-de2bfe33ef65',
                },
            ],
            other: [
                {
                    title: 'ODMHSAS Claims',
                    id: '00a4fbef-632f-4a00-93c4-18561b8445b6',
                },
            ],
        },
    },

    search: {
        defaultFilters: { state: 'Oklahoma' },
        preferences: { sortBy: 'deadline', sortOrder: 'ASC' },
    },

    grantsFilterOptions: {
        agencies: [
            { value: '', label: 'Any agency' },
            { value: 'health', label: 'Department of Health / ODMHSAS' },
            { value: 'education', label: 'Department of Education' },
            { value: 'commerce', label: 'Department of Commerce' },
        ],
        categories: [
            { value: '', label: 'Any category' },
            { value: 'health', label: 'Health & behavioral health' },
            { value: 'education', label: 'Education & school-based' },
            { value: 'workforce', label: 'Workforce & training' },
        ],
        eligibleApplicants: [
            { value: '', label: 'Any applicant' },
            { value: 'nonprofit', label: 'Nonprofit' },
            { value: 'public', label: 'Public agency' },
            { value: 'business', label: 'Business' },
            { value: 'tribal', label: 'Tribal government' },
        ],
        disbursementMethods: [
            { value: '', label: 'Any method' },
            { value: 'reimbursement', label: 'Reimbursement(s)' },
            { value: 'advance', label: 'Advance(s)' },
            { value: 'mixed', label: 'Advances & reimbursement(s)' },
        ],
    },

    grantsCatalog: [
        { id: 'g7', title: 'Community Health Clinic Expansion', description: 'Capital grants for rural clinic capacity.', status: 'active', postAwardInfo: true, isLoan: false, matchRequired: false, matchFunding: 'No', agency: 'health', category: 'health', eligibleApplicant: 'nonprofit', disbursementMethod: 'mixed', deadline: '2026-07-12', openDate: '2026-01-20', estimatedTotal: 15000000, rangeLowHigh: '$200K – $2M' },
        { id: 'g25', title: 'Mobile Crisis Unit Equipment', description: 'Vehicles and telehealth kits for behavioral health response.', status: 'active', postAwardInfo: true, isLoan: false, matchRequired: true, matchFunding: '15%', agency: 'health', category: 'health', eligibleApplicant: 'public', disbursementMethod: 'mixed', deadline: '2026-08-30', openDate: '2026-03-10', estimatedTotal: 11000000, rangeLowHigh: '$250K – $1.5M' },
        { id: 'g4', title: 'Workforce Training Reimbursement', description: 'Tuition and certification for in-demand occupations including behavioral health.', status: 'active', postAwardInfo: true, isLoan: false, matchRequired: false, matchFunding: 'No', agency: 'education', category: 'workforce', eligibleApplicant: 'business', disbursementMethod: 'reimbursement', deadline: '2026-06-30', openDate: '2026-02-01', estimatedTotal: 8000000, rangeLowHigh: '$10K – $200K' },
        { id: 'g16', title: 'Food Bank Cold Storage Upgrade', description: 'Refrigeration capacity for regional distributors serving vulnerable populations.', status: 'closed', postAwardInfo: true, isLoan: false, matchRequired: false, matchFunding: 'No', agency: 'health', category: 'health', eligibleApplicant: 'nonprofit', disbursementMethod: 'reimbursement', deadline: '2025-09-30', openDate: '2025-03-01', estimatedTotal: 4000000, rangeLowHigh: '$75K – $500K' },
        { id: 'g3', title: 'School-Based Mental Health Expansion', description: 'Forecasted funding for counselors and telehealth in Title I districts.', status: 'forecasted', postAwardInfo: false, isLoan: false, matchRequired: false, matchFunding: 'No', agency: 'education', category: 'health', eligibleApplicant: 'public', disbursementMethod: 'reimbursement', deadline: '2026-09-01', openDate: '2026-04-01', estimatedTotal: null, rangeLowHigh: 'Dependent' },
    ],

    news: [
        {
            category: 'Crisis Services',
            title: '24/7 Mental Health Helpline Now Available Statewide',
            description: 'Oklahomans can call or text for immediate support, crisis counseling, and referrals to local services.',
            image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80',
        },
        {
            category: 'Grants & Funding',
            title: 'Community Mental Health Grants Awarded',
            description: 'Funding will expand school-based services and peer support programs in underserved areas.',
            image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80',
        },
        {
            category: 'Awareness',
            title: 'Statewide Training for Suicide Prevention',
            description: 'New initiative trains educators and first responders in recognition and referral for at-risk individuals.',
            image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
        },
    ],

    login: {
        headline: 'Care, compliance, and crisis support — unified for authorized staff.',
        ssoButtonLabel: 'Staff portal SSO',
        features: [
            'Monitor Medicaid fraud and compliance dashboards',
            'Review crisis operations and statewide KPIs',
            'Explore clinical outcomes and client program data',
            'Search behavioral health grants and open funding',
        ],
    },
};

/** Flatten grouped dashboard config for link lists. */
export function getOkMentalHealthDashboards(template) {
    const grouped = template?.elastic?.dashboards;
    if (!grouped) return [];
    if (Array.isArray(grouped)) return grouped;
    return Object.values(grouped).flat();
}
