/**
 * Wyoming ETS — data classification demo template.
 * Data: wyo-classified-*, wyo-public-share, wyo-spillage-alerts (synthetic corpus from data-classification-tool).
 */
export const wyomingTemplate = {
    id: 'wyoming',
    name: 'Wyoming Data Classification',

    branding: {
        institutionName: 'Wyoming ETS',
        tagline: 'Classify data at ingest. Keep the label with the document. Enforce on it.',
        logo: '/logo-wyoming.svg',
    },

    header: {
        overlay: true,
        sticky: true,
        utilityIcons: ['search', 'globe', 'menu'],
        menuLabel: 'MENU',
    },

    content: {
        heroTitle: 'You cannot protect data you have not described.',
        heroSubtitle: 'Elastic classifies state records at ingest, keeps the classification with the document, and enforces on it.',
        ctaText: 'Learn More',
        ctaSecondary: 'Staff Portal',
        stateName: 'Wyoming',
        stateAbbreviation: 'WY',
        welcomeMessage: 'Welcome to the Wyoming ETS Data Classification Portal',
        blueBar: {
            newsletterText: 'Sign up for ETS records-governance updates',
            scrollPromptText: 'Scroll to explore classification levels',
            sidebarIcons: ['email', 'document'],
        },
        promoBar: {
            text: 'DEMO — Synthetic records only. Never load real state data into this environment.',
            href: '#programs',
        },
        mainHeading: 'Describe. Protect. Retain. Share.',
        mainTagline: 'CLASSIFICATION TRAVELS WITH THE DOCUMENT',
        chatBubbleText: 'Ask about levels, pending review, or public-share spillage',
        chatAssistantTitle: 'ETS Classification Assistant',
        chatAssistantSubtitle: 'Ask about Public, Internal, Confidential, Restricted, the review queue, or restricted files in public share.',
        chatAssistantEmptyBody: 'Ask about document counts by level, pending reviews, owner agencies, or the planted spillage file.',
        chatAssistantEmptyTry: 'Tap * below for demo queries',
        chat: {
            samplePromptsByAgent: {
                'wyo-classify': [
                    { label: 'Snapshot', prompt: 'How many documents are classified, and how many are restricted or pending review?' },
                    { label: 'By level', prompt: 'Show document counts by classification level' },
                    { label: 'Pending queue', prompt: 'What is in the pending review queue?' },
                    { label: 'Agencies', prompt: 'Which owner agencies have the most classified documents?' },
                    { label: 'Spillage', prompt: 'Are any restricted documents in the public share?' },
                    { label: 'Prioritize queue', prompt: 'How should a privacy officer prioritize the pending review queue this week?', skipFastPath: true },
                    { label: 'Public vs restricted', prompt: 'Compare public versus restricted volume and say what that means for sharing.', skipFastPath: true },
                    { label: 'Spillage brief', prompt: 'How should we brief ETS leadership if restricted immunization records hit a public share?', skipFastPath: true },
                    { label: 'Clerk vs officer', prompt: 'Explain the records-clerk versus privacy-officer view of the same Discover query.', skipFastPath: true },
                ],
            },
        },
        programsLanding: {
            sectionTitle: 'Classification levels',
            sectionSubtitle: 'Pattern detectors score PII, PHI, PCI, CJI, FTI, and FERPA at ingest. Low-confidence and planted-ambiguous docs land in the review queue.',
            tileCta: 'Learn more',
            tiles: [
                {
                    label: 'Public & Internal',
                    description: 'Press releases, road reports, and routine shares. Public is the default when detectors are quiet.',
                    href: '#reports',
                },
                {
                    label: 'Confidential & Restricted',
                    description: 'Health, tax, justice, and education markers raise the score. Restricted is the ceiling for SSN, PCI, and mixed high-weight detectors.',
                    href: '#reports',
                },
                {
                    label: 'Pending review',
                    description: 'Confidence below 0.80 — or planted-ambiguous governor press files — wait for a privacy officer to confirm or override.',
                    href: '#reports',
                },
                {
                    label: 'Staff portal',
                    description: 'Authorized staff: live KPIs, pending queue, agency breakdown, and the ETS overview dashboard.',
                    href: '#staff-login',
                },
            ],
        },
        reportsSection: {
            title: 'Classification snapshot',
            subtitle: 'Live counts from wyo-classified-* and wyo-public-share. Staff can open the full overview dashboard after login.',
            kpiLabels: {
                totalDocs: 'Total documents',
                restricted: 'Restricted',
                pendingReview: 'Pending review',
                spillageAlerts: 'Spillage alerts',
            },
            seededHeading: 'Demo corpus (synthetic)',
            seededNote: 'Hold-out planted file for the public-share spillage moment. Review console confirm/override stays in the classification-tool app.',
        },
        staffDashboard: {
            pageTitle: 'Data Classification Operations',
            subtitle: 'Monitor ingest labels, pending reviews, restricted documents, and public-share spillage from the synthetic Wyoming corpus.',
            tabs: {
                overview: 'Classification Overview',
            },
            levelsHeading: 'Documents by level',
            levelsSubtitle: 'public · internal · confidential · restricted',
            queueHeading: 'Pending review',
            queueSubtitle: 'Lowest confidence first — same sort as the review console.',
            agenciesHeading: 'Owner agencies',
            agenciesSubtitle: 'Counts by data.owner_agency',
            spillageHeading: 'Public-share spillage',
            spillageSubtitle: 'Restricted documents whose storage zone is public_share.',
            kibanaHeading: 'Kibana',
            kibanaBody: 'Open the ETS classification overview. Role switch (records clerk vs privacy officer) is a Kibana login, not this portal.',
            emptyQueue: 'No pending reviews found',
            emptyLevels: 'No classified documents found',
            emptyAgencies: 'No agency breakdown found',
            emptySpillage: 'No restricted documents in public share',
            loadError: 'Could not load classification indices. Load the synthetic corpus onto the demo Elasticsearch cluster.',
            colFile: 'File',
            colAgency: 'Agency',
            colLevel: 'Level',
            colConfidence: 'Confidence',
            colZone: 'Zone',
            colCount: 'Count',
            colCategories: 'Categories',
        },
    },

    login: {
        headline: 'Classify, review, and enforce on state records',
        ssoButtonLabel: 'SSO through ETS',
        features: [
            'See documents by Public, Internal, Confidential, and Restricted',
            'Work the pending-review queue (lowest confidence first)',
            'Watch for restricted files in the public share',
            'Ask the classification assistant about levels, the review queue, and spillage',
            'Open the ETS classification overview in Kibana',
        ],
    },

    navigation: {
        links: [
            { label: 'Levels', href: '#programs' },
            { label: 'Reports', href: '#reports' },
            { label: 'Contact', href: '#contact' },
            { label: 'About ETS', href: '#about' },
        ],
    },

    hero: {
        backgroundImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80',
        mainHeading: 'WYOMING ETS',
        subHeading: 'You cannot protect, retain, or share data you have not described.',
        ctaButtons: {
            primary: 'Staff Login',
            secondary: 'View levels',
        },
    },

    footer: {
        address: 'Enterprise Technology Services, Cheyenne, WY',
        phone: '(307) 555-0100',
        quickLinks: [
            { label: 'Classification levels', href: '#programs' },
            { label: 'Reports', href: '#reports' },
            { label: 'Privacy', href: '#privacy' },
            { label: 'Accessibility', href: '#accessibility' },
        ],
        socialMedia: [
            { platform: 'FB', href: '#facebook', label: 'Facebook' },
            { platform: 'TW', href: '#twitter', label: 'Twitter' },
        ],
    },

    news: [
        {
            category: 'Records governance',
            title: 'Classification at ingest, not after the fact',
            description: 'Detectors score SSN, driver license, ICD-10, tax markers, and more before the document lands in a storage zone.',
            image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
        },
        {
            category: 'Review queue',
            title: 'Low confidence stays pending until a human decides',
            description: 'Planted-ambiguous press files and mixed signals wait for confirm or override with a required reason.',
            image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
        },
        {
            category: 'Enforcement',
            title: 'Restricted data in a public share raises an alert',
            description: 'The planted immunization PDF is held out of bulk load so Friday’s live ingest can fire wyo-spillage-alerts.',
            image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
        },
    ],

    colors: {
        primary: '#1B365D',
        secondary: '#C4A35A',
        warning: '#9B2C2C',
        bgBase: '#0B0B0B',
        bgSurface: '#161616',
        charcoal: '#1e293b',
        accent: '#C4A35A',
    },

    typography: {
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        headingWeight: '900',
        headingTracking: '-0.05em',
    },

    schema: 'agency',

    schemaLabels: {
        dashboardStaff: 'Data Classification Operations',
        staffRole: 'privacy officer',
        primaryRole: 'records clerk',
        disclaimer: 'By logging in, you agree to comply with ETS policies. This portal uses synthetic records only.',
        ssoTitle: 'ETS Single Sign-On',
        secureSessionNote: 'Agency services that use SSO will always direct you to an official ETS address.',
    },

    elastic: {
        agentId: 'wyo-classify',
        esQueryAgentId: 'wyo-classify',
        indices: {
            classified: 'wyo-classified-*',
            publicShare: 'wyo-public-share',
            spillageAlerts: 'wyo-spillage-alerts',
        },
        kibanaUrl: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
        dashboards: {
            overview: [{ title: 'Wyoming Data Classification Overview', id: 'wyo-classification-overview' }],
        },
        seededEntities: {
            plantedSpillageFile: 'spillage_immunization.pdf',
            corpusSize: '308',
            holdOut: '1',
        },
    },

    search: {
        defaultFilters: {},
        preferences: { sortBy: '@timestamp', sortOrder: 'DESC' },
    },
};
