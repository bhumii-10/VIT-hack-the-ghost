import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageCircle, X, Send, Bot, User, Loader,
    Zap, Shield, AlertTriangle, Info
} from 'lucide-react';
import { getApiEndpoint } from '../lib/api';

const AIAssistantChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            text: "Hello! I'm SankatSaathi AI, your emergency response assistant. How can I help you today?",
            timestamp: new Date(),
            suggestions: ["Emergency preparedness", "Disaster types", "Safety guidelines"]
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Debug chatbot initialization
    useEffect(() => {
        console.log('AIAssistantChatbot initialized');
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const sendMessage = async (text = inputMessage) => {
        if (!text.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            text: text.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const url = getApiEndpoint('recommend/chat');
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text.trim(),
                    context: { timestamp: new Date().toISOString() }
                })
            });

            if (response.ok) {
                const data = await response.json();

                const botMessage = {
                    id: Date.now() + 1,
                    type: 'bot',
                    text: data.response,
                    timestamp: new Date(),
                    confidence: data.confidence,
                    suggestions: data.suggestions || []
                };

                setMessages(prev => [...prev, botMessage]);
            } else {
                throw new Error('Failed to get response');
            }
        } catch (error) {
            console.error('Chat error:', error);

            const errorMessage = {
                id: Date.now() + 1,
                type: 'bot',
                text: "I'm having trouble connecting right now. For immediate emergencies, please call your local emergency services (911, 108, or 112).",
                timestamp: new Date(),
                isError: true,
                suggestions: ["Emergency contacts", "Offline safety tips"]
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleSuggestionClick = (suggestion) => {
        sendMessage(suggestion);
    };

    const getMessageIcon = (type, isError = false) => {
        if (type === 'user') return <User className="w-4 h-4" />;
        if (isError) return <AlertTriangle className="w-4 h-4 text-red-400" />;
        return <Bot className="w-4 h-4 text-blue-400" />;
    };

    const getConfidenceIndicator = (confidence) => {
        if (!confidence) return null;

        const color = confidence >= 0.8 ? 'text-green-400' :
            confidence >= 0.6 ? 'text-yellow-400' : 'text-orange-400';

        return (
            <div className={`text-xs ${color} flex items-center gap-1`}>
                <Zap className="w-3 h-3" />
                {(confidence * 100).toFixed(0)}%
            </div>
        );
    };

    return (
        <>
            {/* Floating Chat Button */}
            <motion.button
                onClick={() => {
                    console.log('Chatbot button clicked');
                    setIsOpen(true);
                }}
                className={`chatbot-button fixed bottom-6 right-6 z-[9999] w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 cursor-pointer ${isOpen ? 'scale-0 pointer-events-none' : 'scale-100 pointer-events-auto'}`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={{ scale: 0 }}
                animate={{ scale: isOpen ? 0 : 1 }}
                style={{ zIndex: 9999 }}
            >
                <MessageCircle className="w-6 h-6" />

                {/* Pulse animation */}
                <div className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20"></div>
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="chatbot-window fixed bottom-6 right-6 z-[9998] w-96 h-[500px] bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
                        style={{ zIndex: 9998 }}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">SankatSaathi AI</h3>
                                    <p className="text-xs text-blue-100">Emergency Assistant</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-white/80 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {messages.map((message) => (
                                <div key={message.id} className="space-y-2">
                                    <div className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {message.type === 'bot' && (
                                            <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                                                {getMessageIcon(message.type, message.isError)}
                                            </div>
                                        )}

                                        <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : ''}`}>
                                            <div className={`p-3 rounded-2xl ${message.type === 'user'
                                                    ? 'bg-blue-600 text-white'
                                                    : message.isError
                                                        ? 'bg-red-900/30 border border-red-500/30 text-red-200'
                                                        : 'bg-white/10 border border-white/20 text-white'
                                                }`}>
                                                <p className="text-sm leading-relaxed">{message.text}</p>
                                            </div>

                                            <div className="flex items-center justify-between mt-1 px-1">
                                                <span className="text-xs text-gray-500">
                                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {message.confidence && getConfidenceIndicator(message.confidence)}
                                            </div>
                                        </div>

                                        {message.type === 'user' && (
                                            <div className="w-8 h-8 bg-gray-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                                                {getMessageIcon(message.type)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Suggestions */}
                                    {message.suggestions && message.suggestions.length > 0 && (
                                        <div className="flex flex-wrap gap-2 ml-11">
                                            {message.suggestions.map((suggestion, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => handleSuggestionClick(suggestion)}
                                                    className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-xs text-gray-300 hover:text-white transition-all"
                                                >
                                                    {suggestion}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Loading indicator */}
                            {isLoading && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center">
                                        <Bot className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <div className="bg-white/10 border border-white/20 rounded-2xl p-3">
                                        <div className="flex items-center gap-2">
                                            <Loader className="w-4 h-4 animate-spin text-blue-400" />
                                            <span className="text-sm text-gray-300">Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-white/10">
                            <div className="flex gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask about emergency preparedness..."
                                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 outline-none text-sm"
                                    disabled={isLoading}
                                />
                                <button
                                    onClick={() => sendMessage()}
                                    disabled={!inputMessage.trim() || isLoading}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg px-3 py-2 transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                <Shield className="w-3 h-3" />
                                <span>AI-powered emergency guidance • For emergencies call 911/108/112</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AIAssistantChatbot;