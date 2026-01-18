/**
 * Elastic API Utilities
 * 
 * Provides proxy-based fetch calls for Elastic Agent Builder and ESQL queries.
 * All requests go through the configured proxy routes (/api/elastic/*)
 * 
 * Security: API keys are never logged in full (use maskValue)
 */

import { getEnvVar } from './getEnvVar.js';
import { maskValue } from './maskValue.js';
import { tracedFetch } from './tracingHelpers.js';

/**
 * Gets the Elastic API key from environment
 * @returns {string} API key or empty string
 */
function getApiKey() {
    const apiKey = getEnvVar('ELASTIC_API_KEY', '');
    // Debug: Log if API key is missing (but don't log the actual key)
    if (!apiKey && typeof window !== 'undefined') {
        console.warn('ELASTIC_API_KEY not found. window.env:', window.env ? Object.keys(window.env) : 'not defined');
    }
    return apiKey;
}

/**
 * Creates Authorization header for Elastic API requests
 * @param {boolean} includeKbnXsrf - Whether to include kbn-xsrf header (for Kibana/Agent Builder)
 * @returns {Object} Headers object with Authorization
 */
function createAuthHeaders(includeKbnXsrf = false) {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.warn('ELASTIC_API_KEY not found in environment');
        return {};
    }
    
    const headers = {
        'Authorization': `ApiKey ${apiKey}`,
        'Content-Type': 'application/json',
    };
    
    if (includeKbnXsrf) {
        headers['kbn-xsrf'] = 'true';
    }
    
    return headers;
}

/**
 * Executes an ESQL query via the Elasticsearch proxy
 * 
 * @param {string} query - ESQL query string
 * @param {Object} params - Optional query parameters
 * @returns {Promise<Object>} Query results
 */
export async function fetchESQLQuery(query, params = {}) {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('ELASTIC_API_KEY is required for ESQL queries');
    }

    const maskedKey = maskValue(apiKey);
    console.log('Executing ESQL query:', { query: query.substring(0, 100) + '...', apiKey: maskedKey });

    try {
        // ESQL endpoint: /_query (nginx will rewrite /api/elastic/es/_query to /_query)
        const response = await tracedFetch('/api/elastic/es/_query', {
            method: 'POST',
            headers: createAuthHeaders(),
            body: JSON.stringify({
                query,
                ...params,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('ESQL query failed:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText.substring(0, 200),
            });
            throw new Error(`ESQL query failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('ESQL query successful:', { resultCount: data.values?.length || 0 });
        return data;
    } catch (error) {
        console.error('ESQL query error:', error.message);
        throw error;
    }
}

/**
 * Sends a chat message to Elastic Agent Builder
 * 
 * @param {string} agentId - Agent ID from template or environment
 * @param {string} message - User message
 * @param {string} conversationId - Optional conversation ID for context
 * @returns {Promise<Object>} Agent response
 */
export async function fetchAgentChat(agentId, message, conversationId = null) {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('ELASTIC_API_KEY is required for Agent Builder');
    }

    if (!agentId) {
        throw new Error('Agent ID is required for chat');
    }

    const maskedKey = maskValue(apiKey);
    console.log('Sending Agent Builder chat:', {
        agentId: maskValue(agentId, 8),
        messageLength: message.length,
        hasConversationId: !!conversationId,
        apiKey: maskedKey,
    });

    try {
        // Payload format per Elastic Agent Builder API: agent_id and input
        const requestBody = {
            agent_id: agentId,
            input: message,
            ...(conversationId && { conversation_id: conversationId }),
        };

        const response = await tracedFetch(`/api/elastic/agent/${agentId}/chat`, {
            method: 'POST',
            headers: createAuthHeaders(true), // Include kbn-xsrf header
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Agent Builder chat failed:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText.substring(0, 200),
            });
            throw new Error(`Agent Builder chat failed: ${response.status} ${response.statusText}`);
        }

        const jsonData = await response.json();
        console.log('Agent Builder chat successful');
        
        // Extract response text from the API response structure
        // Response structure: { output: "...", conversation_id: "...", raw: { response: { message: "..." } } }
        const responseText = jsonData.output || jsonData.raw?.response?.message || jsonData.response?.message || jsonData.message || JSON.stringify(jsonData);
        
        // Return in format expected by the hook
        return {
            output: responseText,
            conversation_id: jsonData.conversation_id,
            raw: jsonData,
        };
    } catch (error) {
        console.error('Agent Builder chat error:', error.message);
        throw error;
    }
}

/**
 * Uses Agent Builder for search queries
 * 
 * @param {string} agentId - Agent ID from template or environment
 * @param {string} query - Search query
 * @returns {Promise<Object>} Search results
 */
export async function fetchAgentSearch(agentId, query) {
    // For search, we can use the chat endpoint with a search-formatted message
    const searchMessage = `Search for: ${query}`;
    return fetchAgentChat(agentId, searchMessage);
}

/**
 * Executes a standard Elasticsearch _search query via the proxy
 * 
 * @param {string} index - Elasticsearch index name
 * @param {Object} queryBody - Elasticsearch query body (RRF, standard query, etc.)
 * @returns {Promise<Object>} Search results
 */
export async function fetchElasticsearchSearch(index, queryBody) {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('ELASTIC_API_KEY is required for Elasticsearch searches');
    }

    const maskedKey = maskValue(apiKey);
    console.log('Executing Elasticsearch search:', {
        index,
        queryType: queryBody.retriever ? 'RRF' : 'standard',
        apiKey: maskedKey,
    });

    try {
        // Endpoint: /{index}/_search (nginx will rewrite /api/elastic/es/{index}/_search to /{index}/_search)
        const response = await tracedFetch(`/api/elastic/es/${index}/_search`, {
            method: 'POST',
            headers: createAuthHeaders(),
            body: JSON.stringify(queryBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Elasticsearch search failed:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText.substring(0, 200),
            });
            throw new Error(`Elasticsearch search failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Elasticsearch search successful:', {
            hits: data.hits?.total?.value || data.hits?.total || 0,
        });
        return data;
    } catch (error) {
        console.error('Elasticsearch search error:', error.message);
        throw error;
    }
}
