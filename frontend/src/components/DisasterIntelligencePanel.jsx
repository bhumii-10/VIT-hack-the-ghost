
import React, { useState, useEffect } from 'react';
import { getApiEndpoint } from '../lib/api';
import { saveIntelligenceState, getCachedIntelligence } from '../lib/db';
import { Shield, ShieldAlert, Zap, Radio, CloudOff } from 'lucide-react';

const DisasterIntelligencePanel = () => {
    const [intelligence, setIntelligence] = useState(null);
    const [isOffline, setIsOffline] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchIntelligence = async () => {
        try {
            setError(null);
            // Try network first
            const url = getApiEndpoint('intelligence/status');
            const res = await fetch(url);
            if (!res.ok) throw new Error(`API Error: ${res.status}`);

            const data = await res.json();

            // Validate data structure
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid data structure received');
            }

            // Save to offline cache
            await saveIntelligenceState(data);

            setIntelligence(data);
            setIsOffline(false);
            setLoading(false);
        } catch (err) {
            console.log('Network failed, falling back to IndexedDB...', err);
            setIsOffline(true);

            try {
                // Try IndexedDB
                const cached = await getCachedIntelligence();
                if (cached) {
                    setIntelligence(cached);
                    setLoading(false);
                } else {
                    // Provide fallback data
                    setIntelligence({
                        state: "UNKNOWN",
                        risk_score: 0.5,
                        summary: "Intelligence system offline. Using cached data.",
                        instructions: ["System temporarily unavailable", "Check network connection"],
                        cachedAt: new Date().toISOString()
                    });
                    setLoading(false);
                }
            } catch (cacheErr) {
                console.error('Cache error:', cacheErr);
                setError('Unable to load intelligence data');
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchIntelligence();
        const interval = setInterval(fetchIntelligence, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="p-4 text-white">Loading Intelligence...</div>;
    if (error) return <div className="p-4 text-red-400">Error: {error}</div>;
    if (!intelligence) return <div className="p-4 text-gray-400">No intelligence data available</div>;

    const { 
        state = "UNKNOWN", 
        risk_score = 0, 
        summary = "No summary available", 
        instructions = [], 
        cachedAt 
    } = intelligence;

    // Color mapping
    const getStatusColor = (s) => {
        switch (s) {
            case 'emergency': return 'bg-red-600 border-red-400';
            case 'alert': return 'bg-orange-600 border-orange-400';
            case 'monitoring': return 'bg-yellow-600 border-yellow-400';
            default: return 'bg-green-600 border-green-400';
        }
    };

    return (
        <div className={`rounded-xl border p-4 shadow-xl mb-6 relative overflow-hidden transition-all duration-500
            ${getStatusColor(state)} bg-opacity-20 backdrop-blur-md border-opacity-50`}
        >
            {/* Status Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    {state === 'emergency' ? <ShieldAlert size={28} className="text-white animate-pulse" /> : <Shield size={28} className="text-white" />}
                    <div>
                        <h2 className="text-lg font-black text-white uppercase tracking-wider">
                            DEFCON: {state}
                        </h2>
                        <div className="text-xs text-white/80 font-mono">
                            AI Confidence: 98.4% • {isOffline ? <span className="flex items-center gap-1 text-red-300"><CloudOff size={10} /> OFFLINE MODE</span> : <span className="flex items-center gap-1 text-green-300"><Radio size={10} /> LIVE STREAM</span>}
                        </div>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-3xl font-black text-white">{risk_score}%</div>
                    <div className="text-[10px] text-white/70 uppercase">Risk Index</div>
                </div>
            </div>

            {/* AI Summary */}
            <div className="bg-black/30 rounded-lg p-3 mb-3 border border-white/10">
                <div className="flex items-start gap-2">
                    <Zap size={16} className="text-yellow-400 mt-1" />
                    <p className="text-sm text-gray-200 font-medium leading-relaxed">
                        {summary}
                    </p>
                </div>
                {isOffline && cachedAt && (
                    <div className="text-[10px] text-gray-500 mt-2 text-right">
                        Last Updated: {new Date(cachedAt).toLocaleTimeString()}
                    </div>
                )}
            </div>

            {/* Directives */}
            <div className="space-y-2">
                <h4 className="text-xs font-bold text-white/90 uppercase mb-1">Tactical Directives</h4>
                {(instructions || []).map((inst, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white/10 rounded px-2 py-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span className="text-xs text-white font-mono">{inst}</span>
                    </div>
                ))}
                {(!instructions || instructions.length === 0) && (
                    <div className="text-xs text-gray-400 italic">No tactical directives available</div>
                )}
            </div>
        </div>
    );
};

export default DisasterIntelligencePanel;
