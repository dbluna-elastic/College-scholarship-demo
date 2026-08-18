/**
 * Oklahoma Template Configuration
 * Branding and content specific to Oklahoma
 */
export const oklahomaTemplate = {
    id: 'oklahoma',
    name: 'Oklahoma',
    
    // Branding
    branding: {
        institutionName: 'Red River State University',
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
        chatAssistantEmptyTry: 'Tap * below for demo queries',
        chat: {
            samplePromptsByAgent: {
                'oklahoma-scholarship-counselor': [
                    { label: 'Oklahoma scholarships', prompt: 'What scholarships are available in Oklahoma?' },
                    { label: 'Residents', prompt: 'What aid is available for Oklahoma residents?' },
                    { label: 'STEM', prompt: 'What STEM scholarships are open in Oklahoma?' },
                    { label: 'Deadlines', prompt: 'When are Oklahoma scholarship deadlines?' },
                    { label: 'Need-based', prompt: 'What need-based aid is available at Red River State?' },
                    { label: 'Transfer strategy', prompt: 'Recommend a scholarship strategy for an Oklahoma resident transferring from community college.', skipFastPath: true },
                    { label: 'STEM vs need', prompt: 'Compare need-based versus merit options for a Red River sophomore in engineering.', skipFastPath: true },
                    { label: 'Late FAFSA', prompt: 'What should I do if I already filed FAFSA late?', skipFastPath: true },
                    { label: 'Average ACT', prompt: 'Which Oklahoma programs are still worth applying to if my ACT is average?', skipFastPath: true },
                    { label: 'Teaching shortlist', prompt: 'Help me build a shortlist if I want to stay in-state and become a teacher.', skipFastPath: true },
                ],
            },
        },
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
        address: '123 University Avenue, Norman, OK 73019',
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
        agentId: 'oklahoma-scholarship-counselor',
    },
    
    // Search Configuration
    search: {
        defaultFilters: {
            state: 'Oklahoma',  // Default to Oklahoma for this template
        },
        preferences: {
            sortBy: 'deadline',
            sortOrder: 'ASC',
        },
    },
};
