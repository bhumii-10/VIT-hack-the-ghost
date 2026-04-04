import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const TranslatedText = ({ text, className, as: Component = 'span' }) => {
    const { language, translateText } = useLanguage();
    const [content, setContent] = useState(text);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;

        async function doTranslate() {
            if (!text) {
                if (isMounted) setContent("");
                return;
            }
            if (language === 'en') {
                if (isMounted) setContent(text);
                return;
            }

            if (isMounted) setIsLoading(true);

            try {
                const translated = await translateText(text);
                if (isMounted) setContent(translated);
            } catch (e) {
                if (isMounted) setContent(text);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        doTranslate();

        return () => { isMounted = false; };
    }, [text, language, translateText]);

    return (
        <Component className={`${className || ''} ${isLoading ? 'animate-pulse opacity-70' : ''}`}>
            {content}
        </Component>
    );
};

export default TranslatedText;
