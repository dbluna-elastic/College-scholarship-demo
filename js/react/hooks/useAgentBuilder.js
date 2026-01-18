/**
 * useAgentBuilder - React hook for Elastic Agent Builder
 * 
 * Manages conversation state, handles chat and search interactions,
 * and integrates with template system for agent ID.
 */

import { useState, useCallback, useRef } from 'react';
import { fetchAgentChat, fetchAgentSearch } from '../../modules/utils/elasticApi.js';

/**
 * Custom hook for Agent Builder interactions
 * 
 * @param {string} agentId - Agent ID from template or environment
 * @returns {Object} Hook state and methods
 */
export function useAgentBuilder(agentId) {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const conversationIdRef = useRef(null);

    /**
     * Send a chat message to the agent
     */
    const sendMessage = useCallback(async (message) => {
        if (!message || !message.trim()) {
            return;
        }

        if (!agentId) {
            setError('Agent ID is not configured');
            return;
        }

        // Add user message to state
        const userMessage = {
            role: 'user',
            content: message,
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setError(null);

        try {
            // Retry logic: attempt up to 3 times
            let lastError;
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    const response = await fetchAgentChat(
                        agentId,
                        message,
                        conversationIdRef.current
                    );

                    // Extract conversation ID if provided
                    if (response.conversation_id) {
                        conversationIdRef.current = response.conversation_id;
                    }

                    // Extract agent response (response.output is set by fetchAgentChat)
                    const agentMessage = {
                        role: 'assistant',
                        content: response.output || response.message || response.response || JSON.stringify(response),
                        timestamp: new Date().toISOString(),
                    };

                    setMessages(prev => [...prev, agentMessage]);
                    setIsLoading(false);
                    return;
                } catch (err) {
                    lastError = err;
                    if (attempt < 3) {
                        // Wait before retry (exponential backoff)
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                    }
                }
            }

            // All retries failed
            throw lastError;
        } catch (err) {
            console.error('Agent Builder error:', err);
            setError(err.message || 'Failed to get response from agent');
            setIsLoading(false);

            // Add error message to chat
            const errorMessage = {
                role: 'error',
                content: `Error: ${err.message || 'Failed to get response'}`,
                timestamp: new Date().toISOString(),
            };
            setMessages(prev => [...prev, errorMessage]);
        }
    }, [agentId]);

    /**
     * Perform a search using the agent
     */
    const performSearch = useCallback(async (query) => {
        return sendMessage(`Search for: ${query}`);
    }, [sendMessage]);

    /**
     * Clear conversation history
     */
    const clearConversation = useCallback(() => {
        setMessages([]);
        conversationIdRef.current = null;
        setError(null);
    }, []);

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        performSearch,
        clearConversation,
        conversationId: conversationIdRef.current,
    };
}
