/**
 * Oklahoma Agency–style State Agency Template
 * High-impact, professional business/government layout:
 * Overlay header on hero, blue CTA bar, green feature banner, white main content, floating chatbot.
 * Design: Deep Navy, Forest Green, Slate Gray, Sky Blue accents; clean sans-serif.
 */
export const okagencyTemplate = {
    id: 'okagency',
    name: 'State Agency',

    // Branding (Oklahoma Agency)
    branding: {
        institutionName: 'Oklahoma Agency',
        tagline: 'Building businesses and communities.',
        logo: '/logo-okagency.svg',
    },

    // Header: overlay on hero, sticky with solid background on scroll
    header: {
        overlay: true,
        sticky: true,
        utilityIcons: ['search', 'globe', 'menu'],
        menuLabel: 'MENU',
    },

    // Content
    content: {
        heroTitle: 'Building Businesses and Communities',
        heroSubtitle: 'Learn more about what makes Oklahoma the land of opportunity.',
        ctaText: 'Learn More',
        ctaSecondary: 'Sign Up for Newsletter',
        stateName: 'Oklahoma',
        stateAbbreviation: 'OK',
        welcomeMessage: 'Welcome to the State Agency Portal',
        // Blue bar (between hero and body)
        blueBar: {
            newsletterText: 'Sign up for our Newsletter',
            scrollPromptText: 'Scroll to learn more',
            sidebarIcons: ['email', 'document'],
        },
        // Green feature banner (secondary hero / strategic plan CTA)
        promoBar: {
            text: 'Click here for information on Oklahoma\'s Strategic Plan for Economic & Community Development',
            href: '#strategic-plan',
        },
        // Main content area (white): H2 + tagline
        mainHeading: 'North America\'s Central Location for Business',
        mainTagline: 'A GLOBAL VISION WITH A LOCAL FOCUS',
        // Floating chatbot bubble copy
        chatBubbleText: 'Can I help you find something?',
    },

    // Design palette: Deep Navy, Forest Green, Slate Gray, Sky Blue (Oklahoma Agency)
    colors: {
        primary: '#003366',       // Deep Navy Blue
        secondary: '#2E7D32',      // Forest Green
        accent: '#0ea5e9',         // Sky Blue (taglines, links)
        slate: '#475569',          // Slate Gray
        charcoal: '#1e293b',       // Dark gray/charcoal for headings
        warning: '#FF4F00',
        bgBase: '#0B0B0B',
        bgSurface: '#161616',
        white: '#ffffff',
    },

    // Typography: clean sans-serif (Montserrat / Open Sans style)
    typography: {
        fontFamily: '"Open Sans", "Montserrat", Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        headingWeight: '700',
        headingTracking: '-0.02em',
    },

    // Navigation - Agency-style links (used in menu / nav)
    navigation: {
        links: [
            { label: 'Business Services', href: '#business' },
            { label: 'Community Development', href: '#community' },
            { label: 'Strategic Plan', href: '#strategic-plan' },
            { label: 'Contact', href: '#contact' },
            { label: 'About', href: '#about' },
            { label: 'Resources', href: '#resources' },
        ],
    },

    // Hero Section (overlay header on top; scroll indicator bottom-left)
    hero: {
        backgroundImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1920&q=80',
        mainHeading: 'Building Businesses and Communities',
        subHeading: 'Learn more about what makes Oklahoma the land of opportunity.',
        overlayOpacity: 0.7,
        ctaButtons: {
            primary: 'Scroll to learn more',
            secondary: 'Sign up for our Newsletter',
        },
    },

    // Footer
    footer: {
        address: '123 State Capitol Boulevard, Oklahoma City, OK 73102',
        phone: '(555) 123-4567',
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

    schema: 'agency',

    elastic: {
        agentId: null,
    },

    search: {
        defaultFilters: { state: 'Oklahoma' },
        preferences: { sortBy: 'deadline', sortOrder: 'ASC' },
    },

    news: [
        {
            category: 'Economic Development',
            title: 'New Business Incentive Program Launches',
            description: 'State program offers grants and tax incentives to support small business growth and job creation.',
            image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80',
        },
        {
            category: 'Community',
            title: 'Rural Communities Receive Infrastructure Grants',
            description: 'Funding will improve broadband access and local infrastructure in underserved areas.',
            image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80',
        },
        {
            category: 'Workforce',
            title: 'Workforce Development Initiative Expands',
            description: 'Partnership with local colleges will train workers for high-demand industries.',
            image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
        },
    ],
};
