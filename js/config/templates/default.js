/**
 * Default Template Configuration
 * Fallback values used when no specific template is matched
 */
export const defaultTemplate = {
    id: 'default',
    name: 'Default',
    
    // Branding
    branding: {
        institutionName: 'Generic State University',
        tagline: 'Find Your Path to Higher Education',
        logo: '/logo-default.svg',
    },
    
    // Content
    content: {
        heroTitle: 'Discover Your Scholarship Opportunities',
        heroSubtitle: 'Connect with financial aid resources tailored to your needs',
        ctaText: 'Get Started',
        ctaSecondary: 'Learn More',
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
        address: '123 University Avenue, City, State 12345',
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
    
    // Color Palette (CSS Variables)
    colors: {
        primary: '#5D5FEF',      // Indigo
        secondary: '#B794F4',     // Purple
        warning: '#FF4F00',      // Orange
        bgBase: '#0B0B0B',       // Dark background
        bgSurface: '#161616',    // Card/surface background
    },
    
    // Typography
    typography: {
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        headingWeight: '900',    // font-black
        headingTracking: '-0.05em', // tracking-tighter
    },
    
    // Schema: school (Student/Counselor/GPA) vs agency (Citizen/Case Worker/Status)
    schema: 'school',

    // Elastic Configuration
    elastic: {
        agentId: null,  // Will be set from environment or template-specific config
    },
    
    // Search Configuration
    search: {
        defaultFilters: {
            state: null,  // No default state filter for generic template
        },
        preferences: {
            sortBy: 'deadline',
            sortOrder: 'ASC',
        },
    },
};
