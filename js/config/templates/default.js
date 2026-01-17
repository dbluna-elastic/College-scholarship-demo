/**
 * Default Template Configuration
 * Fallback values used when no specific template is matched
 */
export const defaultTemplate = {
    id: 'default',
    name: 'Default',
    
    // Branding
    branding: {
        institutionName: 'College Scholarship Portal',
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
    
    // Elastic Configuration
    elastic: {
        agentId: null,  // Will be set from environment or template-specific config
    },
};
