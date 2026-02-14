/**
 * Department of Transportation (DOT) - State Agency template
 * Professional Gov aesthetic: blue/grays, high accessibility.
 * Schema: agency (Citizen / Case Worker / Status).
 */
export const dotTemplate = {
    id: 'dot',
    name: 'Department of Transportation',

    schema: 'agency',

    branding: {
        institutionName: 'Department of Transportation',
        tagline: 'Safe Roads. Strong Connections.',
        logo: '/logo-dot.svg',
    },

    content: {
        heroTitle: 'Building Safer Roads and Stronger Connections',
        heroSubtitle: 'Learn more about state transportation projects, permits, and services.',
        ctaText: 'Learn More',
        ctaSecondary: 'Sign Up for Updates',
        stateName: 'Oklahoma',
        stateAbbreviation: 'OK',
        welcomeMessage: 'Welcome to the Department of Transportation Portal',
        promoBar: {
            text: 'Click here for information on the State Transportation Improvement Program',
            href: '#strategic-plan',
        },
    },

    // Gov aesthetic: professional blue and grays, high contrast/accessibility
    colors: {
        primary: '#003366',
        secondary: '#2E7D32',
        warning: '#C05600',
        bgBase: '#0B0B0B',
        bgSurface: '#1a365d',
    },

    typography: {
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        headingWeight: '900',
        headingTracking: '-0.05em',
    },

    navigation: {
        links: [
            { label: 'Projects', href: '#projects' },
            { label: 'Permits', href: '#permits' },
            { label: 'Maps', href: '#maps' },
            { label: 'Contact', href: '#contact' },
            { label: 'About', href: '#about' },
            { label: 'Resources', href: '#resources' },
        ],
    },

    hero: {
        backgroundImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1920&q=80',
        mainHeading: 'Building Safer Roads and Stronger Connections',
        subHeading: 'Learn more about what makes our state a place to move forward.',
        ctaButtons: {
            primary: 'Learn More',
            secondary: 'Sign Up for Updates',
        },
    },

    footer: {
        address: '200 N.E. 21st Street, Oklahoma City, OK 73105',
        phone: '(405) 521-2525',
        quickLinks: [
            { label: 'Map', href: '#map' },
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

    elastic: {
        agentId: null,
    },

    search: {
        defaultFilters: {
            state: 'Oklahoma',
        },
        preferences: {
            sortBy: 'deadline',
            sortOrder: 'ASC',
        },
    },

    news: [
        {
            category: 'Projects',
            title: 'Highway 75 Improvement Project Breaks Ground',
            description: 'Major safety and capacity improvements will begin this spring on the corridor.',
            image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80',
        },
        {
            category: 'Safety',
            title: 'New Work Zone Safety Campaign Launches',
            description: 'Statewide campaign aims to reduce incidents in work zones.',
            image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80',
        },
        {
            category: 'Transit',
            title: 'Transit Grant Program Opens for Applications',
            description: 'Local agencies can apply for funding to expand public transit options.',
            image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
        },
    ],
};
