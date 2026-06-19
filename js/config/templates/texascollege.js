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
        promoBar: {
            text: 'Spring Giving Drive — Support Texas College Athletics. Every gift fuels student-athlete success.',
            href: '#giving',
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
        indexes: [
            'athletic-boosters',
            'booster-case-metrics',
            'booster-donor-lookup',
            'booster-engagement-events',
        ],
        dashboards: [
            {
                title: 'Booster Engagement — At-Risk Donors',
                id: 'booster-at-risk-engagement',
            },
            {
                title: 'Athletic Donor Affinity Intelligence',
                id: '7310b773-f28e-49b6-bdb5-d9e3f8589b72',
            },
            {
                title: 'Engagement Health Overview — At-Risk Major Gifts',
                id: 'at-risk-engagement-health-overview',
            },
        ],
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
};
