/**
 * Texas College Template Configuration
 * Athletic booster & donor engagement — University of San Antonio inspired palette
 */
export const texascollegeTemplate = {
    id: 'texascollege',
    name: 'Texas College',

    branding: {
        institutionName: 'Texas College',
        tagline: 'Advancing Athletics Through Generous Alumni Support',
        logo: '/logo-texascollege.svg',
    },

    content: {
        heroTitle: 'Athletic Booster & Donor Engagement',
        heroSubtitle: 'Insights into donor affinity, engagement health, and at-risk major gifts for Texas College athletics',
        ctaText: 'View Donor Analytics',
        ctaSecondary: 'Talk to Donor Assistant',
        stateName: 'Texas',
        stateAbbreviation: 'TX',
        welcomeMessage: 'Welcome to the Texas College Athletic Advancement Portal',
        chatBubbleText: 'Ask about donor engagement data',
        chatAssistantTitle: 'Roadrunner Donor Assistant',
        chatAssistantSubtitle: 'Chat with athletic booster and engagement data',
        chatAssistantEmptyBody: 'Ask about at-risk donors, major gifts, affinity scores, or engagement trends.',
        chatAssistantEmptyTry: 'Try: "Who are our at-risk major gift donors?"',
        generateAlumniEmailLabel: 'Generate alumni email',
        gamedayChatAssistantTitle: 'Game Day Retail Assistant',
        gamedayChatAssistantSubtitle: 'Ask about the 100-item team store catalog, top sellers, and gameday merchandise revenue',
        gamedayChatAssistantEmptyBody: 'Ask about stadium retail SKUs, top-selling apparel, team store locations, or combined ticket + merch revenue.',
        gamedayChatAssistantEmptyTry: 'Try: "Show the stadium retail catalog" or "What are our top-selling items?"',
        promoBar: {
            text: 'Spring Giving Drive — Support Texas College Athletics. Every gift fuels student-athlete success.',
            href: '#giving',
        },
        staffDashboard: {
            pageTitle: 'Athletic Advancement Dashboard',
            subtitle: 'Live insights from athletic-boosters, booster-engagement-events, and booster-case-metrics on the gawdzilla Elastic deployment.',
            gamedaySubtitle: 'Team store retail from a 100-item campus bookstore catalog — jerseys, apparel, gifts, and fan gear at stadium shops.',
            tabs: {
                donors: 'Donor Engagement',
                gameday: 'Game Day Revenue',
            },
        },
    },

    colors: {
        primary: '#0C2340',
        secondary: '#F15A22',
        accent: '#A2AAAD',
        warning: '#FF4F00',
        bgBase: '#0B0B0B',
        bgSurface: '#161616',
    },

    typography: {
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        headingWeight: '900',
        headingTracking: '-0.05em',
    },

    navigation: {
        links: [
            { label: 'Athletics', href: '#athletics' },
            { label: 'Giving', href: '#giving' },
            { label: 'Events', href: '#events' },
            { label: 'Alumni', href: '#alumni' },
            { label: 'Contact', href: '#contact' },
            { label: 'About', href: '#about' },
        ],
    },

    hero: {
        backgroundImage: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1920&q=80',
        mainHeading: 'RUNNERS RISE TOGETHER',
        subHeading: 'Data-driven advancement for Texas College athletics and our booster community.',
        ctaButtons: {
            primary: 'Explore Donors',
            secondary: 'Staff Login',
        },
    },

    footer: {
        address: '1 Texas College Way, San Antonio, TX 78249',
        phone: '(555) 458-4000',
        quickLinks: [
            { label: 'Athletic Giving', href: '#giving' },
            { label: 'Booster Club', href: '#boosters' },
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

    schema: 'school',

    schemaLabels: {
        dashboardStaff: 'Athletic Advancement Dashboard',
        staffRole: 'advancement officer',
    },

    elastic: {
        agentId: 'booster-donor-data',
        kibanaUrl: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
        boosterDataAgentId: 'booster-donor-data',
        gamedayDataAgentId: 'gameday-revenue-data',
        indexes: [
            'athletic-boosters',
            'booster-case-metrics',
            'booster-donor-lookup',
            'booster-engagement-events',
            'paciolan-ticket-events',
            'stadium-retail-catalog',
            'stadium-retail-sales',
        ],
        dashboards: [
            {
                title: 'Engagement Drop Timeline',
                id: 'engagement-drop-timeline',
                section: 'donors',
            },
            {
                title: 'Booster Engagement — At-Risk Donors',
                id: 'booster-at-risk-engagement',
                section: 'donors',
            },
            {
                title: 'Athletic Donor Affinity Intelligence',
                id: '7310b773-f28e-49b6-bdb5-d9e3f8589b72',
                section: 'donors',
            },
            {
                title: 'Engagement Health Overview — At-Risk Major Gifts',
                id: 'at-risk-engagement-health-overview',
                section: 'donors',
            },
        ],
        gamedayRevenue: {
            demoGameId: 'GAME-2025-HOME-01',
            gameLabel: '2025 Home Opener vs. State',
            catalogSourceLabel: 'Campus bookstore assortment',
            catalogItemCount: 100,
            indexes: ['paciolan-ticket-events', 'stadium-retail-catalog', 'stadium-retail-sales'],
            dashboards: [
                {
                    title: 'Game Day Revenue — Live Overview',
                    id: 'gameday-revenue-overview',
                },
                {
                    title: 'Game Day Revenue — Fan Segments & Anomalies',
                    id: 'gameday-fan-segments',
                },
            ],
        },
        engagementTimeline: {
            demoDonorId: 'ALUM-10001',
            demoDonorName: 'James Chen',
            inflectionDate: '2025-09-01',
            startDate: '2024-03-01',
            dashboardId: 'engagement-drop-timeline',
        },
        workflows: {
            alumniEmail: {
                workflowId: 'texas-college-alumni-outreach-email',
                toolId: 'booster-alumni-email-workflow',
            },
        },
        agents: {
            donors: 'booster-donor-data',
            gameday: 'gameday-revenue-data',
        },
    },

    search: {
        defaultFilters: { state: 'Texas' },
        preferences: { sortBy: 'affinity_score', sortOrder: 'DESC' },
    },

    news: [
        {
            category: 'Major Gifts',
            title: 'Record-Breaking Athletics Endowment Surpasses $600M',
            description: 'Lifetime giving from athletic boosters continues to climb, with affinity scores averaging above 62 across 5,000 donor records.',
            image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
        },
        {
            category: 'Engagement',
            title: 'New Donor Portal Drives Portal Login Engagement',
            description: 'Engagement events show strong digital participation — advancement teams are prioritizing at-risk donors with low email open rates.',
            image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
        },
        {
            category: 'Game Day',
            title: 'Homecoming Weekend Sets Attendance Record',
            description: 'Booster game attendance and event participation reached new highs, strengthening alumni affinity across Texas.',
            image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80',
        },
    ],

    login: {
        headline: 'Track, engage, and grow athletic giving — all in one place.',
        ssoButtonLabel: 'Continue with campus SSO',
        features: [
            'View donor affinity scores and engagement health',
            'Identify at-risk major gifts before they lapse',
            'Explore booster events, email opens, and portal activity',
            'Monitor gameday ticket and team store merchandise revenue in real time',
            'Connect with advancement officers and donor analytics',
        ],
    },
};
