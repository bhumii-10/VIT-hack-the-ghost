import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Shield, AlertTriangle, Activity, TrendingUp, 
    TrendingDown, Minus 
} from 'lucide-react';
import { getApiEndpoint } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';

const LiveSeverityIndicator = ({ compact = false, showDetails = true }) => {
    const { user } = useAuth();
    const { hasLocation, location } = useLocation();
    const [severityData, setSeverityData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    // ...

    // Fetch live severity based on user's location
    const fetchLiveSeverity = useCallback(async () => {
        if (!hasLocation || !location || !user) return;

        setIsLoading(true);
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

            if (response.ok) {
                const data = await response.json();
                setSeverityData(data);
                setLastUpdate(new Date());
                console.log('Live severity updated:', data);
            } else {
                console.error('Failed to fetch severity data');
            }
        } catch (error) {
            console.error('Severity fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [hasLocation, location, user]);

    // Auto-fetch severity when location changes
    useEffect(() => {
        if (hasLocation && location && user) {
            fetchLiveSeverity();
        }
    }, [hasLocation, location, user, fetchLiveSeverity]);

    // Periodic updates (every 30 seconds)
    useEffect(() => {
        if (hasLocation && location && user) {
            const interval = setInterval(fetchLiveSeverity, 30 * 1000);
            return () => clearInterval(interval);
        }
    }, [hasLocation, location, user, fetchLiveSeverity]);

    const getSeverityColor = (band) => {
        switch (band) {
            case 'minimal': return 'text-green-400 border-green-500/50 bg-green-900/20';
            case 'low': return 'text-blue-400 border-blue-500/50 bg-blue-900/20';
            case 'elevated': return 'text-yellow-400 border-yellow-500/50 bg-yellow-900/20';
            case 'high': return 'text-orange-400 border-orange-500/50 bg-orange-900/20';
            case 'critical': return 'text-red-400 border-red-500/50 bg-red-900/20';
            default: return 'text-gray-400 border-gray-500/50 bg-gray-900/20';
        }
    };

    const getSeverityIcon = (band) => {
        switch (band) {
            case 'minimal': return <Shield className="w-4 h-4" />;
            case 'low': return <Shield className="w-4 h-4" />;
            case 'elevated': return <AlertTriangle className="w-4 h-4" />;
            case 'high': return <AlertTriangle className="w-4 h-4" />;
            case 'critical': return <AlertTriangle className="w-4 h-4 animate-pulse" />;
            default: return <Activity className="w-4 h-4" />;
        }
    };

    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'increasing': return <TrendingUp className="w-3 h-3 text-red-400" />;
            case 'decreasing': return <TrendingDown className="w-3 h-3 text-green-400" />;
            default: return <Minus className="w-3 h-3 text-gray-400" />;
        }
    };

    if (!hasLocation || !user) {
        return (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Activity className="w-4 h-4" />
                <span>Location required for risk assessment</span>
            </div>
        );
    }

    if (isLoading && !severityData) {
        return (
            <div className="flex items-center gap-2 text-blue-400 text-sm">
                <Activity className="w-4 h-4 animate-spin" />
                <span>Analyzing area risk...</span>
            </div>
        );
    }

    if (!severityData) {
        return (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Risk data unavailable</span>
            </div>
        );
    }

    const { severity_context } = severityData;
    const band = severity_context.relative_band;
    const value = severity_context.continuous_value;
    const confidence = severity_context.confidence;
    const trend = severity_context.trend;

    if (compact) {
        return (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${getSeverityColor(band)}`}>
                {getSeverityIcon(band)}
                <span className="text-sm font-medium capitalize">{band}</span>
                {getTrendIcon(trend)}
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border p-4 ${getSeverityColor(band)}`}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    {getSeverityIcon(band)}
                    <span className="font-bold text-lg capitalize">{band} Risk</span>
                </div>
                <div className="flex items-center gap-1">
                    {getTrendIcon(trend)}
                    <span className="text-xs capitalize">{trend}</span>
                </div>
            </div>

            {showDetails && (
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-300">Risk Level:</span>
                        <span className="font-mono">{Math.round(value * 100)}%</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-gray-300">Confidence:</span>
                        <span className="font-mono">{Math.round(confidence * 100)}%</span>
                    </div>

                    {/* Risk Level Bar */}
                    <div className="mt-3">
                        <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${value * 100}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={`h-full ${band === 'critical' ? 'bg-red-500' :
                                        band === 'high' ? 'bg-orange-500' :
                                            band === 'elevated' ? 'bg-yellow-500' :
                                                band === 'low' ? 'bg-blue-500' : 'bg-green-500'
                                    }`}
                            />
                        </div>
                    </div>

                    {lastUpdate && (
                        <div className="text-xs text-gray-500 mt-2">
                            Updated: {new Date(severityData.timestamp).toLocaleString()}
                        </div>
                    )}

                    {/* Auto-refresh indicator */}
                    {isLoading && (
                        <div className="flex items-center gap-1 text-xs text-blue-400">
                            <Activity className="w-3 h-3 animate-spin" />
                            <span>Updating...</span>
                        </div>
                    )}
                </div>
            )}

            {/* Context Information */}
            {showDetails && severityData.used_auto_fetched_context && (
                <div className="mt-3 pt-3 border-t border-current/20">
                    <div className="text-xs text-gray-400">
                        <div className="flex items-center gap-1 mb-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span>Live environmental data</span>
                        </div>
                        <div className="flex items-center gap-1 mb-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span>Real-time incident monitoring</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                            <span>Location-based risk analysis</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Critical Alert */}
            <AnimatePresence>
                {band === 'critical' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="mt-3 p-2 bg-red-900/30 border border-red-500/50 rounded-lg"
                    >
                        <div className="flex items-center gap-2 text-red-300 text-sm">
                            <AlertTriangle className="w-4 h-4 animate-pulse" />
                            <span className="font-medium">High risk area detected</span>
                        </div>
                        <p className="text-xs text-red-200 mt-1">
                            Consider avoiding this area or taking extra precautions.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default LiveSeverityIndicator;