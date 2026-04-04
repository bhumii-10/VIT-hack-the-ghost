import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react'; // Assuming lucide-react is used, if not I'll remove icon or check package.json

const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'mr', label: 'मराठी' },
    { code: 'ta', label: 'தமிழ்' },
    { code: 'bn', label: 'বাংলা' }
];

const LanguageSelector = () => {
    const { language, changeLanguage } = useLanguage();

    return (
        <div className="flex items-center space-x-2 bg-black/40 backdrop-blur-md rounded px-3 py-2 border border-white/10 hover:border-blue-500/50 transition-all group group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 group-hover:rotate-180 transition-transform duration-500">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>

            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter mr-1 hidden sm:block">Translate</span>

            <select
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer uppercase tracking-wider [&>option]:text-black"
                aria-label="Select Language"
            >
                {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                        {lang.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default LanguageSelector;
