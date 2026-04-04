import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BrainCircuit, AlertTriangle, RefreshCw, Zap, ArrowRight, Satellite, MapPin, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { getApiEndpoint } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import LiveSeverityIndicator from '../components/LiveSeverityIndicator';

const SeverityEnginePage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // State
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(true);
    const [error, setError] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [result, setResult] = useState(null);
    const [systemStatus, setSystemStatus] = useState(null);

    // Location State
    const [location, setLocation] = useState(null);
    const [hasLocation, setHasLocation] = useState(false);

    // Initial Load Effect
    useEffect(() => {
        // Try getting location immediately
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                    setHasLocation(true);
                    setLocationLoading(false);
                },
                (err) => {
                    console.error("Location error:", err);
                    setLocationError("Could not access GPS location. Please enable location services.");
                    setLocationLoading(false);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } else {
            setLocationError("Geolocation is not supported by your browser.");
            setLocationLoading(false);
        }

        // Fetch system status
        fetchSystemStatus();
    }, []);

    // Analyze when location is available and user is logged in
    useEffect(() => {
        if (hasLocation && user && !result && !loading) {
            analyzeSituation();
        }
    }, [hasLocation, user]);

    const retryLocation = () => {
        setLocationLoading(true);
        setLocationError(null);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                    setHasLocation(true);
                    setLocationLoading(false);
                },
                (err) => {
                    setLocationError("Retry failed: " + err.message);
                    setLocationLoading(false);
                }
            );
        }
    };

    const fetchSystemStatus = async () => {
        try {
            const response = await fetch(getApiEndpoint('severity/system/status'));
            if (response.ok) {
                const data = await response.json();
                setSystemStatus(data);
            }
        } catch (err) {
            console.error('Failed to fetch system status:', err);
        }
    };

    const analyzeSituation = async () => {
        if (!hasLocation || !location || !user) {
            setError("Location and authentication required for analysis.");
            setLoading(false);
            return;
        }

        console.log("DEBUG: Live severity analysis started");
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(getApiEndpoint('severity/live'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    accuracy: location.accuracy
                })
            });

            console.log("DEBUG: Fetch status", response.status);

            if (!response.ok) {
                const text = await response.text();
                console.error("DEBUG: Fetch error text", text);
                throw new Error(`Analysis failed: ${response.status} - ${text}`);
            }
            const data = await response.json();
            console.log("DEBUG: Fetch data", data);

            // Add artificial delay for "Scanning" effect
            setTimeout(() => {
                setResult(data);
                setLoading(false);
            }, 1500);

        } catch (err) {
            console.error("DEBUG: generic error", err);
            setError(err.message);
            setLoading(false);
        }
    };

    const navigateToEscalation = () => {
        // Store current severity data in sessionStorage for the escalation page
        if (result) {
            sessionStorage.setItem('currentSeverityData', JSON.stringify({
                severity_context: result.severity_context,
                location_basis: result.location_basis,
                timestamp: result.timestamp,
                location: location
            }));
        }
        navigate('/escalation');
    };

    // --- SEVERITY COLORS ---
    const getSeverityColor = (band) => {
        switch (band?.toLowerCase()) {
            case 'critical': return 'text-red-500 border-red-500 bg-red-900/20 shadow-[0_0_30px_rgba(239,68,68,0.4)]';
            case 'high': return 'text-orange-500 border-orange-500 bg-orange-900/20 shadow-[0_0_30px_rgba(249,115,22,0.4)]';
            case 'elevated': return 'text-yellow-500 border-yellow-500 bg-yellow-900/20 shadow-[0_0_30px_rgba(234,179,8,0.4)]';
            case 'low': return 'text-blue-500 border-blue-500 bg-blue-900/20 shadow-[0_0_30px_rgba(59,130,246,0.4)]';
            default: return 'text-green-500 border-green-500 bg-green-900/20 shadow-[0_0_30px_rgba(34,197,94,0.4)]';
        }
    };

    if (loading || locationLoading) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white space-y-6">
            <div className="relative w-32 h-32">
                <div className="absolute inset-0 border-t-2 border-crisis-cyan rounded-full animate-spin"></div>
                <div className="absolute inset-4 border-t-2 border-crisis-red rounded-full animate-spin-reverse"></div>
                <BrainCircuit className="absolute inset-0 m-auto text-white/50 animate-pulse" size={40} />
            </div>
            <div className="text-center font-mono animate-pulse">
                <h2 className="text-xl">SYSTEM ANALYSIS IN PROGRESS</h2>
                <p className="text-xs text-gray-500 mt-2">
                    {locationLoading ? 'Acquiring GPS Location' : 'Triangulating Location • Fetching Weather Data • Querying Risk DB'}
                </p>
                <div className="mt-4 text-crisis-cyan text-xs">
                    {locationLoading ? 'Waiting for location access...' : 'Connecting to ML Severity Engine...'}
                </div>
            </div>
        </div>
    );

    if (error || locationError) return (
        <div className="min-h-screen bg-black flex items-center justify-center text-red-500 font-mono">
            <div className="text-center border border-red-900/50 p-8 rounded bg-red-900/10 max-w-md">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                <h2 className="text-xl font-bold">SYSTEM ERROR</h2>
                <p className="text-sm mt-2">{error || locationError}</p>
                <div className="flex gap-3 mt-6 justify-center">
                    {locationError && (
                        <button
                            onClick={() => retryLocation(1)}
                            className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/40 border border-orange-500/50 rounded text-xs uppercase flex items-center gap-2"
                        >
                            <RefreshCw className="w-3 h-3" />
                            Retry Location
                        </button>
                    )}
                    <button
                        onClick={analyzeSituation}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 rounded text-xs uppercase"
                    >
                        Retry Analysis
                    </button>
                </div>
            </div>
        </div>
    );

    if (!result) {
        return (
            <div className="min-h-screen w-full bg-[#050508] text-white pt-[100px] px-6 pb-20 overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* Header */}
                    <div className="border-b border-white/10 pb-6 flex justify-between items-end">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-mono text-green-500 uppercase">Live Intelligence System</span>
                            </div>
                            <h1 className="text-3xl font-display font-bold">Context-Aware Severity Engine</h1>
                            <p className="text-gray-400 text-sm mt-1">Autonomous risk assessment based on live location context.</p>
                        </div>
                        <div className="text-right hidden sm:block">
                            <div className="text-xs text-gray-500 font-mono">ENGINE ID</div>
                            <div className="font-mono text-lg text-crisis-cyan">CASE-{Math.floor(Math.random() * 10000)}</div>
                        </div>
                    </div>

                    {/* Live Severity Display */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <LiveSeverityIndicator showDetails={true} />

                            {systemStatus && (
                                <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                                    <h3 className="text-lg font-bold text-white mb-3">System Status</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Mode:</span>
                                            <span className="text-green-400 capitalize">{systemStatus.mode}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Live Analysis:</span>
                                            <span className="text-green-400">
                                                {systemStatus.features?.live_location_analysis ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Environmental Data:</span>
                                            <span className="text-green-400">
                                                {systemStatus.features?.environmental_context ? 'Connected' : 'Offline'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Manual Input:</span>
                                            <span className="text-red-400">
                                                {systemStatus.privacy?.manual_input_required ? 'Required' : 'Not Required'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-6">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Satellite className="w-5 h-5 text-blue-400" />
                                    How It Works
                                </h3>
                                <div className="space-y-3 text-sm text-gray-300">
                                    <div className="flex items-start gap-3">
                                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                                        <div>
                                            <div className="font-medium text-white">Auto-Location Detection</div>
                                            <div className="text-gray-400">Uses your GPS coordinates to identify your current area</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                                        <div>
                                            <div className="font-medium text-white">Environmental Analysis</div>
                                            <div className="text-gray-400">Fetches weather, natural hazards, and environmental risks</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                                        <div>
                                            <div className="font-medium text-white">Incident Correlation</div>
                                            <div className="text-gray-400">Analyzes nearby incidents and emergency activity</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-2 h-2 bg-orange-400 rounded-full mt-2"></div>
                                        <div>
                                            <div className="font-medium text-white">Continuous Assessment</div>
                                            <div className="text-gray-400">Updates risk level as conditions change</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {hasLocation && location && (
                                <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-6">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-green-400" />
                                        Current Location Context
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Coordinates:</span>
                                            <span className="text-white font-mono">
                                                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Accuracy:</span>
                                            <span className="text-white">±{Math.round(location.accuracy || 0)}m</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Last Update:</span>
                                            <span className="text-white">{new Date().toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const { severity_context } = result;

    return (
        <div className="min-h-screen w-full bg-[#050508] text-white pt-[100px] px-6 pb-20 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="border-b border-white/10 pb-6 flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-mono text-green-500 uppercase">Automated Response System</span>
                        </div>
                        <h1 className="text-3xl font-display font-bold">Severity Engine Output</h1>
                        <p className="text-gray-400 text-sm mt-1">AI-driven risk assessment based on live telemetry.</p>
                    </div>
                    <div className="text-right hidden sm:block">
                        <div className="text-xs text-gray-500 font-mono">CASE ID</div>
                        <div className="font-mono text-lg text-crisis-cyan">SEV-{Math.floor(Math.random() * 10000)}</div>
                    </div>
                </div>

                {/* MAIN GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* LEFT COLUMN: SEVERITY DECISION */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        {/* 1. SEVERITY BADGE */}
                        <div className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center text-center p-8 relative overflow-hidden backdrop-blur-sm ${getSeverityColor(severity_context.relative_band)}`}>
                            <h2 className="text-sm uppercase tracking-[0.2em] mb-2 font-bold opacity-80">Live Risk Assessment</h2>
                            <div className="text-6xl font-display font-black tracking-tighter uppercase my-4">
                                {severity_context.relative_band}
                            </div>

                            {/* Confidence Indicator */}
                            <div className="mt-4 px-4 py-2 bg-black/40 rounded border border-current/30 text-xs font-bold uppercase">
                                {Math.round(severity_context.confidence * 100)}% Confidence
                            </div>

                            {/* Escalation Navigation Button */}
                            <motion.button
                                onClick={navigateToEscalation}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="mt-6 w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
                            >
                                <Zap className="w-5 h-5" />
                                Proceed to Escalation Analysis
                                <ArrowRight className="w-4 h-4" />
                            </motion.button>
                        </div>

                        {/* 4. CONTEXT INFORMATION */}
                        <div className="p-6 border border-white/10 bg-white/5 rounded-xl">
                            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-mono">System Intelligence</div>
                            <p className="text-lg leading-relaxed font-light text-gray-200">
                                "Risk assessment based on live environmental data, incident correlation, and location-specific factors. No manual input required."
                            </p>
                        </div>
                    </motion.div>


                    {/* RIGHT COLUMN: DETAILS & METRICS */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-6"
                    >
                        {/* 2. CONTINUOUS VALUE */}
                        <div className="p-8 border border-white/10 bg-white/5 rounded-xl">
                            <div className="flex justify-between items-end mb-4">
                                <div className="text-sm text-gray-400 uppercase tracking-wider font-mono">Continuous Risk Value</div>
                                <div className="text-4xl font-mono font-bold text-white">{Math.round(severity_context.continuous_value * 100)}<span className="text-lg text-gray-500">%</span></div>
                            </div>

                            {/* Progress Gauge */}
                            <div className="h-4 w-full bg-black/50 rounded-full overflow-hidden border border-white/10">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${severity_context.continuous_value * 100}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className={`h-full ${severity_context.relative_band === 'critical' ? 'bg-gradient-to-r from-red-600 to-red-400' :
                                        severity_context.relative_band === 'high' ? 'bg-gradient-to-r from-orange-600 to-orange-400' :
                                            severity_context.relative_band === 'elevated' ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' :
                                                severity_context.relative_band === 'low' ? 'bg-gradient-to-r from-blue-600 to-blue-400' :
                                                    'bg-gradient-to-r from-green-600 to-green-400'
                                        }`}
                                ></motion.div>
                            </div>
                            <div className="mt-2 text-xs text-right text-gray-500 font-mono">Live Context Analysis Engine v2.0</div>
                        </div>

                        {/* 5. TREND & METADATA */}
                        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                            <div className="text-xs text-gray-400 uppercase tracking-wider mb-4 font-mono border-b border-white/5 pb-2">System Metadata</div>

                            <div className="grid grid-cols-2 gap-4">
                                <MetadataItem label="Trend" value={severity_context.trend} icon={<Activity size={14} />} />
                                <MetadataItem label="Location Basis" value={result.location_basis} icon={<MapPin size={14} />} />
                                <MetadataItem label="Auto-Fetched" value={result.used_auto_fetched_context ? "Yes" : "No"} icon={<Satellite size={14} />} />
                                <MetadataItem label="Manual Input" value={result.manual_user_input_used ? "Yes" : "No"} icon={<AlertTriangle size={14} />} />
                                <MetadataItem label="Timestamp" value={new Date(result.timestamp).toLocaleString()} fullWidth />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Footer Note */}
                <div className="text-center border-t border-white/10 pt-6 mt-8">
                    <p className="text-xs text-gray-600 font-mono uppercase tracking-widest">
                        Autonomous intelligence system. No manual input required. <br />
                        Risk assessment updates continuously based on live location context.
                    </p>
                </div>

            </div>
        </div>
    );
};

// Helper Component for Metadata Tags
const MetadataItem = ({ label, value, icon, fullWidth = false }) => (
    <div className={`flex flex-col ${fullWidth ? 'col-span-2' : ''}`}>
        <span className="text-[10px] uppercase text-gray-500 mb-1 flex items-center gap-1">
            {icon} {label}
        </span>
        <span className="font-mono text-sm text-white capitalize bg-black/30 px-3 py-2 rounded border border-white/5">
            {value}
        </span>
    </div>
);

export default SeverityEnginePage;
