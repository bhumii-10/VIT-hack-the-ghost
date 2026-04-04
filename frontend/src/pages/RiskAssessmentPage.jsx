import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Brain, AlertTriangle, Zap, MapPin, Clock, CloudRain,
    History, TrendingUp, Satellite, CheckCircle, Droplets,
    Wind, Waves, Thermometer
} from 'lucide-react';
import SpotlightCard from '../components/SpotlightCard';
import LocationTracker from '../components/LocationTracker';
import { getApiEndpoint } from '../lib/api';

const RiskAssessmentPage = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [gpsLocation, setGpsLocation] = useState(null);
    const [formData, setFormData] = useState({
        incident_type: 'flood',
        description: '',
        location_zone: 'urban_dense',
        time_of_day: 'day',
        rainfall_level: 'heavy',
        zone_history: 'frequent'
    });

    const incidentTypes = [
        { value: 'flood', label: 'Flood', icon: <Waves className="w-4 h-4" /> },
        { value: 'landslide', label: 'Landslide', icon: <TrendingUp className="w-4 h-4" /> },
        { value: 'cyclone', label: 'Cyclone', icon: <Wind className="w-4 h-4" /> },
        { value: 'fire', label: 'Fire', icon: <AlertTriangle className="w-4 h-4" /> }
    ];

    const locationZones = [
        { value: 'urban_dense', label: 'Urban (Dense)', risk: 'high' },
        { value: 'urban_sparse', label: 'Urban (Sparse)', risk: 'medium' },
        { value: 'rural_plains', label: 'Rural (Plains)', risk: 'medium' },
        { value: 'rural_hilly', label: 'Rural (Hilly)', risk: 'high' },
        { value: 'coastal', label: 'Coastal Area', risk: 'critical' }
    ];

    const timeOptions = [
        { value: 'day', label: 'Day (06:00 - 18:00)', icon: <CheckCircle className="w-4 h-4" /> },
        { value: 'night', label: 'Night (18:00 - 06:00)', icon: <Clock className="w-4 h-4" /> }
    ];

    const rainfallLevels = [
        { value: 'none', label: 'No Rain', bg: 'bg-gray-500/10', color: 'text-gray-400' },
        { value: 'light', label: 'Light Rain', bg: 'bg-blue-500/10', color: 'text-blue-400' },
        { value: 'moderate', label: 'Moderate Rain', bg: 'bg-blue-600/10', color: 'text-blue-500' },
        { value: 'heavy', label: 'Heavy Rain', bg: 'bg-blue-700/10', color: 'text-blue-600' },
        { value: 'torrential', label: 'Torrential Downpour', bg: 'bg-purple-500/10', color: 'text-purple-500' }
    ];

    const zoneHistory = [
        { value: 'never', label: 'No History', icon: <CheckCircle className="w-4 h-4" /> },
        { value: 'rare', label: 'Rare Incidents', icon: <History className="w-4 h-4" /> },
        { value: 'occasional', label: 'Occasional', icon: <AlertTriangle className="w-4 h-4" /> },
        { value: 'frequent', label: 'Frequent', icon: <Zap className="w-4 h-4" /> }
    ];

    const handleLocationUpdate = (location) => {
        setGpsLocation(location);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Include GPS data if available
            const enhancedFormData = {
                ...formData,
                gps_latitude: gpsLocation?.latitude,
                gps_longitude: gpsLocation?.longitude,
                gps_accuracy: gpsLocation?.accuracy
            };

            const response = await fetch(getApiEndpoint('risk-assessment'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(enhancedFormData)
            });

            if (response.ok) {
                const data = await response.json();
                setResult(data);
            } else {
                console.error('Risk assessment failed');
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'critical': return 'text-red-500 bg-red-500/20 border-red-500/50';
            case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/50';
            case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
            case 'low': return 'text-green-400 bg-green-500/20 border-green-500/50';
            default: return 'text-gray-400 bg-gray-500/20 border-gray-500/50';
        }
    };

    return (
        <div className="min-h-screen pt-24 px-4 pb-12">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Brain className="w-12 h-12 text-blue-400" />
                        <h1 className="text-5xl font-black text-white uppercase tracking-tight">
                            Risk<span className="text-blue-400">Assessment</span>
                        </h1>
                    </div>
                    <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                        AI-powered incident analysis using machine learning algorithms to assess risk severity and priority levels
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* GPS Location Tracker */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-1"
                    >
                        <SpotlightCard
                            className="p-6"
                            spotlightColor="rgba(34, 197, 94, 0.2)"
                        >
                            <LocationTracker onLocationUpdate={handleLocationUpdate} />
                        </SpotlightCard>
                    </motion.div>

                    {/* Input Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-1"
                    >
                        <SpotlightCard
                            className="p-8"
                            spotlightColor="rgba(168, 85, 247, 0.2)"
                        >
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                <AlertTriangle className="w-6 h-6 text-orange-400" />
                                Incident Details
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Incident Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-3">
                                        <Zap className="w-4 h-4 inline mr-2" />
                                        Incident Type
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {incidentTypes.map((type) => (
                                            <button
                                                key={type.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, incident_type: type.value })}
                                                className={`p-3 rounded-lg border text-sm font-medium transition-all ${formData.incident_type === type.value
                                                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                                    : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:border-gray-500'
                                                    }`}
                                            >
                                                <span className="mr-2 flex justify-center">{type.icon}</span>
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Description (AI will analyze keywords)
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Describe the incident in detail... (e.g., water level rising fast, people trapped)"
                                        className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                                        rows={4}
                                        required
                                    />
                                </div>

                                {/* Location Zone */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-3">
                                        <MapPin className="w-4 h-4 inline mr-2" />
                                        Location Zone
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {locationZones.map((zone) => (
                                            <button
                                                key={zone.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, location_zone: zone.value })}
                                                className={`p-3 rounded-lg border text-sm font-medium transition-all ${formData.location_zone === zone.value
                                                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                                    : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:border-gray-500'
                                                    }`}
                                            >
                                                {zone.label}
                                                <span className={`block mt-1 text-xs px-2 py-0.5 rounded w-fit mx-auto ${zone.risk === 'critical' ? 'bg-red-500/20 text-red-400' :
                                                    zone.risk === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                                        'bg-green-500/20 text-green-400'
                                                    }`}>
                                                    {zone.risk}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Time of Day */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-3">
                                        <Clock className="w-4 h-4 inline mr-2" />
                                        Time of Day
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {timeOptions.map((time) => (
                                            <button
                                                key={time.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, time_of_day: time.value })}
                                                className={`p-3 rounded-lg border text-sm font-medium transition-all ${formData.time_of_day === time.value
                                                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                                    : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:border-gray-500'
                                                    }`}
                                            >
                                                <span className="mr-2 flex justify-center">{time.icon}</span>
                                                {time.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Rainfall Level */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-3">
                                        <CloudRain className="w-4 h-4 inline mr-2" />
                                        Rainfall Level
                                    </label>
                                    <div className="space-y-2">
                                        {rainfallLevels.map((level) => (
                                            <button
                                                key={level.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, rainfall_level: level.value })}
                                                className={`w-full p-3 rounded-lg border text-sm font-medium transition-all ${formData.rainfall_level === level.value
                                                    ? `${level.bg} border-current ${level.color}`
                                                    : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:border-gray-500'
                                                    }`}
                                            >
                                                {level.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Zone History */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-3">
                                        <History className="w-4 h-4 inline mr-2" />
                                        Zone History
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {zoneHistory.map((history) => (
                                            <button
                                                key={history.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, zone_history: history.value })}
                                                className={`p-3 rounded-lg border text-sm font-medium transition-all ${formData.zone_history === history.value
                                                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                                    : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:border-gray-500'
                                                    }`}
                                            >
                                                <span className="mr-2 flex justify-center">{history.icon}</span>
                                                {history.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Analyzing...
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2">
                                            <Brain className="w-5 h-5" />
                                            Analyze Risk
                                        </div>
                                    )}
                                </button>
                            </form>
                        </SpotlightCard>
                    </motion.div>

                    {/* Results Panel */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-1"
                    >
                        <SpotlightCard
                            className="p-8"
                            spotlightColor="rgba(34, 197, 94, 0.2)"
                        >
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                <TrendingUp className="w-6 h-6 text-green-400" />
                                AI Analysis Results
                            </h2>

                            {result ? (
                                <div className="space-y-6">
                                    {/* Severity Level */}
                                    <div className={`p-6 rounded-xl border-2 ${getSeverityColor(result.severity_level)}`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-bold">Severity Level</h3>
                                            <AlertTriangle className="w-8 h-8" />
                                        </div>
                                        <div className="text-3xl font-black mb-2">{result.severity_level?.toUpperCase()}</div>
                                        <div className="text-sm opacity-80">
                                            Based on AI analysis of incident details
                                        </div>
                                    </div>

                                    {/* Priority Score */}
                                    <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-600">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-bold text-white">Priority Score</h3>
                                            <Zap className="w-8 h-8 text-yellow-400" />
                                        </div>
                                        <div className="flex items-end gap-2 mb-2">
                                            <span className="text-4xl font-black text-yellow-400">{result.priority_score}</span>
                                            <span className="text-gray-400 text-lg">/100</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                                            <div
                                                className="bg-gradient-to-r from-yellow-500 to-orange-500 h-3 rounded-full transition-all duration-1000"
                                                style={{ width: `${result.priority_score}%` }}
                                            ></div>
                                        </div>
                                        <div className="text-sm text-gray-400">
                                            Response priority ranking
                                        </div>
                                    </div>

                                    {/* Flood Risk */}
                                    {result.flood_risk_percentage !== undefined && (
                                        <div className="bg-blue-900/30 p-6 rounded-xl border border-blue-500/50">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-xl font-bold text-blue-400">Flood Risk</h3>
                                                <CloudRain className="w-8 h-8 text-blue-400" />
                                            </div>
                                            <div className="flex items-end gap-2 mb-2">
                                                <span className="text-4xl font-black text-blue-400">{result.flood_risk_percentage}</span>
                                                <span className="text-blue-300 text-lg">%</span>
                                            </div>
                                            <div className="w-full bg-blue-900/50 rounded-full h-3 mb-2">
                                                <div
                                                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-1000"
                                                    style={{ width: `${result.flood_risk_percentage}%` }}
                                                ></div>
                                            </div>
                                            <div className="text-sm text-blue-300">
                                                ML model prediction
                                            </div>
                                        </div>
                                    )}

                                    {/* GPS Enhanced Risk */}
                                    {result.gps_enhanced_risk !== undefined && (
                                        <div className="bg-purple-900/30 p-6 rounded-xl border border-purple-500/50">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-xl font-bold text-purple-400">GPS-Enhanced Risk</h3>
                                                <Satellite className="w-8 h-8 text-purple-400" />
                                            </div>
                                            <div className="flex items-end gap-2 mb-2">
                                                <span className="text-4xl font-black text-purple-400">{Math.round(result.gps_enhanced_risk)}</span>
                                                <span className="text-purple-300 text-lg">%</span>
                                            </div>
                                            <div className="w-full bg-purple-900/50 rounded-full h-3 mb-2">
                                                <div
                                                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-1000"
                                                    style={{ width: `${result.gps_enhanced_risk}%` }}
                                                ></div>
                                            </div>
                                            <div className="text-sm text-purple-300">
                                                Real-time location-based enhancement
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-400 text-lg">
                                        Fill out the incident details to get AI-powered risk assessment
                                    </p>
                                    {gpsLocation && (
                                        <p className="text-green-400 text-sm mt-2">
                                            📍 GPS location detected - enhanced predictions available
                                        </p>
                                    )}
                                </div>
                            )}
                        </SpotlightCard>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default RiskAssessmentPage;