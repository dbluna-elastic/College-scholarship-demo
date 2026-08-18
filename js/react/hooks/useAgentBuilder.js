/**
 * useAgentBuilder - React hook for Elastic Agent Builder
 *
 * Supports hybrid ESQL fast path, SSE streaming, step status, and single retry on 5xx.
 */

import { useState, useCallback, useRef } from 'react';
import { tryChatFastPath } from '../../modules/utils/chatFastPath.js';
import { fetchAgentChatStream, isRetryableAgentError } from '../../modules/utils/agentChatStream.js';

/**
 * @param {string} agentId - Agent ID from template or environment
 * @returns {Object} Hook state and methods
 */
export function useAgentBuilder(agentId) {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [stepStatus, setStepStatus] = useState(null);
    const [error, setError] = useState(null);
    const conversationIdRef = useRef(null);

    const updateAssistantMessage = useCallback((assistantId, updater) => {
        setMessages((prev) => prev.map((msg) => (
            msg.id === assistantId ? { ...msg, ...updater(msg) } : msg
        )));
    }, []);

    const appendErrorMessage = useCallback((err) => {
        const base = err.message || 'Failed to get response from agent';
        setError(base);
        setIsLoading(false);
        setStepStatus(null);

        let chatDetail = '';
        if (err.details && typeof err.details === 'string') {
            try {
                const j = JSON.parse(err.details);
                chatDetail =
                    j.error?.reason ||
                    j.error?.caused_by?.reason ||
                    j.message ||
                    '';
            } catch {
                chatDetail = err.details.length > 800 ? `${err.details.slice(0, 800)}…` : err.details;
            }
        }
        const content =
            chatDetail && !base.includes(chatDetail.slice(0, 80))
                ? `Error: ${base}\n\n${chatDetail}`
                : `Error: ${base}`;

        setMessages((prev) => [...prev, {
            id: `error-${Date.now()}`,
            role: 'error',
            content,
            timestamp: new Date().toISOString(),
        }]);
    }, []);

    const runAgentStream = useCallback(async (message, assistantId, attempt = 1) => {
        try {
            const response = await fetchAgentChatStream(
                agentId,
                message,
                conversationIdRef.current,
                {
                    onStep: (status) => setStepStatus(status),
                    onChunk: (chunk) => {
                        setStepStatus(null);
                        updateAssistantMessage(assistantId, (msg) => ({
                            content: `${msg.content || ''}${chunk}`,
                            streaming: true,
                        }));
                    },
                }
            );

            if (response.conversation_id) {
                conversationIdRef.current = response.conversation_id;
            }

            updateAssistantMessage(assistantId, () => ({
                content: response.output,
                streaming: false,
            }));
            setIsLoading(false);
            setStepStatus(null);
        } catch (err) {
            if (attempt === 1 && isRetryableAgentError(err)) {
                setStepStatus('Retrying…');
                await new Promise((resolve) => setTimeout(resolve, 800));
                return runAgentStream(message, assistantId, 2);
            }
            throw err;
        }
    }, [agentId, updateAssistantMessage]);

    /**
     * @param {string} message
     * @param {{ skipFastPath?: boolean }} [options]
     */
    const sendMessage = useCallback(async (message, options = {}) => {
        if (!message || !message.trim()) return;
        if (!agentId) {
            setError('Agent ID is not configured');
            return;
        }

        const userMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: message,
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);
        setError(null);
        setStepStatus(options.skipFastPath ? 'Asking the assistant…' : 'Checking for a quick answer…');

        try {
            if (!options.skipFastPath) {
                const fastPath = await tryChatFastPath(agentId, message);
                if (fastPath?.output) {
                    setMessages((prev) => [...prev, {
                        id: `assistant-fast-${Date.now()}`,
                        role: 'assistant',
                        content: fastPath.output,
                        timestamp: new Date().toISOString(),
                        fastPath: true,
                    }]);
                    setIsLoading(false);
                    setStepStatus(null);
                    return;
                }
            }

            const assistantId = `assistant-${Date.now()}`;
            setMessages((prev) => [...prev, {
                id: assistantId,
                role: 'assistant',
                content: '',
                timestamp: new Date().toISOString(),
                streaming: true,
            }]);

            await runAgentStream(message, assistantId);
        } catch (err) {
            console.error('Agent Builder error:', err);
            appendErrorMessage(err);
        }
    }, [agentId, appendErrorMessage, runAgentStream]);

    const performSearch = useCallback(async (query) => {
        return sendMessage(`Search for: ${query}`);
    }, [sendMessage]);

    const clearConversation = useCallback(() => {
        setMessages([]);
        conversationIdRef.current = null;
        setError(null);
        setStepStatus(null);
    }, []);

    return {
        messages,
        isLoading,
        stepStatus,
        error,
        sendMessage,
        performSearch,
        clearConversation,
        conversationId: conversationIdRef.current,
    };
}
