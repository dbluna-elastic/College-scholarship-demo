/**
 * Oklahoma Template Configuration
 * Branding and content specific to Oklahoma
 */
export const oklahomaTemplate = {
    id: 'oklahoma',
    name: 'Oklahoma',
    
    // Branding
    branding: {
        institutionName: 'Oklahoma College Scholarship Portal',
        tagline: 'Supporting Oklahoma Students in Their Educational Journey',
        logo: '/logo-oklahoma.svg',
    },
    
    // Content
    content: {
        heroTitle: 'Oklahoma Scholarship Opportunities',
        heroSubtitle: 'Discover financial aid programs and scholarships available to Oklahoma residents',
        ctaText: 'Find Scholarships',
        ctaSecondary: 'Check Eligibility',
        // State-specific content
        stateName: 'Oklahoma',
        stateAbbreviation: 'OK',
        welcomeMessage: 'Welcome to the Oklahoma Scholarship Portal',
    },
    
    // Color Palette - Oklahoma-themed (Crimson & Cream)
    colors: {
        primary: '#841617',      // Oklahoma Crimson
        secondary: '#FDF9D8',    // Cream (light, use sparingly)
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
