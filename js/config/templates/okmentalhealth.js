/**
 * Oklahoma Department of Mental Health – State Agency Template
 * Same layout as okagency (overlay header, hero, blue bar, green banner, white main).
 * Content and branding tailored to mental health and substance use services.
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
        dashboardStaff: 'Mental Health Fraud & Compliance Dashboard',
    },

    elastic: {
        agentId: null,
        kibanaUrl: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
    },

    search: {
        defaultFilters: { state: 'Oklahoma' },
        preferences: { sortBy: 'deadline', sortOrder: 'ASC' },
    },

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
};
