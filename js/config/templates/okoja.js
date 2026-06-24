/**
 * Oklahoma Office of Juvenile Affairs (OJA) — juvenile justice demo template.
 * Data: youth_profiles, case_notes, assessments, outcomes (okjjusticedata).
 */
export const okojaTemplate = {
    id: 'okoja',
    name: 'Oklahoma Office of Juvenile Affairs',

    branding: {
        institutionName: 'Oklahoma Office of Juvenile Affairs',
        tagline: 'Supervision, assessments, and outcomes for Oklahoma youth.',
        logo: '/logo-okagency.svg',
    },

    header: {
        overlay: true,
        sticky: true,
        utilityIcons: ['search', 'globe', 'menu'],
        menuLabel: 'MENU',
    },

    content: {
        heroTitle: 'Juvenile Justice Insights at a Glance',
        heroSubtitle: 'Monitor supervision caseloads, risk assessments, case notes, and discharge outcomes statewide.',
        ctaText: 'Learn More',
        ctaSecondary: 'Staff Portal',
        stateName: 'Oklahoma',
        stateAbbreviation: 'OK',
        welcomeMessage: 'Welcome to the Oklahoma Office of Juvenile Affairs Portal',
        blueBar: {
            newsletterText: 'Sign up for OJA Updates',
            scrollPromptText: 'Scroll to explore programs',
            sidebarIcons: ['email', 'document'],
        },
        promoBar: {
            text: 'DEMO — Contains simulated juvenile justice data for demonstration purposes only.',
            href: '#programs',
        },
        mainHeading: 'Protecting Youth. Strengthening Communities.',
        mainTagline: 'STATEWIDE SUPERVISION WITH LOCAL ACCOUNTABILITY',
        chatBubbleText: 'Ask about caseloads, risk, or recidivism',
        chatAssistantTitle: 'OJA Assistant',
        chatAssistantSubtitle: 'Ask about active youth, risk levels, recidivism, case notes, or county trends.',
        chatAssistantEmptyBody: 'Ask about supervision caseloads, assessments, discharge outcomes, or case note sentiment.',
        chatAssistantEmptyTry: 'Try: "How many youth are actively supervised?" or "Show high-risk youth"',
        programsLanding: {
            sectionTitle: 'Programs & Supervision',
            sectionSubtitle: 'Evidence-based services across Oklahoma\'s 77 counties.',
            tileCta: 'Learn more',
            tiles: [
                {
                    label: 'Community Supervision',
                    description: 'Probation officers and case managers supporting youth in their home communities.',
                    href: '#programs',
                },
                {
                    label: 'Residential Care',
                    description: 'Secure and staff-secure facilities for higher-supervision placements.',
                    href: '#programs',
                },
                {
                    label: 'Risk & Assessment',
                    description: 'YASI, SAVRY, and OJA risk tools to guide supervision levels.',
                    href: '#reports',
                },
                {
                    label: 'Staff Portal Login',
                    description: 'Authorized staff: caseload dashboards, youth profiles, and analytics.',
                    href: '#staff-login',
                },
            ],
        },
        reportsSection: {
            title: 'Data & Performance',
            subtitle: 'Statewide snapshots from Elasticsearch. Staff can open full Kibana dashboards after login.',
            kpiLabels: {
                activeYouth: 'Active supervision cases',
                avgRisk: 'Average risk score',
                recidivism12: '12-month recidivism rate',
                openNotes: 'Case notes (90 days)',
            },
        },
        staffDashboard: {
            pageTitle: 'OJA Operations Portal',
            subtitle: 'Review high-priority youth, supervision workload, assessments, and discharge outcomes.',
            generateEmailLabel: 'Generate supervisor email',
            tabs: {
                overview: 'Case Overview',
                assessments: 'Assessments & Outcomes',
                notes: 'Case Notes',
            },
        },
    },

    navigation: {
        links: [
            { label: 'Programs', href: '#programs' },
            { label: 'Reports', href: '#reports' },
            { label: 'Contact', href: '#contact' },
            { label: 'About OJA', href: '#about' },
        ],
    },

    hero: {
        backgroundImage: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1920&q=80',
        mainHeading: 'PROTECTING YOUTH',
        subHeading: 'Strengthening Oklahoma Communities.',
        ctaButtons: {
            primary: 'Staff Login',
            secondary: 'View Programs',
        },
    },

    footer: {
        address: '3812 N. Santa Fe Ave., Oklahoma City, OK 73118',
        phone: '(405) 521-3600',
        quickLinks: [
            { label: 'Programs', href: '#programs' },
            { label: 'Data Reports', href: '#reports' },
            { label: 'Privacy', href: '#privacy' },
            { label: 'Accessibility', href: '#accessibility' },
        ],
        socialMedia: [
            { platform: 'FB', href: '#facebook', label: 'Facebook' },
            { platform: 'TW', href: '#twitter', label: 'Twitter' },
        ],
    },

    colors: {
        primary: '#1B3A5C',
        secondary: '#2E75B6',
        warning: '#CC0000',
        bgBase: '#0B0B0B',
        bgSurface: '#161616',
    },

    typography: {
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        headingWeight: '900',
        headingTracking: '-0.05em',
    },

    schema: 'agency',

    schemaLabels: {
        dashboardStaff: 'OJA Operations Portal',
        staffRole: 'authorized staff',
        primaryRole: 'citizen',
    },

    elastic: {
        agentId: 'ok-oja-data',
        dataAgentId: 'ok-oja-data',
        indices: {
            youthProfiles: 'youth_profiles',
            caseNotes: 'case_notes',
            assessments: 'assessments',
            outcomes: 'outcomes',
        },
        kibanaUrl: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
        dashboards: {
            overview: [{ title: 'OJA - Case Overview Dashboard', id: 'oja-case-overview' }],
            assessments: [{ title: 'OJA - Assessments & Outcomes Dashboard', id: 'oja-assessments-outcomes' }],
            notes: [{ title: 'OJA - Case Notes Dashboard', id: 'oja-case-notes' }],
        },
        workflows: {
            supervisorEmail: {
                workflowId: 'oja-supervisor-email-draft',
                toolId: 'oja-supervisor-email-workflow',
            },
        },
    },

    search: {
        defaultFilters: { state: 'Oklahoma' },
        preferences: { sortBy: 'intake_date', sortOrder: 'DESC' },
    },
};
