/**
 * SNAP Fraud Detection — USDA FNS-style demo template.
 * Data: snap-transactions, snap-stores, snap-households, snap-reference (gawdzilla).
 */
export const snapfraudTemplate = {
    id: 'snapfraud',
    name: 'SNAP Fraud Detection',

    branding: {
        institutionName: 'SNAP Integrity & Fraud Analytics',
        tagline: 'Detect trafficking, identity fraud, and retailer abuse across EBT transactions.',
        logo: '/logo-okagency.svg',
    },

    header: {
        overlay: true,
        sticky: true,
        utilityIcons: ['search', 'globe', 'menu'],
        menuLabel: 'MENU',
    },

    content: {
        heroTitle: 'Protect SNAP Benefits. Stop Fraud.',
        heroSubtitle: 'Monitor EBT transactions, retailer patterns, and household anomalies with Elasticsearch and Agent Builder.',
        ctaText: 'Learn More',
        ctaSecondary: 'Investigator Portal',
        stateName: 'United States',
        stateAbbreviation: 'US',
        welcomeMessage: 'Welcome to the SNAP Fraud Analytics Portal',
        blueBar: {
            newsletterText: 'Sign up for FNS Integrity Updates',
            scrollPromptText: 'Scroll to explore detection scenarios',
            sidebarIcons: ['email', 'document'],
        },
        promoBar: {
            text: 'DEMO — Contains simulated SNAP/EBT transaction data for demonstration purposes only.',
            href: '#programs',
        },
        mainHeading: 'Integrity Through Analytics',
        mainTagline: 'REAL-TIME FRAUD DETECTION FOR RETAILERS & HOUSEHOLDS',
        chatBubbleText: 'Ask about trafficking, retailer abuse, or identity fraud',
        chatAssistantTitle: 'SNAP Fraud Investigator',
        chatAssistantSubtitle: 'Ask about same-cent trafficking, manual entry, volume spikes, cross-state IDs, or deceased beneficiaries.',
        chatAssistantEmptyBody: 'Ask about seeded fraud scenarios, flagged stores, suspicious households, or open a Kibana case.',
        chatAssistantEmptyTry: 'Tap * below for demo queries',
        programsLanding: {
            sectionTitle: 'Detection Scenarios',
            sectionSubtitle: 'Seven seeded fraud signatures in synthetic EBT data — verified by ES|QL and ML anomaly jobs.',
            tileCta: 'Learn more',
            tiles: [
                {
                    label: 'Same-Cent Trafficking',
                    description: 'Stores with unusually high share of round-dollar EBT transactions (store 4471).',
                    href: '#reports',
                },
                {
                    label: 'Manual Entry Abuse',
                    description: 'Cashiers bypassing card readers with excessive manual EBT entry (store 5102).',
                    href: '#reports',
                },
                {
                    label: 'Volume & Basket Anomalies',
                    description: 'ML volume spikes (3890), large convenience baskets (6123), and broken-up purchases (7701).',
                    href: '#reports',
                },
                {
                    label: 'Investigator Portal',
                    description: 'Authorized staff: live KPIs, flagged entities, Kibana dashboards, and Agent Builder.',
                    href: '#staff-login',
                },
            ],
        },
        reportsSection: {
            title: 'Fraud Intelligence Snapshot',
            subtitle: 'Live metrics from snap-* indices on Elasticsearch. Staff can open the full investigator dashboard after login.',
            kpiLabels: {
                transactions7d: 'Transactions (7 days)',
                flaggedStores: 'Flagged retailers',
                crossStateIds: 'Cross-state identities',
                deceasedTx: 'Deceased beneficiary txs',
            },
        },
        staffDashboard: {
            pageTitle: 'SNAP Fraud Investigator Portal',
            subtitle: 'Review flagged retailers, household anomalies, ML alerts, and open cases in Kibana.',
            tabs: {
                intelligence: 'Fraud Intelligence',
            },
        },
        chat: {
            samplePromptsByAgent: {
                'snap-fraud-investigator': [
                    { label: 'Same-cent trafficking', prompt: 'Which stores show same-cent trafficking?' },
                    { label: 'Manual EBT entry', prompt: 'Show retailers with excessive manual EBT entry' },
                    { label: 'Cross-state IDs', prompt: 'Find cross-state identity fraud' },
                    { label: 'Deceased beneficiaries', prompt: 'Which deceased beneficiaries are still transacting?' },
                    { label: 'Visit first', prompt: 'Which retailer should investigators visit first, and what evidence packet should they bring?', skipFastPath: true },
                    { label: 'Crime vs error', prompt: 'Compare household splitting versus retailer round-dollar patterns — which looks more like organized crime versus error?', skipFastPath: true },
                    { label: 'Prosecutor brief', prompt: 'How should we brief a prosecutor on mixed identity and deceased-payee activity?', skipFastPath: true },
                    { label: 'New monitoring rule', prompt: 'Recommend a monitoring rule we should add after this week\'s anomalies.', skipFastPath: true },
                ],
            },
        },
    },

    navigation: {
        links: [
            { label: 'Scenarios', href: '#programs' },
            { label: 'Reports', href: '#reports' },
            { label: 'Contact', href: '#contact' },
            { label: 'About FNS', href: '#about' },
        ],
    },

    hero: {
        backgroundImage: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1920&q=80',
        mainHeading: 'SNAP INTEGRITY',
        subHeading: 'Detect fraud before benefits are lost.',
        ctaButtons: {
            primary: 'Staff Login',
            secondary: 'View Scenarios',
        },
    },

    footer: {
        address: '1400 Independence Ave. SW, Washington, DC 20250',
        phone: '(800) 424-9121',
        quickLinks: [
            { label: 'Detection Scenarios', href: '#programs' },
            { label: 'Fraud Reports', href: '#reports' },
            { label: 'Privacy', href: '#privacy' },
            { label: 'Accessibility', href: '#accessibility' },
        ],
        socialMedia: [
            { platform: 'FB', href: '#facebook', label: 'Facebook' },
            { platform: 'TW', href: '#twitter', label: 'Twitter' },
        ],
    },

    colors: {
        primary: '#1B5E20',
        secondary: '#2E7D32',
        warning: '#C62828',
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
        dashboardStaff: 'SNAP Fraud Investigator Portal',
        staffRole: 'authorized investigator',
        primaryRole: 'citizen',
    },

    elastic: {
        agentId: 'snap-fraud-investigator',
        fraudAgentId: 'snap-fraud-investigator',
        indices: {
            transactions: 'snap-transactions',
            stores: 'snap-stores',
            households: 'snap-households',
            reference: 'snap-reference',
        },
        kibanaUrl: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
        dashboards: {
            fraud: [{ title: 'SNAP Fraud Investigator', id: '130b4789-10ed-400f-890f-23086f5b76e8' }],
        },
        seededEntities: {
            sameCentStore: '4471',
            manualEntryStore: '5102',
            volumeSpikeStore: '3890',
            largeBasketStore: '6123',
            drainStore: '7701',
            rapidBasketHousehold: 'hh_basket_demo_001',
            crossStateSsn: 'ssn_hash_cross_state_demo_001',
            deceasedHousehold: 'hh_deceased_demo_001',
        },
        workflows: {
            traffickingCase: { workflowId: 'snap-trafficking-case' },
            nightlySweep: { workflowId: 'snap-nightly-fraud-sweep' },
        },
    },

    search: {
        defaultFilters: {},
        preferences: { sortBy: '@timestamp', sortOrder: 'DESC' },
    },
};
