/**
 * Texas Template Configuration
 * Branding and content specific to Texas
 */
export const texasTemplate = {
    id: 'texas',
    name: 'Texas',
    
    // Branding
    branding: {
        institutionName: 'Texas College Scholarship Portal',
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
    
    // Elastic Configuration
    elastic: {
        agentId: null,  // Can be overridden via environment variable
    },
};
