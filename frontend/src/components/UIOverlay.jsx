import React from 'react';
import { motion } from 'framer-motion';

const UIOverlay = ({ activeSection, setActiveSection, user, signOut, showWidgets = true }) => {
    const alerts = [
        { id: 1, type: 'critical', msg: 'CRITICAL: Flood Warning - Zone A', time: '2m ago' },
        { id: 2, type: 'warning', msg: 'Seismic Activity Detected - Zone B', time: '15m ago' },
        { id: 3, type: 'resolved', msg: 'Resource Delivery Complete - Zone C', time: '1h ago' },
    ];

    return (
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6 overflow-hidden">
            {/* Header / Nav */}
            <motion.header
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="flex items-center justify-between pointer-events-auto"
            >
                <div className="flex items-center gap-4">
                    <img src="/logo.jpg" alt="SankatSaathi Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_20px_rgba(255,42,42,0.5)]" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-wider text-white">CRISIS<span className="text-crisis-red">NET</span></h1>
                        <div className="text-xs text-crisis-blue uppercase tracking-[0.2em]">Global Response System</div>
                    </div>
                </div>

                <nav className="hidden md:flex gap-2 glass-panel rounded-full px-2 py-2">
                    {['Overview', 'Incidents', 'Resources', 'Analytics'].map((item) => (
                        <button
                            key={item}
                            onClick={() => setActiveSection(item)}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:bg-white/10 ${activeSection === item ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'text-gray-400'
                                }`}
                        >
                            {item}
                        </button>
                    ))}
                </nav>

                <div className="flex gap-4 items-center">
                    <div className="hidden lg:flex gap-4">
                        <div className="glass-panel px-4 py-2 rounded-lg text-center min-w-[100px]">
                            <div className="text-xs text-gray-400 uppercase">Active Units</div>
                            <div className="text-xl font-bold text-crisis-green">2,405</div>
                        </div>
                        <div className="glass-panel px-4 py-2 rounded-lg text-center min-w-[100px]">
                            <div className="text-xs text-gray-400 uppercase">Critical</div>
                            <div className="text-xl font-bold text-crisis-red animate-pulse">12</div>
                        </div>
                    </div>

                    {/* User Profile & Logout */}
                    <div className="flex items-center gap-3 ml-4 border-l border-white/10 pl-4">
                        <div className="text-white/80 text-sm font-medium backdrop-blur-md bg-white/5 px-3 py-1 rounded-full border border-white/10 hover:bg-white/10 transition cursor-default">
                            {user?.user_metadata?.full_name || 'Responder'}
                        </div>
                        <button
                            onClick={signOut}
                            className="bg-red-600/80 hover:bg-red-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-full backdrop-blur-md transition shadow-lg border border-red-500/50 uppercase tracking-wide"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </motion.header>

            {/* Main Content Area (Center is empty for globe) */}

            {/* Sidebar: Alerts */}
            {/* Sidebar: Alerts */}
            {showWidgets && (
                <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="absolute right-6 top-32 w-80 pointer-events-auto flex flex-col gap-4"
                >
                    <div className="glass-panel p-4 rounded-xl border-l-4 border-l-crisis-blue">
                        <h3 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-crisis-blue animate-[ping_2s_linear_infinite]"></span>
                            Live Feed
                        </h3>
                        <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {alerts.map(alert => (
                                <div key={alert.id} className={`glass-alert p-3 rounded-md border-l-4 ${alert.type === 'critical' ? 'border-crisis-red' :
                                    (alert.type === 'warning' ? 'border-crisis-orange' : 'border-crisis-green')
                                    }`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${alert.type === 'critical' ? 'text-crisis-red border-crisis-red/30 bg-crisis-red/10' :
                                            (alert.type === 'warning' ? 'text-crisis-orange border-crisis-orange/30 bg-crisis-orange/10' : 'text-crisis-green border-crisis-green/30 bg-crisis-green/10')
                                            }`}>
                                            {alert.type.toUpperCase()}
                                        </span>
                                        <span className="text-[10px] text-gray-500">{alert.time}</span>
                                    </div>
                                    <p className="text-xs text-gray-200 leading-relaxed font-light">{alert.msg}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Bottom Footer / Timeline */}
            {showWidgets && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1, duration: 0.8 }}
                    className="w-full glass-panel p-4 rounded-xl flex items-center justify-between pointer-events-auto"
                >
                    <div className="flex items-center gap-8">
                        <div className="text-xs text-gray-400">
                            STATUS: <span className="text-crisis-green font-bold ml-2">OPERATIONAL</span>
                        </div>
                        <div className="h-4 w-[1px] bg-white/10"></div>
                        <div className="flex gap-2">
                            <div className="h-1 w-12 rounded-full bg-crisis-red/50"></div>
                            <div className="h-1 w-8 rounded-full bg-crisis-orange/50"></div>
                            <div className="h-1 w-24 rounded-full bg-crisis-green/50"></div>
                            <div className="h-1 w-16 rounded-full bg-gray-700"></div>
                        </div>
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                        SYS.VER.2.4.0 // LATENCY: 24ms
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default UIOverlay;
