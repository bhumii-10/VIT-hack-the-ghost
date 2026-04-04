import React from 'react';
import { AreaChart, BarChart, Activity, AlertTriangle } from 'lucide-react';

const AnalyticsPage = () => {
    return (
        <div className="min-h-screen bg-black pt-24 px-8 pb-12 relative z-20">
            <div className="flex justify-between items-end mb-12 border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-4xl font-display font-bold text-white mb-2">PREDICTIVE DATA</h1>
                    <p className="text-gray-400 font-mono text-sm">Crisis Intelligence & Trends // Last 24h</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8 h-[600px]">
                {/* Chart 1 Placeholder */}
                <div className="border border-white/10 bg-white/5 rounded-2xl p-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10"></div>
                    <div className="flex items-center justify-between mb-8 relative z-20">
                        <h3 className="text-xl font-bold text-white">Incident Frequency</h3>
                        <Activity className="text-crisis-blue" />
                    </div>

                    {/* Fake Chart Bars for Sci-Fi look */}
                    <div className="flex items-end justify-between h-[300px] gap-2">
                        {[40, 60, 30, 80, 50, 90, 40, 70, 60, 100, 80, 40].map((h, i) => (
                            <div key={i} className="w-full bg-crisis-blue/20 rounded-t-sm relative group">
                                <div style={{ height: `${h}%` }} className="absolute bottom-0 w-full bg-crisis-blue/60 group-hover:bg-crisis-blue transition-colors"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chart 2 Placeholder */}
                <div className="border border-white/10 bg-white/5 rounded-2xl p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-white">Threat Hotspots</h3>
                        <AlertTriangle className="text-crisis-red" />
                    </div>

                    <div className="space-y-4">
                        {[
                            { region: "Sector 7 (Industrial)", risk: 92 },
                            { region: "Sector 3 (Residential)", risk: 45 },
                            { region: "Sector 9 (Coastal)", risk: 78 },
                        ].map((area, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm text-gray-400 mb-1">
                                    <span>{area.region}</span>
                                    <span className="text-white font-mono">{area.risk}% RISK</span>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div style={{ width: `${area.risk}%` }} className={`h-full ${area.risk > 70 ? 'bg-crisis-red' : 'bg-crisis-orange'}`}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
