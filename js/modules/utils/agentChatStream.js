/**
 * SSE streaming client for Elastic Agent Builder /converse/async
 */

import { getApiKeyForAgent, usesGawdzillaAgentBuilder } from './elasticApi.js';

/** Human-readable labels for agent tool steps */
const TOOL_STEP_LABELS = {
    'booster-donor-portfolio-stats': 'Loading portfolio statistics…',
    'booster-at-risk-donors': 'Finding at-risk donors…',
    'booster-at-risk-major-gifts': 'Reviewing at-risk major gifts…',
    'booster-top-affinity-donors': 'Ranking top affinity donors…',
    'booster-donor-by-id': 'Looking up donor profile…',
    'booster-engagement-events-summary': 'Summarizing engagement events…',
    'booster-case-metrics': 'Loading at-risk case metrics…',
    'booster-alumni-email-workflow': 'Drafting alumni outreach email…',
    'ok-grants-portfolio-stats': 'Summarizing grant portfolio…',
    'ok-grants-search': 'Searching grant opportunities…',
    'ok-grants-by-status': 'Filtering grants by status…',
    'ok-grants-by-category': 'Finding grants by category…',
    'ok-grants-by-applicant': 'Finding eligible grants…',
    'ok-grants-deadlines': 'Checking upcoming deadlines…',
    'ok-grants-by-id': 'Looking up grant details…',
    'ok-fraud-ytd-loss': 'Calculating fraud exposure…',
    'ok-fraud-high-risk': 'Counting high-risk claims…',
    'ok-fraud-flagged-claims': 'Counting flagged claims…',
    'ok-fraud-loss-by-flag': 'Summarizing loss by flag type…',
    'ok-fraud-resolution-rate': 'Computing investigation resolution…',
    'ok-fraud-high-priority': 'Loading high-priority cases…',
    'ok-crisis-stats': 'Loading crisis call metrics…',
    'ok-clinical-relapse': 'Calculating relapse rate…',
    'oja-youth-stats': 'Summarizing supervision caseload…',
    'oja-high-risk-youth': 'Finding high-risk youth…',
    'oja-recidivism-summary': 'Computing recidivism rates…',
    'oja-youth-by-id': 'Looking up youth profile…',
    'oja-case-notes-search': 'Searching case notes…',
    'oja-county-caseload': 'Breaking down caseload by county…',
    'oja-supervisor-email-workflow': 'Drafting supervisor email…',
    'gameday-revenue-summary': 'Summarizing gameday ticket revenue…',
    'gameday-retail-summary': 'Summarizing team store retail revenue…',
    'gameday-retail-catalog': 'Loading 100-item stadium retail catalog…',
    'gameday-retail-by-category': 'Analyzing merchandise by category…',
    'gameday-top-retail-items': 'Ranking top-selling SKUs…',
    'gameday-retail-by-location': 'Loading team store locations…',
    'gameday-retail-by-sku': 'Looking up retail SKU…',
    'gameday-ticket-by-fan-tier': 'Analyzing fan tier ticket revenue…',
    'gameday-ticket-by-gate': 'Loading gate traffic…',
    'gameday-by-game-id': 'Looking up game retail sales…',
    'platform.core.search': 'Searching grant data…',
    'platform.core.generate_esql': 'Generating query…',
    'platform.core.get_document_by_id': 'Fetching document…',
};

/**
 * @param {string} toolId
 * @returns {string}
 */
export function getToolStepLabel(toolId) {
    if (!toolId) return 'Working on your question…';
    return TOOL_STEP_LABELS[toolId] || `Running ${toolId.replace(/^(booster-|gameday-|oja-)/, '').replace(/-/g, ' ')}…`;
}

/**
 * @param {Error & { status?: number }} err
 * @returns {boolean}
 */
export function isRetryableAgentError(err) {
    if (!err) return false;
    if (err.name === 'TypeError') return true;
    const status = err.status;
    return typeof status === 'number' && status >= 500 && status < 600;
}

