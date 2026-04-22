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

/** Agent Builder agents served from gawdzilla (OK_KIBANA_URL / OK_KIBANA_API_KEY), not ELASTIC_KB_URL. */
const GAWDZILLA_AGENT_BUILDER_IDS = new Set(['ok-fraud', 'ok-grants-data']);

function usesGawdzillaAgentBuilder(agentId) {
    return Boolean(agentId && GAWDZILLA_AGENT_BUILDER_IDS.has(String(agentId)));
}

/** Best-effort summary from Kibana / Agent Builder error JSON or raw text (for UI and logs). */
function summarizeAgentBuilderErrorBody(errorText) {
    if (errorText == null || errorText === '') return '';
    const raw = String(errorText).trim();
    try {
        const j = JSON.parse(raw);
        const parts = [
            j.error?.reason,
            j.error?.caused_by?.reason,
            j.message,
            j.statusMessage,
            typeof j.error === 'string' ? j.error : null,
        ].filter(Boolean);
        if (parts.length) return parts.join(' — ');
    } catch {
        /* not JSON */
    }
    return raw.length > 600 ? `${raw.slice(0, 600)}…` : raw;
}

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
 * Gets the API key to use for a given agent. ok-fraud and okagency ok-grants-data Agent Builder use gawdzilla (OK_KIBANA_API_KEY).
 * @param {string} [agentId] - Agent ID; gawdzilla agents use OK_KIBANA_API_KEY if set
 * @returns {string} API key or empty string
 */
function getApiKeyForAgent(agentId) {
    if (usesGawdzillaAgentBuilder(agentId)) {
        const fraudKey = getEnvVar('OK_KIBANA_API_KEY', '');
        if (fraudKey) return fraudKey;
    }
    return getApiKey();
}

/**
 * Creates Authorization header for Elastic API requests
 * @param {boolean} includeKbnXsrf - Whether to include kbn-xsrf header (for Kibana/Agent Builder)
 * @param {string} [agentId] - Gawdzilla agents use OK_KIBANA_API_KEY for auth
 * @returns {Object} Headers object with Authorization
 */
