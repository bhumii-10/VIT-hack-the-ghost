import React, { useState, useEffect, useCallback } from 'react';
import HeatmapVisualization from '../components/HeatmapVisualization';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { Target, Activity, TrendingUp, AlertTriangle, Shield, RefreshCw } from 'lucide-react';
import { getApiEndpoint } from '../lib/api';

const HotspotPage = () => {
    const { user } = useAuth();
    const { location: userLocation, isLoading: locationLoading } = useLocation();
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchIncidents = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(getApiEndpoint('crisis/active'));
            if (response.ok) {
                const data = await response.json();
                // Map status and severity to match heatmap expectations if needed
                const items = (data.crises || []).map(c => ({
                    ...c,
                    // Ensure latitude/longitude are numbers
                    latitude: parseFloat(c.latitude),
                    longitude: parseFloat(c.longitude)
                }));
                
                if (items.length > 0) {
                    setIncidents(items);
                } else {
                    // Fallback to sample data for empty db
                    setIncidents([
                        { id: 's1', latitude: 28.6139, longitude: 77.2090, severity: 'high', type: 'fire' },
                        { id: 's2', latitude: 28.6200, longitude: 77.2100, severity: 'critical', type: 'flood' },
                        { id: 's3', latitude: 28.6100, longitude: 77.2050, severity: 'medium', type: 'accident' }
                    ]);
                }
            }
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Failed to fetch incidents:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchIncidents();
        // Refresh every 30 seconds
        const interval = setInterval(fetchIncidents, 30000);
        return () => clearInterval(interval);
    }, [fetchIncidents]);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                    <p className="text-lg">Loading ML Hotspot Analysis...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-gray-900 text-white flex flex-col">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 p-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Target className="text-cyan-400" size={32} />
                            <div>
                                <h1 className="text-2xl font-bold text-cyan-400">ML Hotspot Engine</h1>
                                <p className="text-gray-300 text-sm">AI-powered crisis hotspot detection and risk analysis</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-600 rounded-full">
                                <Activity size={16} />
                                <span>System Online</span>
                            </div>
                            {user && (
                                <div className="text-gray-300">
                                    Welcome, {user.email}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Feature Description */}
            <div className="bg-gray-800 border-b border-gray-700 p-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-green-400">
                            <Shield size={16} />
                            <span>Safe Zones (Green)</span>
                        </div>
                        <div className="flex items-center gap-2 text-yellow-400">
                            <Activity size={16} />
                            <span>Caution Zones (Yellow)</span>
                        </div>
                        <div className="flex items-center gap-2 text-orange-400">
                            <TrendingUp size={16} />
                            <span>Warning Zones (Orange)</span>
                        </div>
                        <div className="flex items-center gap-2 text-red-400">
                            <AlertTriangle size={16} />
                            <span>Danger Zones (Red)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                <HeatmapVisualization 
                    incidents={incidents}
                    userLocation={userLocation}
                />
            </div>
        </div>
    );
};

export default HotspotPage;