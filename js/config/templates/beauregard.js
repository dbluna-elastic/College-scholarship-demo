/**
 * Beauregard Springs High School Template Configuration
 * Branding and content specific to Beauregard Springs High School
 * Mascot: The Jackalopes (Antlered Rabbit)
 * Theme: Fast, elusive, and just a little bit weird
 */
export const beauregardTemplate = {
    id: 'beauregard',
    name: 'Beauregard Springs High School',
    
    // Branding
    branding: {
        institutionName: 'Beauregard Springs High School',
        mascot: 'The Jackalopes',
        tagline: 'Fear the ears.',
        catchphrase: 'Fear the ears.',
        logo: '/logo-beauregard.svg',
    },
    
    // Content
    content: {
        heroTitle: 'Scholarship Opportunities for Beauregard Springs Jackalopes',
        heroSubtitle: 'Fast, elusive, and just a little bit weird. Discover financial aid programs and scholarships to support your educational journey',
        ctaText: 'Explore Scholarships',
        ctaSecondary: 'Learn More',
        welcomeMessage: 'Welcome to the Beauregard Springs High School Scholarship Portal',
        // Mascot and theme content
        mascotName: 'The Jackalopes',
        mascotDescription: 'Fast, elusive, and just a little bit weird',
        themeDescription: 'Where Texas Hill Country folklore meets academic excellence',
    },
    
    // Color Palette - Desert Tan and Sunset Orange (Texas Hill Country)
    colors: {
        primary: '#D2B48C',      // Desert Tan
        secondary: '#FF6B35',    // Sunset Orange
        warning: '#FF4F00',      // Orange
        bgBase: '#0B0B0B',
        bgSurface: '#161616',
    },
    
    // Typography
    typography: {
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        headingWeight: '900',
        headingTracking: '-0.05em',
    },
    
    // Navigation
    navigation: {
        links: [
            { label: 'News', href: '#news' },
            { label: 'Calendar', href: '#calendar' },
            { label: 'Contact', href: '#contact' },
            { label: 'About', href: '#about' },
            { label: 'Academics', href: '#academics' },
            { label: 'Admissions', href: '#admissions' },
        ],
    },
    
    // Hero Section
    hero: {
        backgroundImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1920&q=80',
        mainHeading: 'BEAUREGARD SPRINGS JACKALOPES',
        subHeading: 'Fear the ears.',
        ctaButtons: {
            primary: 'Apply Now',
            secondary: 'Visit Campus',
        },
    },
    
    // Footer
    footer: {
        address: '123 School Street, Beauregard Springs, TX 78624',
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
    
    // Elastic Configuration
    elastic: {
        agentId: null,  // Can be overridden via environment variable
    },
    
    // Search Configuration
    search: {
        defaultFilters: {
            state: 'Texas',  // Default to Texas for Hill Country location
        },
        preferences: {
            sortBy: 'deadline',
            sortOrder: 'ASC',
        },
    },
    
    // News Items - High School focused
    news: [
        {
            category: 'Athletics',
            title: 'Jackalopes Football Team Wins District Championship',
            description: 'Our varsity team secured their third consecutive district title with an impressive 42-14 victory last Friday night.',
            image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
        },
        {
            category: 'Academics',
            title: 'Science Fair Showcases Student Innovation',
            description: 'Over 50 students presented projects at our annual science fair, with three advancing to the regional competition.',
            image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80',
        },
        {
            category: 'Student Life',
            title: 'Homecoming Week Celebrations Begin',
            description: 'Spirit week kicks off with themed dress-up days, pep rally, and the annual homecoming dance this Saturday.',
            image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80',
        },
    ],
};
