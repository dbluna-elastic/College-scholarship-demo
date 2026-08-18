import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 8089,
        proxy: {
            '/api/notebook-generator': {
                target: 'http://localhost:8765',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/notebook-generator/, ''),
                configure: (proxy) => {
                    proxy.on('error', (err) => {
                        console.error('Notebook generator proxy error:', err);
                    });
                },
            },
            // Proxy for ok-fraud ESQL (gawdzilla Elasticsearch) – must be before /api/elastic/es
            '/api/elastic/ok-fraud/es': {
                target: 'https://gawdzilla-0d3e9e.es.us-east-2.aws.elastic-cloud.com:443',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/elastic\/ok-fraud\/es/, ''),
                configure: (proxy) => {
                    proxy.on('error', (err, req, res) => {
                        console.error('ok-fraud ESQL proxy error:', err);
                    });
                }
            },
            // Proxy for Elasticsearch direct searches (ES endpoint) — Gawdzilla (single-cluster default)
            '/api/elastic/es': {
                target: 'https://gawdzilla-0d3e9e.es.us-east-2.aws.elastic-cloud.com:443',
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
            // Proxy for ok-fraud Agent Builder (gawdzilla Kibana) – must be before general /api/elastic
            '/api/elastic/agent/ok-fraud/chat/stream': {
                target: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
                changeOrigin: true,
                rewrite: () => '/api/agent_builder/converse/async',
                configure: (proxy) => {
                    proxy.on('proxyRes', (proxyRes) => {
                        proxyRes.headers['cache-control'] = 'no-cache';
                    });
                    proxy.on('error', (err) => {
                        console.error('Agent Builder stream (ok-fraud) proxy error:', err);
                    });
                },
            },
            '/api/elastic/agent/ok-grants-data/chat/stream': {
                target: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
                changeOrigin: true,
                rewrite: () => '/api/agent_builder/converse/async',
                configure: (proxy) => {
                    proxy.on('proxyRes', (proxyRes) => {
                        proxyRes.headers['cache-control'] = 'no-cache';
                    });
                    proxy.on('error', (err) => {
                        console.error('Agent Builder stream (ok-grants-data) proxy error:', err);
                    });
                },
            },
            '/api/elastic/workflows': {
                target: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/elastic\/workflows/, '/api/workflows'),
                configure: (proxy) => {
                    proxy.on('error', (err) => {
                        console.error('Elastic Workflows proxy error:', err);
                    });
                },
            },
            '/api/elastic/booster-donor-data/tools/_execute': {
                target: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
                changeOrigin: true,
                rewrite: () => '/api/agent_builder/tools/_execute',
                configure: (proxy) => {
                    proxy.on('error', (err) => {
                        console.error('Agent Builder tool execute (booster-donor-data) proxy error:', err);
                    });
                },
            },
            '/api/elastic/ok-grants-data/tools/_execute': {
                target: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
                changeOrigin: true,
                rewrite: () => '/api/agent_builder/tools/_execute',
                configure: (proxy) => {
                    proxy.on('error', (err) => {
                        console.error('Agent Builder tool execute (ok-grants-data) proxy error:', err);
                    });
                },
            },
            '/api/elastic/ok-oja-data/tools/_execute': {
                target: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
                changeOrigin: true,
                rewrite: () => '/api/agent_builder/tools/_execute',
                configure: (proxy) => {
                    proxy.on('error', (err) => {
                        console.error('Agent Builder tool execute (ok-oja-data) proxy error:', err);
                    });
                },
            },
            '/api/elastic/agent/ok-oja-data/chat/stream': {
                target: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
                changeOrigin: true,
                rewrite: () => '/api/agent_builder/converse/async',
                configure: (proxy) => {
                    proxy.on('proxyRes', (proxyRes) => {
                        proxyRes.headers['cache-control'] = 'no-cache';
                    });
                    proxy.on('error', (err) => {
                        console.error('Agent Builder stream (ok-oja-data) proxy error:', err);
                    });
                },
            },
            '/api/elastic/agent/booster-donor-data/chat/stream': {
                target: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
                changeOrigin: true,
                rewrite: () => '/api/agent_builder/converse/async',
                configure: (proxy) => {
                    proxy.on('proxyRes', (proxyRes) => {
                        proxyRes.headers['cache-control'] = 'no-cache';
                    });
                    proxy.on('error', (err) => {
                        console.error('Agent Builder stream (booster-donor-data) proxy error:', err);
                    });
                },
            },
            '/api/elastic/agent/gameday-revenue-data/chat/stream': {
                target: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
                changeOrigin: true,
                rewrite: () => '/api/agent_builder/converse/async',
                configure: (proxy) => {
                    proxy.on('proxyRes', (proxyRes) => {
                        proxyRes.headers['cache-control'] = 'no-cache';
                    });
                    proxy.on('error', (err) => {
                        console.error('Agent Builder stream (gameday-revenue-data) proxy error:', err);
                    });
                },
            },
            '/api/elastic/agent/okstate-donor-assistant/chat/stream': {
                target: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
                changeOrigin: true,
                rewrite: () => '/api/agent_builder/converse/async',
                configure: (proxy) => {
                    proxy.on('proxyRes', (proxyRes) => {
                        proxyRes.headers['cache-control'] = 'no-cache';
                    });
                    proxy.on('error', (err) => {
                        console.error('Agent Builder stream (okstate-donor-assistant) proxy error:', err);
                    });
                },
            },
            '/api/elastic/agent/okstate-gameday-revenue-assistant/chat/stream': {
                target: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
                changeOrigin: true,
                rewrite: () => '/api/agent_builder/converse/async',
                configure: (proxy) => {
                    proxy.on('proxyRes', (proxyRes) => {
                        proxyRes.headers['cache-control'] = 'no-cache';
                    });
                    proxy.on('error', (err) => {
                        console.error('Agent Builder stream (okstate-gameday-revenue-assistant) proxy error:', err);
                    });
                },
            },
            '/api/elastic/agent/ou-met-catalog-agent/chat/stream': {
                target: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
                changeOrigin: true,
                rewrite: () => '/api/agent_builder/converse/async',
                configure: (proxy) => {
                    proxy.on('proxyRes', (proxyRes) => {
                        proxyRes.headers['cache-control'] = 'no-cache';
                    });
                    proxy.on('error', (err) => {
                        console.error('Agent Builder stream (ou-met-catalog-agent) proxy error:', err);
                    });
                },
            },
            '/api/elastic/agent/ou-met-provisioning-agent/chat/stream': {
                target: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
                changeOrigin: true,
                rewrite: () => '/api/agent_builder/converse/async',
                configure: (proxy) => {
                    proxy.on('proxyRes', (proxyRes) => {
                        proxyRes.headers['cache-control'] = 'no-cache';
                    });
                    proxy.on('error', (err) => {
                        console.error('Agent Builder stream (ou-met-provisioning-agent) proxy error:', err);
                    });
                },
            },
            '/api/elastic/gameday-revenue-data/tools/_execute': {
                target: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
                changeOrigin: true,
                rewrite: () => '/api/agent_builder/tools/_execute',
                configure: (proxy) => {
                    proxy.on('error', (err) => {
                        console.error('Agent Builder tool execute (gameday-revenue-data) proxy error:', err);
                    });
                },
            },
            '/api/elastic/agent/ok-fraud/chat': {
                target: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
                changeOrigin: true,
                rewrite: () => '/api/agent_builder/converse',
                configure: (proxy) => {
                    proxy.on('error', (err, req, res) => {
                        console.error('Agent Builder (ok-fraud) proxy error:', err);
                    });
                }
            },
            '/api/elastic/agent/ok-grants-data/chat': {
                target: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
                changeOrigin: true,
                rewrite: () => '/api/agent_builder/converse',
                configure: (proxy) => {
                    proxy.on('error', (err, req, res) => {
                        console.error('Agent Builder (ok-grants-data) proxy error:', err);
                    });
                }
            },
            '/api/elastic/agent/ok-oja-data/chat': {
                target: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
                changeOrigin: true,
                rewrite: () => '/api/agent_builder/converse',
                configure: (proxy) => {
                    proxy.on('error', (err, req, res) => {
                        console.error('Agent Builder (ok-oja-data) proxy error:', err);
                    });
                }
            },
            '/api/elastic/agent/booster-donor-data/chat': {
                target: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
                changeOrigin: true,
                rewrite: () => '/api/agent_builder/converse',
                configure: (proxy) => {
                    proxy.on('error', (err, req, res) => {
                        console.error('Agent Builder (booster-donor-data) proxy error:', err);
                    });
                }
            },
            '/api/elastic/agent/gameday-revenue-data/chat': {
                target: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
                changeOrigin: true,
                rewrite: () => '/api/agent_builder/converse',
                configure: (proxy) => {
                    proxy.on('error', (err, req, res) => {
                        console.error('Agent Builder (gameday-revenue-data) proxy error:', err);
                    });
                }
            },
            '/api/elastic/agent/okstate-donor-assistant/chat': {
                target: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
                changeOrigin: true,
                rewrite: () => '/api/agent_builder/converse',
                configure: (proxy) => {
                    proxy.on('error', (err, req, res) => {
                        console.error('Agent Builder (okstate-donor-assistant) proxy error:', err);
                    });
                }
            },
            '/api/elastic/agent/okstate-gameday-revenue-assistant/chat': {
                target: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
                changeOrigin: true,
                rewrite: () => '/api/agent_builder/converse',
                configure: (proxy) => {
                    proxy.on('error', (err, req, res) => {
                        console.error('Agent Builder (okstate-gameday-revenue-assistant) proxy error:', err);
                    });
                }
            },
            '/api/elastic/agent/ou-met-catalog-agent/chat': {
                target: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
                changeOrigin: true,
                rewrite: () => '/api/agent_builder/converse',
                configure: (proxy) => {
                    proxy.on('error', (err, req, res) => {
                        console.error('Agent Builder (ou-met-catalog-agent) proxy error:', err);
                    });
                }
            },
            '/api/elastic/agent/ou-met-provisioning-agent/chat': {
                target: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
                changeOrigin: true,
                rewrite: () => '/api/agent_builder/converse',
                configure: (proxy) => {
                    proxy.on('error', (err, req, res) => {
                        console.error('Agent Builder (ou-met-provisioning-agent) proxy error:', err);
                    });
                }
            },
            // Proxy for Kibana/Agent Builder API (default: Gawdzilla)
            '/api/elastic': {
                target: 'https://gawdzilla-0d3e9e.kb.us-east-2.aws.elastic-cloud.com',
                changeOrigin: true,
                rewrite: (path) => {
                    const streamMatch = path.match(/^\/api\/elastic\/agent\/([^\/]+)\/chat\/stream$/);
                    if (streamMatch) {
                        return '/api/agent_builder/converse/async';
                    }
                    const agentMatch = path.match(/^\/api\/elastic\/agent\/([^\/]+)\/chat$/);
                    if (agentMatch) {
                        return '/api/agent_builder/converse';
                    }
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
