# College Scholarship Demo

Multi-tenant college scholarship application built with Vite, React, and Docker.

## Phase 1: Environment & Core Infrastructure

### Prerequisites
- Docker and Docker Compose installed
- Node.js 20+ (for local development)

### Quick Start

1. **Set up environment variables:**
   ```bash
   cp env.template .env
   # Edit .env and add your Elastic Cloud credentials
   ```

2. **Build and run with Docker:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Open http://localhost:8081 in your browser
   - You should see "Hello World" if everything is working

### Local Development (without Docker)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Access the application:**
   - Open http://localhost:5173 (default Vite port)

### Environment Variables

Required environment variables (see `env.template`):
- `ELASTIC_ES_URL` - Elasticsearch instance URL
- `ELASTIC_KB_URL` - Kibana instance URL
- `ELASTIC_API_KEY` - Elastic Cloud API key (never commit to git)
- `ELASTIC_AGENT_ID` - Optional Agent Builder agent ID

### Project Structure

```
├── js/
│   ├── main.js                    # Main entry point (orchestrates initialization)
│   ├── config/
│   │   ├── templateEngine.js      # Template switching logic
│   │   └── templates/
│   │       ├── default.js         # Default/fallback template
│   │       ├── texas.js           # Texas template
│   │       └── oklahoma.js        # Oklahoma template
│   ├── modules/                   # Vanilla JavaScript modules
│   │   ├── navigation.js          # Navigation module (vanilla)
│   │   ├── analytics.js           # Analytics module (vanilla)
│   │   └── utils/
│   │       └── getEnvVar.js      # Environment variable helper
│   └── react/                     # React components
│       ├── index.jsx              # React mount point
│       ├── App.jsx                # Main React component
│       └── context/
│           └── TemplateContext.jsx # Template context provider
├── index.html                     # Main HTML file
├── style.css                      # Custom styles
├── vite.config.js                 # Vite configuration with proxy routes
├── Dockerfile                     # Multi-stage Docker build
├── docker-compose.yml             # Docker Compose configuration
├── nginx.conf                     # Nginx configuration for production
└── docker-entrypoint.sh           # Entrypoint script for env injection
```

## Phase 2: Template Engine ✅

The template engine enables multi-tenant branding and content switching.

## Phase 3: Vanilla/React Hybrid Bridge ✅

The application uses a hybrid architecture combining vanilla JavaScript modules with React components.

### Architecture

- **Initialization Order**: Template Engine → Vanilla Modules → React App
- **State Sharing**: Template state shared via `window.currentTemplate` and React Context
- **Coexistence**: Vanilla modules handle DOM manipulation, React handles UI components

### Key Components

- **Vanilla Modules**: `navigation.js`, `analytics.js` (example modules)
- **React App**: `js/react/App.jsx` (main React component)
- **Template Context**: `js/react/context/TemplateContext.jsx` (shares template with React)

See [HYBRID_ARCHITECTURE.md](./HYBRID_ARCHITECTURE.md) for detailed architecture documentation.

### Template Detection

Templates are detected in this order:
1. URL parameter: `?template=texas`
2. Subdomain: `texas.example.com`
3. Environment variable: `TEMPLATE_ID=texas`
4. Default fallback

### Available Templates

- **default** - Generic fallback
- **texas** - Texas branding (Blue & Orange)
- **oklahoma** - Oklahoma branding (Crimson & Cream)

### Testing Templates

See [TEMPLATE_TESTING.md](./TEMPLATE_TESTING.md) for detailed testing instructions.

Quick test: Visit `http://localhost:8081?template=texas` to see Texas branding.

### Architecture Notes

- **Environment Variables**: Use `getEnvVar(key, defaultValue)` helper to safely access env vars
- **Template System**: Templates provide branding, content, colors, and Elastic configuration
- **CSS Variables**: Template colors are applied as CSS variables for dynamic theming
- **Proxy Routes**: Vite dev server and Nginx production server both proxy `/api/elastic/*` routes to Elastic Cloud
- **Zero-Credentials Policy**: Never hardcode API keys or secrets in code