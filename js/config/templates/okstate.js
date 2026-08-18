/**
 * Oklahoma State Template Configuration
 * Athletic booster & donor engagement — Cowboy Athletics orange & black
 */
export const okstateTemplate = {
    id: 'okstate',
    name: 'Oklahoma State',
    portal: 'athletic-advancement',

    branding: {
        institutionName: 'Oklahoma State',
        tagline: 'Advancing Cowboy Athletics Through Generous Alumni Support',
        logo: '/logo-okstate.svg',
    },

    content: {
        heroTitle: 'Athletic Booster & Donor Engagement',
        heroSubtitle: 'Insights into donor affinity, engagement health, and at-risk major gifts for Oklahoma State athletics',
        ctaText: 'View Donor Analytics',
        ctaSecondary: 'Talk to Donor Assistant',
        stateName: 'Oklahoma',
        stateAbbreviation: 'OK',
        welcomeMessage: 'Welcome to the Oklahoma State Athletic Advancement Portal',
        chatBubbleText: 'Ask about donor engagement data',
        chatAssistantTitle: 'Cowboy Donor Assistant',
        chatAssistantSubtitle: 'Chat with athletic booster and engagement data',
        chatAssistantEmptyBody: 'Ask about at-risk donors, major gifts, affinity scores, or engagement trends.',
        chatAssistantEmptyTry: 'Tap * below for demo queries',
        generateAlumniEmailLabel: 'Generate alumni email',
        gamedayChatAssistantTitle: 'Game Day Revenue Assistant',
        gamedayChatAssistantSubtitle: 'Ask about Boone Pickens tickets, Square POS concessions, and Cowboy Team Store revenue',
        gamedayChatAssistantEmptyBody: 'Ask about combined gameday revenue, stand performance, the Club Orange outage, fan tiers, or ticket resale.',
        gamedayChatAssistantEmptyTry: 'Tap * below for demo queries',
        chat: {
            samplePromptsByAgent: {
                'okstate-donor-assistant': [
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
                'okstate-gameday-revenue-assistant': [
                    { label: 'Combined revenue', prompt: 'How much combined gameday revenue did we make?' },
                    { label: 'POS totals', prompt: 'Summarize Square POS concessions and merch revenue' },
                    { label: 'Top stands', prompt: 'Which stands are performing best?' },
                    { label: 'By category', prompt: 'Break down POS revenue by category' },
                    { label: 'Club Orange outage', prompt: 'What happened at Club Orange during the payment outage?' },
                    { label: 'Fan tiers', prompt: 'Show ticket revenue by fan tier' },
                    { label: 'Ticket resale', prompt: 'Any signs of ticket resale at Boone Pickens?' },
                    { label: 'Add terminals?', prompt: 'Should we add POS terminals to Club Orange after the outage, or change processors?', skipFastPath: true },
                    { label: 'Student vs club spend', prompt: 'Compare student-section versus club-level spend and what that means for staffing.', skipFastPath: true },
                    { label: 'Outage messaging', prompt: 'How should we message fans if another payment outage hits at halftime?', skipFastPath: true },
                    { label: 'Next-game restock', prompt: 'Recommend a merch restock plan for the next home game based on stand mix.', skipFastPath: true },
                    { label: 'Beer vs food mix', prompt: 'Which stands are over-indexed on beer versus food, and is that a problem?', skipFastPath: true },
                    { label: 'Gate operations', prompt: 'If secondary-market tickets are rising, what operational changes would you make at the gates?', skipFastPath: true },
                    { label: 'Halftime recovery', prompt: 'After a processor drop, how should concessions recover sales in the second half?', skipFastPath: true },
                ],
            },
        },
        promoBar: {
            text: 'Spring Giving Drive — Support Oklahoma State Athletics. Every gift fuels student-athlete success.',
            href: '#giving',
        },
        staffDashboard: {
            pageTitle: 'Athletic Advancement Dashboard',
            subtitle: 'Live insights from athletic-boosters, booster-engagement-events, and booster-case-metrics on the gawdzilla Elastic deployment.',
            gamedaySubtitle: 'Boone Pickens tickets plus Square POS concessions and Cowboy Team Store merch — including the Club Orange payment outage window.',
            tabs: {
                donors: 'Donor Engagement',
                gameday: 'Game Day Revenue',
            },
        },
    },

    colors: {
        primary: '#111111',
        secondary: '#FF7300',
        accent: '#FFFFFF',
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
        mainHeading: 'ORANGE GOES HARD',
        subHeading: 'Data-driven advancement for Oklahoma State athletics and our Cowboy booster community.',
        ctaButtons: {
            primary: 'Explore Donors',
            secondary: 'Staff Login',
        },
    },

    footer: {
        address: '1 Cowboy Way, Stillwater, OK 74078',
        phone: '(555) 744-5000',
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
        agentId: 'okstate-donor-assistant',
        kibanaUrl: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
        boosterDataAgentId: 'okstate-donor-assistant',
        gamedayDataAgentId: 'okstate-gameday-revenue-assistant',
        indexes: [
            'athletic-boosters',
            'booster-case-metrics',
            'booster-donor-lookup',
            'booster-engagement-events',
            'okstate-paciolan-ticket-events',
            'okstate-square-pos-transactions',
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
            model: 'pos',
            demoGameId: 'OKSTATE-2025-HOME-01',
            gameLabel: 'Boone Pickens home opener vs. Texas',
            indexes: ['okstate-paciolan-ticket-events', 'okstate-square-pos-transactions'],
            anomalyStandIds: ['S04', 'S06', 'S09'],
            anomalyWindowStart: '2025-09-06T15:50:00Z',
            anomalyWindowEnd: '2025-09-06T16:05:00Z',
            dashboards: [],
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
                workflowId: 'oklahoma-state-alumni-outreach-email',
                toolId: 'okstate-alumni-email-workflow',
            },
        },
        agents: {
            donors: 'okstate-donor-assistant',
            gameday: 'okstate-gameday-revenue-assistant',
        },
    },

    search: {
        defaultFilters: { state: 'Oklahoma' },
        preferences: { sortBy: 'affinity_score', sortOrder: 'DESC' },
    },

    news: [
        {
            category: 'Major Gifts',
            title: 'Record-Breaking Athletics Endowment Surpasses $600M',
            description: 'Lifetime giving from Cowboy Athletics boosters continues to climb, with affinity scores averaging above 62 across 5,000 donor records.',
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
            description: 'Booster game attendance and event participation reached new highs, strengthening alumni affinity across Oklahoma.',
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
