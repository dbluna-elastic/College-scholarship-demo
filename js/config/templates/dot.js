/**
 * Department of Transportation (DOT) — state agency template
 * Landing pattern inspired by large DOT public sites (hero, featured line, quick tiles, program bar, news).
 * Copy and imagery are intentionally generic, not tied to a single state.
 * Schema: agency (Citizen / Case Worker / Status).
 */
export const dotTemplate = {
    id: 'dot',
    name: 'Department of Transportation',

    schema: 'agency',

    branding: {
        institutionName: 'Department of Transportation',
        tagline: 'Safe roads. Reliable information. Stronger connections.',
        logo: '/logo-dot.svg',
    },

    content: {
        heroTitle: 'Connecting people, freight, and communities',
        heroSubtitle: 'Official maps, permits, project news, and travel information in one place.',
        ctaText: 'Explore services',
        ctaSecondary: 'Email updates',
        stateName: 'Demo State',
        stateAbbreviation: 'DS',
        welcomeMessage: 'Welcome to the Department of Transportation',
        mainHeading: 'News, projects, and programs',
        mainTagline: 'PLAN AHEAD · STAY INFORMED · ARRIVE SAFELY',
        blueBar: {
            newsletterText: 'Sign up for traffic alerts and agency news',
            scrollPromptText: 'Scroll for popular services',
        },
        promoBar: {
            text: 'View the statewide transportation improvement program and current letting',
            href: '#projects',
        },
        dotLanding: {
            skipToContent: 'Skip to main content',
            tileCta: 'Open',
            featuredBanner: {
                eyebrow: 'Traveler information',
                title: 'Lane closures, detours, and major project schedules are updated regularly.',
                subtitle: 'Check conditions before long trips or peak commute times.',
                linkText: 'Roadwork and corridor updates',
                href: '#projects',
            },
            quickTiles: [
                {
                    label: 'Maps & guides',
                    description: 'Official highway maps, district offices, and corridor resources.',
                    href: '#maps',
                },
                {
                    label: 'Road conditions',
                    description: 'Incidents, weather-related impacts, and planned restrictions.',
                    href: '#conditions',
                },
                {
                    label: 'Permits & compliance',
                    description: 'Commercial vehicle permits, utilities, and construction access.',
                    href: '#permits',
                },
                {
                    label: 'Data & safety',
                    description: 'Crash statistics, dashboards, and work zone safety materials.',
                    href: '#data',
                },
            ],
            spotlight: {
                title: 'Safety is a shared responsibility',
                body: 'Slow down in work zones, move over for stopped vehicles, and give crews room to work.',
                linkText: 'Driver and work zone safety',
                href: '#safety',
            },
        },
    },

    colors: {
        primary: '#003366',
        secondary: '#1b5e20',
        accent: '#0369a1',
        charcoal: '#0f172a',
        warning: '#b45309',
        bgBase: '#0b1220',
        bgSurface: '#0f2942',
    },

    typography: {
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        headingWeight: '900',
        headingTracking: '-0.05em',
    },

    navigation: {
        links: [
            { label: 'Travel', href: '#conditions' },
            { label: 'Projects', href: '#projects' },
            { label: 'Permits', href: '#permits' },
            { label: 'Maps & data', href: '#maps' },
            { label: 'About', href: '#about' },
            { label: 'Contact', href: '#contact' },
        ],
    },

    hero: {
        backgroundImage:
            'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1920&q=80',
        mainHeading: 'Connecting your state',
        subHeading:
            'Reliable roads and bridges, transparent project information, and tools that keep people and freight moving.',
        ctaButtons: {
            primary: 'Explore services',
            secondary: 'Email updates',
        },
    },

    footer: {
        address: 'State Transportation Building, 100 Capitol Mall, Capital City',
        phone: '(555) 555-0100',
        quickLinks: [
            { label: 'Public records', href: '#records' },
            { label: 'Careers', href: '#employment' },
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
            state: 'Demo State',
        },
        preferences: {
            sortBy: 'deadline',
            sortOrder: 'ASC',
        },
    },

    news: [
        {
            category: 'Projects',
            title: 'Major interchange modernization enters construction',
            description:
                'Lane configurations will change in phases; signed detours and digital message boards will guide drivers.',
            image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80',
        },
        {
            category: 'Safety',
            title: 'Work zone awareness campaign rolls out statewide',
            description:
                'New public service announcements highlight speed limits, following distance, and night visibility.',
            image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80',
        },
        {
            category: 'Grants',
            title: 'Local match program opens for bridge and pavement preservation',
            description:
                'Cities and counties can apply for cost-shared awards focused on rural corridors and freight routes.',
            image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80',
        },
    ],
};