function createAuthHeaders(includeKbnXsrf = false, agentId = '') {
    const apiKey = getApiKeyForAgent(agentId);
    if (!apiKey) {
        console.warn(
            usesGawdzillaAgentBuilder(agentId)
                ? 'OK_KIBANA_API_KEY (or ELASTIC_API_KEY) not found for gawdzilla Agent Builder'
                : 'ELASTIC_API_KEY not found in environment'
        );
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
 * @param {string} [agentId] - When 'ok-fraud', use OK_KIBANA_API_KEY for gawdzilla (e.g. ok-fraud-phantom-billing)
 * @returns {Promise<Object>} Query results
 */
export async function fetchESQLQuery(query, params = {}, agentId = '') {
    const apiKey = agentId ? getApiKeyForAgent(agentId) : getApiKey();
    if (!apiKey) {
        throw new Error(agentId === 'ok-fraud'
            ? 'OK_KIBANA_API_KEY (or ELASTIC_API_KEY) is required for ESQL queries to gawdzilla'
            : 'ELASTIC_API_KEY is required for ESQL queries');
    }

    const maskedKey = maskValue(apiKey);
    console.log('Executing ESQL query:', { query: query.substring(0, 100) + '...', apiKey: maskedKey });

    try {
        const esPath = agentId === 'ok-fraud' ? '/api/elastic/ok-fraud/es/_query' : '/api/elastic/es/_query';
        const response = await tracedFetch(esPath, {
            method: 'POST',
            headers: createAuthHeaders(false, agentId),
            body: JSON.stringify({
                query,
                ...params,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            const isIndexNotFound = response.status === 404;
            
            // Try to parse error as JSON for better formatting
            let errorDetails = errorText;
            try {
                const errorJson = JSON.parse(errorText);
                errorDetails = JSON.stringify(errorJson, null, 2);
            } catch (e) {
                // Keep as text if not JSON
            }
            
            console.error('ESQL query failed - Full error:', {
                status: response.status,
                statusText: response.statusText,
                isIndexNotFound,
                query: query.substring(0, 200), // Log the query that failed
                error: errorDetails,
            });
            
            // Create error with status code for better handling
            const error = new Error(`ESQL query failed: ${response.status} ${response.statusText}`);
            error.status = response.status;
            error.isIndexNotFound = isIndexNotFound;
            error.errorDetails = errorDetails; // Attach full error details
            throw error;
        }

        const data = await response.json();
        console.log('ESQL query successful:', { resultCount: data.values?.length || 0 });
        return data;
    } catch (error) {
        // Preserve error properties if already set
        if (error.status === undefined) {
            error.status = error.status || 500;
            error.isIndexNotFound = false;
        }
        console.error('ESQL query error:', {
            message: error.message,
            status: error.status,
            isIndexNotFound: error.isIndexNotFound,
        });
        throw error;
    }
}

/**
 * Elasticsearch _search via the ok-fraud (gawdzilla) proxy — same cluster as ok-fraud ESQL.
 *
 * @param {string} index - Index name (e.g. ok-grant-data)
 * @param {Object} queryBody - Request body for _search
 * @param {string} [agentId='ok-fraud'] - Must be ok-fraud for OK_ELASTIC_ES_URL proxy path
 * @returns {Promise<Object>} Parsed JSON response
 */
export async function fetchElasticsearchSearchWithAgent(index, queryBody, agentId = 'ok-fraud') {
    if (agentId !== 'ok-fraud') {
        throw new Error('fetchElasticsearchSearchWithAgent currently supports agentId ok-fraud only');
    }
    const apiKey = getApiKeyForAgent(agentId);
    if (!apiKey) {
        throw new Error('OK_KIBANA_API_KEY (or ELASTIC_API_KEY) is required for ok-grant-data search');
    }

    const maskedKey = maskValue(apiKey);
    console.log('Elasticsearch search (ok cluster):', {
        index,
        apiKey: maskedKey,
    });

    try {
        const response = await tracedFetch(`/api/elastic/ok-fraud/es/${encodeURIComponent(index)}/_search`, {
            method: 'POST',
            headers: createAuthHeaders(false, agentId),
            body: JSON.stringify(queryBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            const isIndexNotFound = response.status === 404;
            console.error('Elasticsearch search (ok cluster) failed:', {
                status: response.status,
                index,
                isIndexNotFound,
                error: errorText.substring(0, 200),
            });
            const error = new Error(`Elasticsearch search failed: ${response.status} ${response.statusText}`);
            error.status = response.status;
            error.isIndexNotFound = isIndexNotFound;
            error.index = index;
            throw error;
        }

        const data = await response.json();
        console.log('Elasticsearch search (ok cluster) ok:', {
            index,
            hits: data.hits?.total?.value ?? data.hits?.total ?? 0,
        });
        return data;
    } catch (error) {
        if (error.status === undefined) {
            error.status = error.status || 500;
            error.isIndexNotFound = false;
            error.index = index;
        }
        console.error('Elasticsearch search (ok cluster) error:', { index, message: error.message });
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
    const apiKey = getApiKeyForAgent(agentId);
    if (!apiKey) {
        throw new Error(
            usesGawdzillaAgentBuilder(agentId)
                ? 'OK_KIBANA_API_KEY is required for this agent (gawdzilla Agent Builder; add it to .env)'
                : 'ELASTIC_API_KEY is required for Agent Builder'
        );
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

        const response = await tracedFetch(`/api/elastic/agent/${encodeURIComponent(agentId)}/chat`, {
            method: 'POST',
            headers: createAuthHeaders(true, agentId), // kbn-xsrf; OK_KIBANA_API_KEY for gawdzilla agents
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            const summary = summarizeAgentBuilderErrorBody(errorText);
            console.error('Agent Builder chat failed:', {
                status: response.status,
                statusText: response.statusText,
                summary: summary || undefined,
                errorBodyPreview: errorText.substring(0, 2000),
            });
            const message = summary
                ? `Agent Builder chat failed: ${response.status} ${response.statusText} — ${summary}`
                : `Agent Builder chat failed: ${response.status} ${response.statusText}`;
            const err = new Error(message);
            err.status = response.status;
            err.details = errorText;
            throw err;
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
            const isIndexNotFound = response.status === 404;
            
            console.error('Elasticsearch search failed:', {
                status: response.status,
                statusText: response.statusText,
                index,
                isIndexNotFound,
                error: errorText.substring(0, 200),
            });
            
            // Create error with status code for better handling
            const error = new Error(`Elasticsearch search failed: ${response.status} ${response.statusText}`);
            error.status = response.status;
            error.isIndexNotFound = isIndexNotFound;
            error.index = index;
            throw error;
        }

        const data = await response.json();
        console.log('Elasticsearch search successful:', {
            index,
            hits: data.hits?.total?.value || data.hits?.total || 0,
        });
        return data;
    } catch (error) {
        // Preserve error properties if already set
        if (error.status === undefined) {
            error.status = error.status || 500;
            error.isIndexNotFound = false;
            error.index = index;
        }
        console.error('Elasticsearch search error:', {
            index,
            message: error.message,
            status: error.status,
            isIndexNotFound: error.isIndexNotFound,
        });
        throw error;
    }
}

/**
 * Updates a document in Elasticsearch via the proxy
 * 
 * @param {string} index - Elasticsearch index name
 * @param {string} documentId - Document ID to update
 * @param {Object} updateData - Data to update (will be wrapped in 'doc' for partial update)
 * @returns {Promise<Object>} Update result
 */
export async function fetchElasticsearchUpdate(index, documentId, updateData) {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('ELASTIC_API_KEY is required for Elasticsearch updates');
    }

    const maskedKey = maskValue(apiKey);
    console.log('Executing Elasticsearch update:', {
        index,
        documentId: maskValue(documentId, 8),
        fieldsCount: Object.keys(updateData).length,
        apiKey: maskedKey,
    });

    try {
        // Endpoint: /{index}/_update/{id} (nginx will rewrite /api/elastic/es/{index}/_update/{id} to /{index}/_update/{id})
        const response = await tracedFetch(`/api/elastic/es/${index}/_update/${documentId}`, {
            method: 'POST',
            headers: createAuthHeaders(),
            body: JSON.stringify({
                doc: updateData,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Elasticsearch update failed:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText.substring(0, 200),
            });
            throw new Error(`Elasticsearch update failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Elasticsearch update successful');
        return data;
    } catch (error) {
        console.error('Elasticsearch update error:', error.message);
        throw error;
    }
}
