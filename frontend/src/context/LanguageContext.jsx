import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

import translationsData from '../locales/translations.json';

const LanguageContext = createContext({
    language: 'en',
    changeLanguage: () => {},
    translateText: async (text) => text
});

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('en');
    const [cache, setCache] = useState(translationsData || {}); 

    // Initial language check
    useEffect(() => {
        try {
            const saved = localStorage.getItem('appLanguage');
            if (saved && ['en', 'hi', 'mr', 'ta', 'bn'].includes(saved)) {
                setLanguage(saved);
            }
        } catch (e) {
            console.warn("Could not load saved language");
        }
    }, []);

    const changeLanguage = (lang) => {
        setLanguage(lang);
        try {
            localStorage.setItem('appLanguage', lang);
        } catch (e) {
            console.error("Storage error:", e);
        }
    };

    const translateText = useCallback(async (text, key = null) => {
        if (!text) return "";
        if (language === 'en') return text;

        // 1. Check static translations by key first
        if (key && translationsData && translationsData[language] && translationsData[language][key]) {
            return translationsData[language][key];
        }

        // 2. Check cache
        if (cache && cache[language] && cache[language][text]) {
            return cache[language][text];
        }

        try {
            // Check for API availability - fallback to text if likely not available
            const apiUrl = import.meta.env.VITE_API_URL || "";
            const baseUrl = apiUrl.startsWith('http') ? apiUrl : `${window.location.origin}${apiUrl}`;
            
            const response = await fetch(`${baseUrl}/translate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, language })
            });

            if (!response.ok) return text;

            const data = await response.json();
            const translated = data.translated_text || text;

            setCache(prev => ({
                ...prev,
                [language]: {
                    ...(prev[language] || {}),
                    [text]: translated
                }
            }));

            return translated;
        } catch (error) {
            console.error("Translation failed:", error);
            return text;
        }
    }, [language, cache]);

    return (
        <LanguageContext.Provider value={{ language, changeLanguage, translateText }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        // Fallback to defaults to prevent crashes
        return {
            language: 'en',
            changeLanguage: () => {},
            translateText: async (t) => t
        };
    }
    return context;
};
