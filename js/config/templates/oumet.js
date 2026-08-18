/**
 * OU School of Meteorology — THREDDS catalog & data provisioning template.
 */
export const oumetTemplate = {
    id: 'oumet',
    name: 'OU Meteorology',

    branding: {
        institutionName: 'OU School of Meteorology',
        tagline: 'Operational data catalog for researchers',
        logo: '/ou-met-logo.svg',
    },

    content: {
        heroTitle: 'Meteorology Data Catalog',
        heroSubtitle: 'Search GFS, HRRR, NAM, NEXRAD, and case-study datasets from the OU THREDDS catalog',
        ctaText: 'Search the Catalog',
        ctaSecondary: 'Talk to Catalog Assistant',
        stateName: 'Oklahoma',
        stateAbbreviation: 'OK',
        welcomeMessage: 'Welcome to the OU Meteorology Data Catalog',
        chatBubbleText: 'Ask about weather datasets',
        chatAssistantTitle: 'OU Met Catalog Assistant',
        chatAssistantSubtitle: 'Find datasets, OPeNDAP URLs, and delivery ETAs',
        chatAssistantEmptyBody: 'Ask about GFS reanalysis, live HRRR, NEXRAD reflectivity, or restricted research data.',
        chatAssistantEmptyTry: 'Tap * below for demo queries',
        chat: {
            layout: 'centered',
            samplePromptsByAgent: {
                'ou-met-catalog-agent': [
                    { label: 'HRRR live files', prompt: 'What HRRR files are available for today?' },
                    { label: 'GFS reanalysis', prompt: 'I need GFS reanalysis for September 2017' },
                    { label: 'NEXRAD Irma case', prompt: 'I need NEXRAD reflectivity from Hurricane Irma 2017' },
                    { label: 'CCS034 restricted', prompt: 'I need CCS034 research data' },
                    { label: 'Catalog summary', prompt: 'Give me a catalog and provisioning summary' },
                    { label: 'Thesis plan', prompt: 'Recommend a research plan if I need both live convection and a 2017 hurricane analog.', skipFastPath: true },
                    { label: 'Deadline tradeoff', prompt: 'Compare auto-mount versus approval-required delivery for a thesis deadline next week.', skipFastPath: true },
                    { label: 'Subset radar', prompt: 'How should I subset Oklahoma NEXRAD so I am not pulling the whole archive?', skipFastPath: true },
                    { label: 'Storm-scale vars', prompt: 'What variables should a storm-scale case study request besides reflectivity?', skipFastPath: true },
                    { label: 'Fallback datasets', prompt: 'If CCS034 is delayed, what public catalog datasets can I start with?', skipFastPath: true },
                ],
                'ou-met-provisioning-agent': [
                    { label: 'Pending queue', prompt: 'Show pending provisioning requests' },
                    { label: 'Awaiting permission', prompt: 'Which requests are awaiting permission?' },
                    { label: 'In progress', prompt: 'What is provisioning right now?' },
                    { label: 'Failed mounts', prompt: 'What mounts failed today?' },
                    { label: 'Unblocking researchers', prompt: 'Which wait times look unacceptable, and what should ops do first?', skipFastPath: true },
                    { label: 'Where is the bottleneck', prompt: 'Compare failed mounts versus permission delays and recommend an ops response.', skipFastPath: true },
                    { label: 'ETA language', prompt: 'Recommend an SLA message for a researcher still waiting on an auto-mount.', skipFastPath: true },
                    { label: 'Review priority', prompt: 'If two restricted datasets are waiting, how should Sean and Corey prioritize?', skipFastPath: true },
                ],
            },
        },
        promoBar: {
            text: 'THREDDS catalog metadata indexed in Elasticsearch — live OPeNDAP, auto-mount, and approval workflows.',
            href: '#catalog',
        },
        staffDashboard: {
            pageTitle: 'Data Provisioning Operations',
            subtitle:
                'Monitor mount requests, approval queues, and delivery status from provisioning-requests on the Gawdzilla Elastic deployment.',
            tabs: {
                queue: 'Provisioning Queue',
                ops: 'Ops Assistant',
            },
        },
        researcherDashboard: {
            pageTitle: 'My Data Access',
            subtitle: 'Track dataset mounts and delivery status for your research VM.',
            demoResearcherId: 'grad-avery',
            demoResearcherName: 'Avery Nguyen',
            demoResearcherEmail: 'avery.nguyen@ou.edu',
            demoTargetVm: 'researcher-vm-11.met.ou.edu',
            tabs: {
                requests: 'My Data Requests',
                catalog: 'Data Catalog',
            },
        },
    },

    colors: {
        primary: '#003366',
        secondary: '#4A90D9',
        accent: '#7EB6FF',
        warning: '#E65100',
        bgBase: '#0B0B0B',
        bgSurface: '#161616',
    },

    typography: {
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        headingWeight: '900',
        headingTracking: '-0.05em',
    },

    navigation: {
        hideScholarshipNav: true,
        links: [
            { label: 'Catalog', href: '#catalog' },
            { label: 'Research', href: '#research' },
            { label: 'THREDDS', href: 'https://data.nssl.noaa.gov/thredds/catalog.html' },
            { label: 'Contact', href: '#contact' },
            { label: 'About', href: '#about' },
        ],
    },

    hero: {
        backgroundImage: 'https://images.unsplash.com/photo-1592210454359-9043f067919b?w=1920&q=80',
        mainHeading: 'WEATHER DATA FOR RESEARCH',
        subHeading: 'Discover operational and reanalysis datasets with intelligent delivery — direct OPeNDAP, auto-mount, or approval workflows.',
        ctaButtons: {
            primary: 'Explore Catalog',
        },
    },

    footer: {
        address: '120 David L. Boren Blvd, Norman, OK 73072',
        phone: '(405) 325-6561',
        quickLinks: [
            { label: 'THREDDS Catalog', href: 'https://data.nssl.noaa.gov/thredds/catalog.html' },
            { label: 'OU Met', href: 'https://www.ou.edu/coe/meteorology' },
            { label: 'Kibana Dashboard', href: '#catalog-dashboard' },
            { label: 'Privacy', href: '#privacy' },
        ],
        socialMedia: [
            { platform: 'FB', href: '#facebook', label: 'Facebook' },
            { platform: 'TW', href: '#twitter', label: 'Twitter' },
            { platform: 'IG', href: '#instagram', label: 'Instagram' },
            { platform: 'LI', href: '#linkedin', label: 'LinkedIn' },
        ],
    },

    schema: 'school',

    schemaLabels: {
        dashboardStaff: 'Data Provisioning Operations',
        dashboardPrimary: 'My Data Access',
        primaryRole: 'researcher',
        staffRole: 'data ops',
    },

    elastic: {
        agentId: 'ou-met-catalog-agent',
        staffAgentId: 'ou-met-provisioning-agent',
        catalogAgentId: 'ou-met-catalog-agent',
        provisioningAgentId: 'ou-met-provisioning-agent',
        kibanaUrl: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
        indexes: {
            catalog: 'ou-met-catalog',
            provisioning: 'provisioning-requests',
        },
        dashboards: [
            {
                title: 'OU Met Catalog Explorer',
                id: 'ou-met-catalog-dashboard',
                section: 'catalog',
            },
        ],
        workflows: {
            provisionRequest: {
                workflowId: 'ou-met-submit-provision-request',
                toolId: 'ou-met-submit-provision-request',
            },
        },
        agents: {
            catalog: 'ou-met-catalog-agent',
            provisioning: 'ou-met-provisioning-agent',
        },
        jupyterlite: {
            url: 'https://jupyterlite.github.io/demo/lab/index.html',
            generatorUrl: '/api/notebook-generator',
            defaultBbox: {
                latMin: 33,
                latMax: 37,
                lonMin: -103,
                lonMax: -94,
            },
            defaultVariable: 'Temperature_surface',
        },
    },

    search: {
        defaultFilters: { data_tier: 'reanalysis' },
        preferences: { sortBy: 'temporal_start', sortOrder: 'DESC' },
    },

    news: [
        {
            category: 'Catalog',
            title: '260+ THREDDS Datasets Indexed in Elasticsearch',
            description: 'Live HRRR, GFS reanalysis, NEXRAD case studies, and restricted research collections are searchable by tier, variable, and date.',
            image: 'https://images.unsplash.com/photo-1592210454359-9043f067919b?w=800&q=80',
        },
        {
            category: 'Delivery',
            title: 'Auto-Mount Workflows Reduce Researcher Wait Time',
            description: 'Reanalysis and NEXRAD requests queue automatically with ETA notifications — no manual mount requests required.',
            image: 'https://images.unsplash.com/photo-1534088568595-a066f41045a9?w=800&q=80',
        },
        {
            category: 'Research',
            title: 'Hurricane Irma Case Study Data Available',
            description: 'NEXRAD reflectivity and model output from September 2017 case studies support graduate research and classroom labs.',
            image: 'https://images.unsplash.com/photo-1527482791421-269736160e3b?w=800&q=80',
        },
    ],

    login: {
        headline: 'Find datasets, track provisioning, and support researchers — all in one place.',
        ssoButtonLabel: 'Continue with campus SSO',
        features: [
            'Search the THREDDS metadata catalog by model, tier, and date',
            'Get direct OPeNDAP URLs for live model output',
            'Auto-queue reanalysis mounts with ETA notifications',
            'Manage approval-required research data requests',
            'Monitor the provisioning queue for Sean and Corey',
        ],
    },
};
