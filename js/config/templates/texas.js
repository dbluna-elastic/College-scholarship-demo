/**
 * Texas Template Configuration
 * Branding and content specific to Texas
 */
export const texasTemplate = {
    id: 'texas',
    name: 'Texas',
    
    // Branding
    branding: {
        institutionName: 'Brazos Valley State University',
        tagline: 'Empowering Texas Students to Achieve Their Dreams',
        logo: '/logo-texas.svg',
    },
    
    // Content
    content: {
        heroTitle: 'Texas Scholarship Opportunities',
        heroSubtitle: 'Access state-specific financial aid and scholarship programs designed for Texas students',
        ctaText: 'Explore Scholarships',
        ctaSecondary: 'View Requirements',
        // State-specific content
        stateName: 'Texas',
        stateAbbreviation: 'TX',
        welcomeMessage: 'Welcome to the Texas Scholarship Portal',
    },
    
    // Color Palette - Texas-themed (Deep Blue & Orange accents)
    colors: {
        primary: '#003087',      // Texas Blue
        secondary: '#BF5700',     // Burnt Orange
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
        mainHeading: 'THE STATE WAY',
        subHeading: 'Moving Forward. Together.',
        ctaButtons: {
            primary: 'Apply Now',
            secondary: 'Visit Campus',
        },
    },
    
    // Footer
    footer: {
        address: '123 University Avenue, Austin, TX 78701',
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
    
    schema: 'school',

    // Elastic Configuration
    elastic: {
        agentId: 'texas-scholarship-counselor',
    },
    
    // Search Configuration
    search: {
        defaultFilters: {
            state: 'Texas',  // Default to Texas for this template
        },
        preferences: {
            sortBy: 'deadline',
            sortOrder: 'ASC',
        },
    },
};
