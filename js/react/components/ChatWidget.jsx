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
import ChatMarkdown from './ChatMarkdown.jsx';

/**
 * @param {unknown} prompts
 * @returns {{ label: string, prompt: string }[]}
 */
function normalizeSamplePrompts(prompts) {
    if (!Array.isArray(prompts)) return [];
    return prompts
        .map((item) => {
            if (typeof item === 'string') {
                const text = item.trim();
                return text ? { label: text, prompt: text, skipFastPath: false } : null;
            }
            const prompt = typeof item?.prompt === 'string' ? item.prompt.trim() : '';
            if (!prompt) return null;
            const label = typeof item?.label === 'string' && item.label.trim()
                ? item.label.trim()
                : prompt;
            return { label, prompt, skipFastPath: item.skipFastPath === true };
        })
        .filter(Boolean);
}

function ChatWidget({ floating = true, onClose, agentId: agentIdOverride, onDonorClick, openSignal = 0, chatContext = 'default', suggestedPrompts }) {
    const template = useContext(TemplateContext);
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [showSamplePrompts, setShowSamplePrompts] = useState(false);
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
    const gamedayAgentId = template?.elastic?.gamedayDataAgentId
        || template?.elastic?.agents?.gameday
        || 'gameday-revenue-data';
    const boosterAgentId = template?.elastic?.boosterDataAgentId
        || template?.elastic?.agents?.donors
        || 'booster-donor-data';
    const isGamedayAgent = agentId === gamedayAgentId || chatContext === 'gameday';
    const isBoosterAgent = agentId === boosterAgentId;
    const chatTitle = isGamedayAgent
        ? (content.gamedayChatAssistantTitle ?? 'Game Day Revenue Assistant')
        : (content.chatAssistantTitle ?? 'Chat Assistant');
    const chatSubtitle = isGamedayAgent
        ? (content.gamedayChatAssistantSubtitle ?? 'Ask about the 100-item team store catalog, top sellers, and merchandise revenue')
        : (content.chatAssistantSubtitle ??
        (agentId === 'ok-fraud'
            ? 'Ask me about fraud detection and compliance'
            : agentId === 'snap-fraud-investigator'
            ? 'Ask me about SNAP fraud, retailer abuse, and identity anomalies'
            : isBoosterAgent
            ? 'Ask me about athletic booster and donor engagement data'
            : 'Ask me about scholarships'));
    const chatEmptyBody = isGamedayAgent
        ? (content.gamedayChatAssistantEmptyBody ?? 'Ask about stadium retail SKUs, top-selling apparel, team store locations, or combined ticket + merch revenue.')
        : (content.chatAssistantEmptyBody ??
        (agentId === 'ok-fraud'
            ? 'Ask about fraud indicators, investigations, or compliance.'
            : agentId === 'snap-fraud-investigator'
            ? 'Ask about trafficking, manual entry, cross-state IDs, or deceased beneficiaries.'
            : isBoosterAgent
            ? 'Ask about at-risk donors, major gifts, affinity scores, or engagement trends.'
            : 'Start a conversation by asking about scholarships!'));
    const chatEmptyTry = isGamedayAgent
        ? (content.gamedayChatAssistantEmptyTry ?? 'Try: "Show the stadium retail catalog" or "What are our top-selling items?"')
        : (content.chatAssistantEmptyTry ??
        (agentId === 'ok-fraud'
            ? 'Try: "What are common fraud indicators?"'
            : agentId === 'snap-fraud-investigator'
            ? 'Try: "Which stores show same-cent trafficking?"'
            : isBoosterAgent
            ? 'Try: "Who are our at-risk major gift donors?"'
            : 'Try: "What scholarships are available?"'));

    const chatConfig = template?.content?.chat || {};
    const isCenteredFloating = chatConfig.layout === 'centered';
    const isInlineLarge = chatConfig.inlineLarge === true;
    const samplePrompts = normalizeSamplePrompts(
        suggestedPrompts
            ?? chatConfig.samplePromptsByAgent?.[agentId]
            ?? chatConfig.samplePrompts
            ?? []
    );
    const primaryColor = template?.colors?.primary || '#5D5FEF';
    const secondaryColor = template?.colors?.secondary || '#4A90D9';

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

    useEffect(() => {
        if (!isOpen) {
            setShowSamplePrompts(false);
        }
    }, [isOpen]);

    const submitPrompt = async (text, options = {}) => {
        if (!text.trim() || isLoading) {
            return;
        }
        setInputValue('');
        await sendMessage(text.trim(), options);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await submitPrompt(inputValue);
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
                className="px-6 py-5 border-b flex items-center justify-between"
                style={{
                    backgroundColor: template?.colors?.primary || '#5D5FEF',
                    color: 'white',
                }}
            >
                <div>
                    <h3 className="text-2xl font-semibold tracking-tight">{chatTitle}</h3>
                    <p className="text-base opacity-90 mt-1">{chatSubtitle}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={clearConversation}
                        className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                        title="Clear conversation"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                        title="Close chat"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gray-50">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 text-lg py-12 px-4 leading-relaxed">
                        <p>{chatEmptyBody}</p>
                        <p className="mt-3 text-base">{chatEmptyTry}</p>
                    </div>
                )}

                {messages.map((message) => (
                    <div
                        key={message.id ?? message.timestamp}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                                message.role === 'user'
                                    ? 'bg-blue-500 text-white'
                                    : message.role === 'error'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-white border border-gray-200 text-gray-900'
                            }`}
                        >
                            {message.role === 'user' ? (
                                <p className="text-lg leading-relaxed whitespace-pre-wrap">{message.content}</p>
                            ) : (
                                <ChatMarkdown
                                    content={message.content}
                                    onDonorClick={onDonorClick}
                                    primaryColor={template?.colors?.primary}
                                />
                            )}
                            {message.fastPath && (
                                <p className="text-xs uppercase tracking-wide opacity-60 mt-2">Instant data lookup</p>
                            )}
                            <p className="text-sm opacity-70 mt-2">
                                {new Date(message.timestamp).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                ))}

                {isLoading && stepStatus && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-dashed border-gray-300 rounded-2xl px-5 py-3 text-lg text-gray-600">
                            {stepStatus}
                        </div>
                    </div>
                )}

                {isLoading && !stepStatus && messages.some((m) => m.streaming && !m.content) && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-3">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-3 text-red-800 text-lg">
                        {error}
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t bg-white p-5 space-y-3">
                {showSamplePrompts && samplePrompts.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {samplePrompts.map((item) => (
                            <button
                                key={item.prompt}
                                type="button"
                                title={item.prompt}
                                disabled={isLoading}
                                onClick={() => submitPrompt(item.prompt, { skipFastPath: item.skipFastPath })}
                                className="px-4 py-2 text-sm font-semibold rounded-full border border-gray-300 text-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors truncate max-w-[16rem]"
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = secondaryColor;
                                    e.currentTarget.style.borderColor = secondaryColor;
                                    e.currentTarget.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '';
                                    e.currentTarget.style.borderColor = '';
                                    e.currentTarget.style.color = '';
                                }}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="flex gap-2">
                    {samplePrompts.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setShowSamplePrompts((open) => !open)}
                            aria-label="Sample queries"
                            aria-expanded={showSamplePrompts}
                            title="Sample queries"
                            className={`shrink-0 w-14 h-14 rounded-xl border text-2xl font-bold transition-colors ${
                                showSamplePrompts
                                    ? 'text-white border-transparent'
                                    : 'text-gray-600 border-gray-300 hover:bg-gray-50'
                            }`}
                            style={showSamplePrompts ? { backgroundColor: primaryColor } : undefined}
                        >
                            *
                        </button>
                    )}
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="flex-1 px-5 py-3 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isLoading}
                        className="px-8 py-3 rounded-xl font-semibold text-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                        style={{
                            backgroundColor: primaryColor,
                        }}
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );

    if (floating) {
        const panelClass = isCenteredFloating
            ? 'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(1440px,94vw)] h-[90vh]'
            : 'fixed bottom-6 right-6 w-[min(1100px,94vw)] h-[min(90vh,1500px)]';

        return (
            <>
                {/* Floating Button with Pulsing Animation */}
                {!isOpen && (
                    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
                        {/* Optional bubble text (e.g. okagency: "Can I help you find something?") */}
                        {template?.content?.chatBubbleText && (
                            <div
                                className="hidden sm:block px-5 py-4 rounded-2xl shadow-lg text-base font-medium text-gray-800 bg-white border border-gray-200 max-w-[280px]"
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
                        <div className={`${panelClass} bg-white rounded-2xl shadow-2xl z-50 flex flex-col border border-gray-200 transform transition-all duration-300`}>
                            {chatContent}
                        </div>
                    </>
                )}
            </>
        );
    }

    // Inline chat
    return (
        <div
            className={`w-full mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col ${
                isInlineLarge ? 'max-w-6xl h-[85vh]' : 'max-w-4xl h-[800px]'
            }`}
        >
            {chatContent}
        </div>
    );
}

export default ChatWidget;
