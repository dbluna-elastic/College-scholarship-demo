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
   - Open http://localhost:8080 in your browser
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
│   ├── main.js                    # Main entry point
│   └── modules/
│       └── utils/
│           └── getEnvVar.js       # Environment variable helper
├── index.html                     # Main HTML file
├── style.css                      # Custom styles
├── vite.config.js                 # Vite configuration with proxy routes
├── Dockerfile                     # Multi-stage Docker build
├── docker-compose.yml             # Docker Compose configuration
├── nginx.conf                     # Nginx configuration for production
└── docker-entrypoint.sh           # Entrypoint script for env injection
```

### Architecture Notes

- **Environment Variables**: Use `getEnvVar(key, defaultValue)` helper to safely access env vars
- **Proxy Routes**: Vite dev server and Nginx production server both proxy `/api/elastic/*` routes to Elastic Cloud
- **Zero-Credentials Policy**: Never hardcode API keys or secrets in code