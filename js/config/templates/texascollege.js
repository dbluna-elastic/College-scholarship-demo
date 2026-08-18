/**
 * Texas College Template Configuration
 * Athletic booster & donor engagement — University of San Antonio inspired palette
 */
export const texascollegeTemplate = {
    id: 'texascollege',
    name: 'Texas College',
    portal: 'athletic-advancement',

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
        chatAssistantEmptyTry: 'Tap * below for demo queries',
        generateAlumniEmailLabel: 'Generate alumni email',
        gamedayChatAssistantTitle: 'Game Day Retail Assistant',
        gamedayChatAssistantSubtitle: 'Ask about the 100-item team store catalog, top sellers, and gameday merchandise revenue',
        gamedayChatAssistantEmptyBody: 'Ask about stadium retail SKUs, top-selling apparel, team store locations, or unusual purchasing behavior.',
        gamedayChatAssistantEmptyTry: 'Tap * below for demo queries',
        chat: {
            samplePromptsByAgent: {
                'booster-donor-data': [
                    { label: 'At-risk major gifts', prompt: 'Who are our at-risk major gift donors?' },
                    { label: 'At-risk donors', prompt: 'Who are our at-risk donors?' },
                    { label: 'Portfolio', prompt: 'Give me a donor portfolio summary' },
                    { label: 'Top affinity', prompt: 'Who has the highest affinity scores?' },
                    { label: 'Engagement', prompt: 'Summarize recent engagement events' },
                    { label: 'Cases', prompt: 'Show at-risk cases from the last 30 days' },
                    { label: 'Call order', prompt: 'Which donors should gift officers call this week, and in what order?', skipFastPath: true },
                    { label: 'Salvageable drops', prompt: 'Compare engagement drop versus giving drop and say who is actually salvageable.', skipFastPath: true },
                    { label: 'Quiet major donor', prompt: 'Draft talking points for a major donor who went quiet after last season.', skipFastPath: true },
                    { label: 'Staff time', prompt: 'How should we reallocate staff time between affinity stars and slipping major gifts?', skipFastPath: true },
                    { label: '90-day win-back', prompt: 'What would a 90-day win-back campaign look like for quiet alumni?', skipFastPath: true },
                    { label: 'Protect spring drive', prompt: 'If the spring drive underperforms, which segments should we protect first?', skipFastPath: true },
                ],
                'gameday-revenue-data': [
                    { label: 'Retail catalog', prompt: 'Show the stadium retail catalog' },
                    { label: 'Top sellers', prompt: 'What are our top-selling items?' },
                    { label: 'Combined revenue', prompt: 'How much combined gameday revenue did we make?' },
                    { label: 'By category', prompt: 'Break down merchandise revenue by category' },
                    { label: 'Store locations', prompt: 'Which team store locations are performing best?' },
                    { label: 'Unusual purchases', prompt: 'Are there any unusual purchasing behaviors?' },
                    { label: 'Ticket resale', prompt: 'Any signs of ticket resale or bulk merch stocking that look suspicious?' },
                    { label: 'Merch mix', prompt: 'Recommend merch mix changes if jerseys outsell but drinkware has higher margin.', skipFastPath: true },
                    { label: 'Staff next game', prompt: 'Compare pavilion versus team-store performance and where to add staff next game.', skipFastPath: true },
                    { label: 'Group travel vs resale', prompt: 'What should security watch for that looks like resale but might be group travel?', skipFastPath: true },
                    { label: 'Alumni collection', prompt: 'How would you price a new alumni collection without cannibalizing jerseys?', skipFastPath: true },
                    { label: 'Rain restock', prompt: 'If rain is in the forecast, how should we restock concessions versus apparel?', skipFastPath: true },
                    { label: 'Bulk-buy story', prompt: 'Explain whether bulk buys look like fraud, tailgate clubs, or both.', skipFastPath: true },
                    { label: 'Margin vs volume', prompt: 'If volume is up but margin is down, what should retail leadership change first?', skipFastPath: true },
                ],
            },
        },
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
            model: 'retail-catalog',
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