/**
 * Parse SSE buffer into discrete events.
 * @param {string} buffer
 * @returns {{ events: Array<{ event: string, data: Object }>, remainder: string }}
 */
export function parseSseBuffer(buffer) {
    const events = [];
    const parts = buffer.split('\n\n');
    const remainder = parts.pop() ?? '';

    for (const part of parts) {
        if (!part.trim()) continue;
        let eventName = 'message';
        let dataLine = '';
        for (const line of part.split('\n')) {
            if (line.startsWith('event:')) eventName = line.slice(6).trim();
            if (line.startsWith('data:')) dataLine += line.slice(5).trim();
        }
        if (!dataLine) continue;
        try {
            events.push({ event: eventName, data: JSON.parse(dataLine) });
        } catch {
            /* skip malformed chunks */
        }
    }

    return { events, remainder };
}

/**
 * Stream agent chat via /converse/async (SSE).
 *
 * @param {string} agentId
 * @param {string} message
 * @param {string|null} conversationId
 * @param {Object} callbacks
 * @param {(status: string) => void} [callbacks.onStep]
 * @param {(chunk: string) => void} [callbacks.onChunk]
 * @param {(result: { output: string, conversation_id?: string }) => void} [callbacks.onComplete]
 * @returns {Promise<{ output: string, conversation_id?: string }>}
 */
export async function fetchAgentChatStream(agentId, message, conversationId, callbacks = {}) {
    const { onStep, onChunk, onComplete } = callbacks;
    const apiKey = getApiKeyForAgent(agentId);
    if (!apiKey) {
        throw new Error(
            usesGawdzillaAgentBuilder(agentId)
                ? 'OK_KIBANA_API_KEY is required for this agent (gawdzilla Agent Builder; add it to .env)'
                : 'ELASTIC_API_KEY is required for Agent Builder'
        );
    }

    const requestBody = {
        agent_id: agentId,
        input: message,
        ...(conversationId && { conversation_id: conversationId }),
    };

    const response = await fetch(`/api/elastic/agent/${encodeURIComponent(agentId)}/chat/stream`, {
        method: 'POST',
        headers: {
            Authorization: `ApiKey ${apiKey}`,
            'Content-Type': 'application/json',
            'kbn-xsrf': 'true',
            Accept: 'text/event-stream',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text();
        const err = new Error(`Agent Builder stream failed: ${response.status} ${response.statusText}`);
        err.status = response.status;
        err.details = errorText;
        throw err;
    }

    if (!response.body) {
        throw new Error('Agent Builder stream returned no body');
    }

    onStep?.('Planning next step…');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let output = '';
    let resultConversationId = conversationId || null;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parsed = parseSseBuffer(buffer);
        buffer = parsed.remainder;

        for (const { event, data } of parsed.events) {
            const payload = data?.data ?? data ?? {};

            if (event === 'conversation_id_set' && payload.conversation_id) {
                resultConversationId = payload.conversation_id;
            }

            if (event === 'reasoning') {
                if (payload.transient) {
                    onStep?.('Planning next step…');
                } else if (payload.tool_id) {
                    onStep?.(getToolStepLabel(payload.tool_id));
                } else if (payload.reasoning) {
                    onStep?.('Analyzing your question…');
                }
            }

            if (event === 'tool_call' && payload.tool_id) {
                onStep?.(getToolStepLabel(payload.tool_id));
            }

            if (event === 'tool_result') {
                onStep?.('Drafting response…');
            }

            if (event === 'thinking_complete') {
                onStep?.('Writing response…');
            }

            if (event === 'message_chunk' && payload.text_chunk) {
                output += payload.text_chunk;
                onChunk?.(payload.text_chunk);
            }

            if (event === 'message_complete' && payload.message) {
                output = payload.message;
            }
        }
    }

    const result = {
        output: output || 'No response received from agent.',
        conversation_id: resultConversationId || undefined,
    };
    onComplete?.(result);
    return result;
}
