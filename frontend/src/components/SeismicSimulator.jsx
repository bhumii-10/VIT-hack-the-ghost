import React, { useState } from 'react';
import { getApiEndpoint } from '../lib/api';
import { toast } from 'sonner';

const SeismicSimulator = () => {
    const [magnitude, setMagnitude] = useState(6.0);
    const [place, setPlace] = useState("Connaught Place, Delhi");
    const [isLoading, setIsLoading] = useState(false);
    const [lastResult, setLastResult] = useState(null);

    const handleSimulate = async () => {
        setIsLoading(true);
        try {
            const url = getApiEndpoint('seismic/simulate');
            // const url = "http://localhost:8000/api/seismic/simulate"; // fallback if getApiEndpoint is tricky

            const res = await fetch(`${url}?mag=${magnitude}&place=${encodeURIComponent(place)}`, {
                method: 'POST'
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(`Simulation Triggered: Mag ${magnitude}`);
                setLastResult(data.risk_assessment);

                // Force a reload of the main dashboard incidents if possible, or expect real-time update
                // Since user will be on dashboard, the realtime subscription in CrisisDashboard will catch the new incident!
            } else {
                toast.error("Simulation Failed");
                console.error(data);
            }
        } catch (e) {
            toast.error("Network Error");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-black/60 backdrop-blur border border-white/10 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
                <span className="text-2xl">⚡</span>
                <h3 className="font-bold text-lg text-white">Judge Control: Seismic Trigger</h3>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-xs text-gray-400 block mb-1">Magnitude (Richter)</label>
                    <input
                        type="range"
                        min="2.0"
                        max="9.0"
                        step="0.1"
                        value={magnitude}
                        onChange={(e) => setMagnitude(parseFloat(e.target.value))}
                        className="w-full accent-blue-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs mt-1 font-mono">
                        <span className="text-gray-500">2.0</span>
                        <span className={`font-bold text-lg ${magnitude > 7 ? 'text-red-500' : magnitude > 5 ? 'text-yellow-500' : 'text-green-500'}`}>
                            {magnitude}
                        </span>
                        <span className="text-gray-500">9.0</span>
                    </div>
                </div>

                <div>
                    <label className="text-xs text-gray-400 block mb-1">Location</label>
                    <input
                        type="text"
                        value={place}
                        onChange={(e) => setPlace(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                    />
                </div>

                <button
                    onClick={handleSimulate}
                    disabled={isLoading}
                    className={`w-full py-2 rounded font-bold uppercase tracking-wider text-sm transition-all
                        ${isLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/50'}
                    `}
                >
                    {isLoading ? 'Injecting...' : '🚨 TRIGGER TEST EVENT'}
                </button>

                {lastResult && (
                    <div className="mt-3 bg-gray-900 p-2 rounded border border-white/5 text-xs font-mono">
                        <div className="text-gray-400">Risk Score: <span className="text-white">{lastResult.risk_score}%</span></div>
                        <div className="text-gray-400">Severity: <span className={lastResult.severity_level === 'CRITICAL' ? 'text-red-500 font-bold' : 'text-yellow-400'}>{lastResult.severity_level}</span></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SeismicSimulator;
