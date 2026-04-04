import React, { useState, useEffect, useRef } from 'react';
import { Search, Globe, AlertTriangle, Radio, Activity, Terminal, Shield, Eye, BarChart3, Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { getApiEndpoint } from '../lib/api';

const NewsPage = () => {
    const { user } = useAuth();
    const { location: gpsLocation, hasLocation, getAddressFromCoords } = useLocation();
    const [location, setLocation] = useState('India');
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([
        "> SYSTEM_INIT_SEQUENCE_START",
        "> CONNECTING_TO_SATELLITE_LINK...",
        "> UPLINK_ESTABLISHED_SUCCESSFULLY",
        "> WAITING_FOR_COORDINATES..."
    ]);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const logsEndRef = useRef(null);

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const addLog = (msg) => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        setLogs(prev => [...prev.slice(-15), `[${time}] ${msg}`]); // Keep last 16 logs
    };

    const fetchNews = async (searchLocation = location, forceRefresh = false) => {
        setLoading(true);
        setError(null);
        addLog(`> INITIATING_SCAN_SEQUENCE: "${searchLocation.toUpperCase()}"`);

        try {
            // 1. Trigger Fetch (POST)
            if (forceRefresh) {
                const url = getApiEndpoint('news/fetch-news');
                addLog("> SENDING_DATA_REQUEST_PACKET...");
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ location: searchLocation })
                });

                if (!res.ok) throw new Error("SATELLITE_LINK_UNSTABLE (API_ERROR)");
                const data = await res.json();
                addLog(`> SCAN_COMPLETE. ${data.new_articles_count} NEW_INTEL_PACKETS_ACQUIRED`);
            }

            // 2. Get Data (GET)
            const url = getApiEndpoint(`news?location=${encodeURIComponent(searchLocation)}`);
            addLog("> DECRYPTING_INTEL_FEED...");
            const getRes = await fetch(url);
            if (!getRes.ok) {
                throw new Error("DATA_RETRIEVAL_FAILED");
            }

            const data = await getRes.json();
            setNews(data);
            setLastUpdated(new Date().toLocaleTimeString());
            addLog(`> VISUAL_MATRIX_UPDATED. ${data.length} ITEMS_LOADED.`);

            if (data.length === 0) {
                addLog("> NO_LOCAL_ANOMALIES_DETECTED.");
            }

        } catch (err) {
            console.error(err);
            setError(err.message);
            addLog(`> CRITICAL_FAILURE: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Initial Load - Try to get user location
    useEffect(() => {
        const init = async () => {
            addLog("> REQUESTING_OPERATOR_COORDINATES...");
            
            if (hasLocation && gpsLocation) {
                const lat = gpsLocation.latitude;
                const lon = gpsLocation.longitude;
                addLog(`> COORDINATES_LOCKED: [${lat.toFixed(4)}, ${lon.toFixed(4)}]`);

                // Get address from coordinates
                try {
                    const city = await getAddressFromCoords(lat, lon);
                    const locationName = city.split(',')[0] || "India"; // Get first part of address
                    setLocation(locationName);
                    addLog(`> SECTOR_IDENTIFIED: ${locationName.toUpperCase()}`);
                    fetchNews(locationName, true);
                } catch (e) {
                    addLog("> GEOCODE_UPLINK_FAILED. DEFAULTING_TO: INDIA");
                    setLocation("India");
                    fetchNews("India", true);
                }
            } else {
                addLog("> GEOLOCATION_UNAVAILABLE. DEFAULTING_TO: INDIA");
                setLocation("India");
                fetchNews("India", true);
            }
        };
        init();
    }, [hasLocation, gpsLocation, getAddressFromCoords]);

    const handleScan = (e) => {
        e.preventDefault();
        fetchNews(location, true);
    };

    const getBadgeInfo = (category) => {
        switch (category?.toLowerCase()) {
            case 'flood': return { color: 'text-blue-400', border: 'border-blue-500/50', bg: 'bg-blue-500/10' };
            case 'earthquake': return { color: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-500/10' };
            case 'wildfire':
            case 'fire': return { color: 'text-orange-400', border: 'border-orange-500/50', bg: 'bg-orange-500/10' };
            case 'cyclone':
            case 'storm': return { color: 'text-cyan-400', border: 'border-cyan-500/50', bg: 'bg-cyan-500/10' };
            default: return { color: 'text-gray-400', border: 'border-gray-500/50', bg: 'bg-gray-500/10' };
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#050508] relative overflow-hidden pt-24 pb-12 px-4 md:px-8">
            {/* Background Grid */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(18,18,24,0)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,24,0)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black_70%,transparent_100%)] pointer-events-none z-0 opacity-20"></div>

            <div className="container mx-auto relative z-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-white/10 pb-6 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Activity className="text-crisis-cyan w-4 h-4 animate-pulse" />
                            <span className="text-xs font-mono text-crisis-cyan tracking-[0.2em] uppercase">Tactical Awareness System</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight">
                            INTELLIGENCE <span className="text-transparent bg-clip-text bg-gradient-to-r from-crisis-cyan to-blue-600">GRID</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-6 font-mono text-xs">
                        <div className="flex flex-col items-end">
                            <span className="text-gray-500 uppercase">System Status</span>
                            <span className="text-signal-success flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-signal-success"></span> ONLINE
                            </span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-gray-500 uppercase">Latency</span>
                            <span className="text-crisis-cyan">12ms</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-gray-500 uppercase">Encryption</span>
                            <span className="text-white">AES-256</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* LEFT PANEL: COMMAND DECK */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Control Panel */}
                        <div className="glass-panel-heavy p-1 rounded-sm">
                            <div className="bg-[#0a0a0f] p-4 border border-white/5 rounded-sm">
                                <label className="text-[10px] font-mono text-crisis-cyan mb-3 block tracking-widest uppercase flex items-center gap-2">
                                    <Globe size={12} /> Target Sector
                                </label>

                                <form onSubmit={handleScan} className="flex flex-col gap-2">
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            {loading ? <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div> : <div className="w-2 h-2 rounded-full bg-crisis-cyan"></div>}
                                        </div>
                                        <input
                                            type="text"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            className="w-full bg-surface-1 border border-white/10 text-white pl-8 pr-4 py-3 font-mono text-sm focus:outline-none focus:border-crisis-cyan transition-colors uppercase placeholder-gray-700"
                                            placeholder="ENTER_SECTOR"
                                        />
                                        <div className="absolute top-0 right-0 h-full w-[1px] bg-gradient-to-b from-transparent via-crisis-cyan to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3 bg-crisis-cyan/10 border border-crisis-cyan/50 text-crisis-cyan font-mono text-xs font-bold hover:bg-crisis-cyan hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wide group"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                                Scanning...
                                            </>
                                        ) : (
                                            <>
                                                <Wifi size={14} className="group-hover:scale-110 transition-transform" /> Initialize Scan
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Visual Diagnostics */}
                        <div className="glass-panel p-5 space-y-4">
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Signal Strength</span>
                                <Wifi size={14} className="text-signal-success" />
                            </div>
                            <div className="flex gap-1 h-8 items-end">
                                {[30, 60, 45, 80, 50, 90, 70, 40, 60, 85].map((h, i) => (
                                    <div key={i} className="flex-1 bg-crisis-cyan/20 hover:bg-crisis-cyan transition-colors duration-300 relative group">
                                        <div
                                            style={{ height: `${h}%` }}
                                            className="absolute bottom-0 w-full bg-crisis-cyan opacity-60 group-hover:opacity-100 transition-all"
                                        ></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Terminal Logs */}
                        <div className="glass-panel overflow-hidden flex flex-col h-[300px]">
                            <div className="bg-black/40 p-2 border-b border-white/5 flex items-center justify-between">
                                <span className="text-[10px] font-mono text-gray-500 flex items-center gap-2">
                                    <Terminal size={10} /> SYSTEM_LOGS
                                </span>
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500/50"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500/50"></div>
                                </div>
                            </div>
                            <div className="flex-1 bg-black/60 p-3 font-mono text-[10px] overflow-y-auto custom-scrollbar">
                                {logs.map((log, i) => (
                                    <div key={i} className="mb-1 text-green-500/80 leading-relaxed font-light">
                                        <span className="opacity-50 mr-2">{i.toString().padStart(3, '0')}</span>
                                        {log}
                                    </div>
                                ))}
                                <div ref={logsEndRef} />
                                {!loading && <span className="text-green-500 animate-pulse">_</span>}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: INTEL GRID */}
                    <div className="lg:col-span-9">
                        {/* Feed Info */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-1 bg-crisis-cyan"></div>
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-wide">LIVE INTELLIGENCE FEED</h2>
                                    <div className="text-[10px] font-mono text-gray-500">
                                        SECTOR: <span className="text-crisis-cyan">{location.toUpperCase()}</span> | <span className="text-gray-600">UPDATED: {lastUpdated || 'WAITING...'}</span>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-mono rounded flex items-center gap-2">
                                    <AlertTriangle size={14} /> {error}
                                </div>
                            )}
                        </div>

                        {/* News Items Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <AnimatePresence>
                                {news.length === 0 && !loading && !error && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="col-span-full h-64 border border-dashed border-gray-800 rounded flex flex-col items-center justify-center text-gray-600 font-mono text-sm"
                                    >
                                        <WifiOff size={32} className="mb-4 opacity-50" />
                                        <span>NO_ACTIVE_THREATS_DETECTED</span>
                                        <span className="text-xs opacity-50 mt-2">MONITORING_FREQUENCY_STABLE</span>
                                    </motion.div>
                                )}

                                {news.map((item, idx) => {
                                    const badge = getBadgeInfo(item.category);
                                    return (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                                            className="group relative bg-surface-1 border border-white/5 overflow-hidden hover:border-crisis-cyan/40 transition-all duration-300"
                                        >
                                            {/* Top Decoration */}
                                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-crisis-cyan/50 transition-all"></div>

                                            {/* Image Section */}
                                            <div className="h-40 w-full relative overflow-hidden">
                                                <div className="absolute inset-0 bg-[#0a0a0f] z-0"></div>
                                                <img
                                                    src={item.image_url || 'https://via.placeholder.com/600x400?text=NO+VISUAL'}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 grayscale group-hover:grayscale-0 mix-blend-luminosity group-hover:mix-blend-normal"
                                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/600x400/000000/FFFFFF?text=IMG_ERR'; }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-transparent to-transparent"></div>

                                                {/* Badge */}
                                                <div className={`absolute top-3 right-3 px-2 py-1 text-[9px] font-bold uppercase tracking-wider border backdrop-blur-md ${badge.bg} ${badge.color} ${badge.border}`}>
                                                    {item.category || 'GENERAL'}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-5 pt-2 relative">
                                                {/* Meta Data Line */}
                                                <div className="flex items-center justify-between text-[9px] font-mono text-gray-500 mb-2 border-b border-white/5 pb-2">
                                                    <span className="flex items-center gap-1"><Eye size={10} /> {item.source_name?.toUpperCase() || 'UNKNOWN'}</span>
                                                    <span>{new Date(item.published_at).toLocaleDateString()} // {new Date(item.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>

                                                <h3 className="text-lg font-display font-medium text-white mb-2 leading-tight group-hover:text-crisis-cyan transition-colors line-clamp-2">
                                                    <a href={item.article_url} target="_blank" rel="noopener noreferrer" className="before:absolute before:inset-0">
                                                        {item.title}
                                                    </a>
                                                </h3>

                                                <p className="text-xs text-gray-400 font-sans leading-relaxed line-clamp-2 opacity-70 group-hover:opacity-100 transition-opacity">
                                                    {item.description || 'Intel packet content encrypted. Access full report for details.'}
                                                </p>

                                                {/* Hover Reveal Action */}
                                                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                                                    <ArrowIcon />
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Simple Arrow SVG Component
const ArrowIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-crisis-cyan">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
);

export default NewsPage;
