import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            // Proxy for Elasticsearch direct searches (ES endpoint)
            '/api/elastic/es': {
                target: 'https://apex-dec2025-group4-b01431.es.us-central1.gcp.elastic.cloud',
                changeOrigin: true,
                rewrite: (path) => {
                    // Remove /api/elastic/es prefix
                    return path.replace(/^\/api\/elastic\/es/, '');
                },
                configure: (proxy, options) => {
                    proxy.on('error', (err, req, res) => {
                        console.error('ES Proxy error:', err);
                    });
                }
            },
            // Proxy for Kibana/Agent Builder API
            '/api/elastic': {
                target: 'https://apex-dec2025-group4-b01431.kb.us-central1.gcp.elastic.cloud',
                changeOrigin: true,
                rewrite: (path) => {
                    // Map agent chat endpoint to Elastic Agent Builder API
                    // /api/elastic/agent/{agent_id}/chat -> /api/agent_builder/converse
                    const agentMatch = path.match(/^\/api\/elastic\/agent\/([^\/]+)\/chat$/);
                    if (agentMatch) {
                        // Agent Builder API endpoint
                        return '/api/agent_builder/converse';
                    }
                    // For other paths, just remove /api/elastic prefix
                    return path.replace(/^\/api\/elastic/, '');
                },
                // Add error handling
                configure: (proxy, options) => {
                    proxy.on('error', (err, req, res) => {
                        console.error('Proxy error:', err);
                    });
                }
            }
        }
    }
});
