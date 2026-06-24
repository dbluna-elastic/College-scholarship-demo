/**
 * ChatWidget - Chat interface component for Elastic Agent Builder
 * 
 * Provides a floating or inline chat widget with message history,
 * input field, and integration with useAgentBuilder hook.
 */

import { useState, useRef, useEffect } from 'react';
import { useAgentBuilder } from '../hooks/useAgentBuilder.js';
import { TemplateContext } from '../context/TemplateContext.jsx';
import { useContext } from 'react';
import { getEnvVar } from '../../modules/utils/getEnvVar.js';
import DonorChatMessage from './DonorChatMessage.jsx';

function ChatWidget({ floating = true, onClose, agentId: agentIdOverride, onDonorClick, openSignal = 0 }) {
    const template = useContext(TemplateContext);
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Get agent ID: override prop (e.g. ok-fraud on case-worker page) > template > env > default
    let agentId = agentIdOverride ?? template?.elastic?.agentId ?? getEnvVar('ELASTIC_AGENT_ID', '');
    
    // Correct the typo if present, or use default if empty
    if (agentId === 'studentcounsler') {
        agentId = 'studentcounselor';
        console.warn('Fixed agent ID typo: studentcounsler -> studentcounselor');
    }
    
    // Use default if still empty
    if (!agentId) {
        agentId = 'studentcounselor';
    }

    const content = template?.content || {};
    const chatTitle = content.chatAssistantTitle ?? 'Chat Assistant';
    const chatSubtitle =
        content.chatAssistantSubtitle ??
        (agentId === 'ok-fraud'
            ? 'Ask me about fraud detection and compliance'
            : agentId === 'booster-donor-data'
            ? 'Ask me about athletic booster and donor engagement data'
            : 'Ask me about scholarships');
    const chatEmptyBody =
        content.chatAssistantEmptyBody ??
        (agentId === 'ok-fraud'
            ? 'Ask about fraud indicators, investigations, or compliance.'
            : agentId === 'booster-donor-data'
            ? 'Ask about at-risk donors, major gifts, affinity scores, or engagement trends.'
            : 'Start a conversation by asking about scholarships!');
    const chatEmptyTry =
        content.chatAssistantEmptyTry ??
        (agentId === 'ok-fraud'
            ? 'Try: "What are common fraud indicators?"'
            : agentId === 'booster-donor-data'
            ? 'Try: "Who are our at-risk major gift donors?"'
            : 'Try: "What scholarships are available?"');

    const {
        messages,
        isLoading,
        stepStatus,
        error,
        sendMessage,
        clearConversation,
    } = useAgentBuilder(agentId);

    useEffect(() => {
        if (template?.id === 'okagency' && getEnvVar('ELASTIC_AGENT_ID', '').trim()) {
            console.warn(
                'ELASTIC_AGENT_ID is set: it overrides the template agent ID. Oklahoma Agency chat may use a different agent or nginx route than okagency.js configures.'
            );
        }
    }, [template?.id]);

    // Auto-scroll to bottom when new messages arrive or step status updates
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, stepStatus]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Parent can request chat open (e.g. "Chat with a Virtual Counselor" button)
    useEffect(() => {
        if (openSignal > 0) {
            setIsOpen(true);
        }
    }, [openSignal]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) {
            return;
        }

        const message = inputValue.trim();
        setInputValue('');
        await sendMessage(message);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    if (!agentId) {
        return null; // Don't render if no agent ID
    }

    const chatContent = (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div
                className="px-4 py-3 border-b flex items-center justify-between"
                style={{
                    backgroundColor: template?.colors?.primary || '#5D5FEF',
                    color: 'white',
                }}
            >
                <div>
                    <h3 className="font-semibold">{chatTitle}</h3>
                    <p className="text-xs opacity-90">{chatSubtitle}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={clearConversation}
                        className="p-1 hover:bg-white/20 rounded transition-colors"
                        title="Clear conversation"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                    <button
                        onClick={() => {
                            if (onClose) {
                                onClose();
                            } else if (floating) {
                                setIsOpen(false);
                            }
                        }}
                        className="p-1 hover:bg-white/20 rounded transition-colors"
                        title="Close chat"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 text-sm py-8">
                        <p>{chatEmptyBody}</p>
                        <p className="mt-2 text-xs">{chatEmptyTry}</p>
                    </div>
                )}

                {messages.map((message) => (
                    <div
                        key={message.id ?? message.timestamp}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                message.role === 'user'
                                    ? 'bg-blue-500 text-white'
                                    : message.role === 'error'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-white border border-gray-200 text-gray-900'
                            }`}
                        >
                            {message.role === 'assistant' && onDonorClick ? (
                                <div className="text-sm whitespace-pre-wrap">
                                    <DonorChatMessage
                                        content={message.content}
                                        onDonorClick={onDonorClick}
                                        primaryColor={template?.colors?.primary}
                                    />
                                </div>
                            ) : (
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            )}
                            {message.fastPath && (
                                <p className="text-[10px] uppercase tracking-wide opacity-60 mt-1">Instant data lookup</p>
                            )}
                            <p className="text-xs opacity-70 mt-1">
                                {new Date(message.timestamp).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                ))}

                {isLoading && stepStatus && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-dashed border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-600">
                            {stepStatus}
                        </div>
                    </div>
                )}

                {isLoading && !stepStatus && messages.some((m) => m.streaming && !m.content) && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-red-800 text-sm">
                        {error}
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="border-t bg-white p-4">
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isLoading}
                        className="px-6 py-2 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                        style={{
                            backgroundColor: template?.colors?.primary || '#5D5FEF',
                        }}
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );

    if (floating) {
        return (
            <>
                {/* Floating Button with Pulsing Animation */}
                {!isOpen && (
                    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
                        {/* Optional bubble text (e.g. okagency: "Can I help you find something?") */}
                        {template?.content?.chatBubbleText && (
                            <div
                                className="hidden sm:block px-4 py-3 rounded-2xl shadow-lg text-sm font-medium text-gray-800 bg-white border border-gray-200 max-w-[220px]"
                            >
                                {template.content.chatBubbleText}
                            </div>
                        )}
                        <div className="relative">
                            {/* Pulsing ring effect */}
                            <div 
                                className="absolute inset-0 rounded-full chatbot-pulse-ring"
                                style={{
                                    backgroundColor: template?.colors?.primary || '#5D5FEF',
                                }}
                            ></div>
                            <button
                                onClick={() => setIsOpen(true)}
                                className="relative w-20 h-20 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform chatbot-pulse-button"
                                style={{
                                    backgroundColor: template?.colors?.primary || '#5D5FEF',
                                }}
                                title="Open chat"
                            >
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* Floating Chat Window - Larger and More Prominent */}
                {isOpen && (
                    <>
                        {/* Backdrop overlay for focus */}
                        <div 
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                            onClick={() => setIsOpen(false)}
                        ></div>
                        <div className="fixed bottom-8 right-8 w-[550px] h-[750px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col border border-gray-200 transform transition-all duration-300">
                            {chatContent}
                        </div>
                    </>
                )}
            </>
        );
    }

    // Inline chat
    return (
        <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 h-[500px] flex flex-col">
            {chatContent}
        </div>
    );
}

export default ChatWidget;
