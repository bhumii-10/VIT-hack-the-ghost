import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Rectangle, Popup, Circle, useMap } from 'react-leaflet';
import { getApiEndpoint } from '../lib/api';
import { Activity, TrendingUp, AlertTriangle, Shield, Target } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const HeatmapVisualization = ({ incidents = [], userLocation = null }) => {
    const [heatmapData, setHeatmapData] = useState([]);
    const [hotspotAnalysis, setHotspotAnalysis] = useState(null);
    const [temporalAnalysis, setTemporalAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [gridSize, setGridSize] = useState(0.05);
    const [analysisRadius, setAnalysisRadius] = useState(50);

    // Zone color mappings
    const zoneColors = {
        safe: { color: '#32CD32', opacity: 0.3, name: 'Safe Zone' },
        caution: { color: '#FFD700', opacity: 0.4, name: 'Caution Zone' },
        warning: { color: '#FF8C00', opacity: 0.5, name: 'Warning Zone' },
        danger: { color: '#FF0000', opacity: 0.6, name: 'Danger Zone' }
    };

    // Fetch live analysis from backend
    const fetchLiveAnalysis = async () => {
        setLoading(true);
        try {
            let url = getApiEndpoint(`hotspot/live-analysis?radius_km=${analysisRadius}&grid_size=${gridSize}&days_back=7`);
            
            // Add location context if available
            if (userLocation?.latitude && userLocation?.longitude) {
                url += `&lat=${userLocation.latitude}&lng=${userLocation.longitude}`;
            }

            console.log('[Heatmap] Fetching live analysis from:', url);
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('[Heatmap] Live analysis data:', data);
            
            setHeatmapData(data.heatmap_data || []);
            setHotspotAnalysis(data.hotspot_analysis || null);
            setTemporalAnalysis(data.temporal_analysis || null);
            
        } catch (error) {
            console.error('[Heatmap] Failed to fetch live analysis:', error);
            // Fallback to local analysis if backend fails
            if (incidents.length > 0) {
                performLocalAnalysis();
            }
        } finally {
            setLoading(false);
        }
    };

    // Perform local analysis with provided incidents
    const performLocalAnalysis = async () => {
        if (incidents.length === 0) return;
        
        setLoading(true);
        try {
            const url = getApiEndpoint('hotspot/analyze');
            const requestData = {
                points: incidents.map(inc => ({
                    lat: inc.latitude,
                    lng: inc.longitude,
                    severity: inc.severity || 'medium',
                    created_at: inc.created_at,
                    incident_type: inc.type
                })),
                radius_km: analysisRadius,
                grid_size: gridSize
            };
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('[Heatmap] Local analysis data:', data);
            
            setHeatmapData(data.heatmap_data || []);
            setHotspotAnalysis(data.hotspot_analysis || null);
            setTemporalAnalysis(data.temporal_analysis || null);
            
        } catch (error) {
            console.error('[Heatmap] Local analysis failed:', error);
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchLiveAnalysis();
    }, [analysisRadius, gridSize]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(fetchLiveAnalysis, 30000);
        return () => clearInterval(interval);
    }, [analysisRadius, gridSize]);

    // Map center calculation
    const getMapCenter = () => {
        if (hotspotAnalysis?.center_point) {
            return [hotspotAnalysis.center_point.lat, hotspotAnalysis.center_point.lng];
        }
        if (userLocation) {
            return [userLocation.latitude, userLocation.longitude];
        }
        return [28.6139, 77.2090]; // Default to Delhi
    };

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'Critical': return <AlertTriangle className="text-red-500" size={16} />;
            case 'High': return <TrendingUp className="text-orange-500" size={16} />;
            case 'Medium': return <Activity className="text-yellow-500" size={16} />;
            default: return <Shield className="text-green-500" size={16} />;
        }
    };

    const getZoneIcon = (zone) => {
        switch (zone) {
            case 'danger': return <AlertTriangle className="text-red-500" size={16} />;
            case 'warning': return <TrendingUp className="text-orange-500" size={16} />;
            case 'caution': return <Activity className="text-yellow-500" size={16} />;
            default: return <Shield className="text-green-500" size={16} />;
        }
    };

    return (
        <div className="h-full w-full flex flex-col bg-gray-900 text-white">
            {/* Header Controls */}
            <div className="p-4 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                        <Target size={24} />
                        ML Hotspot Analysis
                    </h2>
                    <button
                        onClick={fetchLiveAnalysis}
                        disabled={loading}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
                    >
                        {loading ? 'Analyzing...' : 'Refresh Analysis'}
                    </button>
                </div>

                {/* Controls */}
                <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <label className="text-gray-300">Analysis Radius:</label>
                        <select
                            value={analysisRadius}
                            onChange={(e) => setAnalysisRadius(Number(e.target.value))}
                            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                        >
                            <option value={25}>25 km</option>
                            <option value={50}>50 km</option>
                            <option value={100}>100 km</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-gray-300">Grid Resolution:</label>
                        <select
                            value={gridSize}
                            onChange={(e) => setGridSize(Number(e.target.value))}
                            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                        >
                            <option value={0.02}>High (2km)</option>
                            <option value={0.05}>Medium (5km)</option>
                            <option value={0.1}>Low (10km)</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex">
                {/* Map */}
                <div className="flex-1 relative">
                    <MapContainer
                        center={getMapCenter()}
                        zoom={10}
                        style={{ height: '100%', width: '100%' }}
                        className="z-10"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* Heatmap Grid Cells */}
                        {heatmapData.map((cell, index) => {
                            const zoneConfig = zoneColors[cell.zone] || zoneColors.safe;
                            return (
                                <Rectangle
                                    key={index}
                                    bounds={[
                                        [cell.lat, cell.lng],
                                        [cell.lat_end, cell.lng_end]
                                    ]}
                                    pathOptions={{
                                        color: zoneConfig.color,
                                        fillColor: zoneConfig.color,
                                        fillOpacity: zoneConfig.opacity,
                                        weight: 1
                                    }}
                                >
                                    <Popup>
                                        <div className="text-gray-900 p-2">
                                            <div className="font-bold text-lg mb-2 flex items-center gap-2">
                                                {getZoneIcon(cell.zone)}
                                                {zoneConfig.name}
                                            </div>
                                            <div className="space-y-1 text-sm">
                                                <div>Risk Intensity: <span className="font-bold">{cell.intensity}%</span></div>
                                                <div>Incidents: <span className="font-bold">{cell.incident_count}</span></div>
                                                <div>Zone: <span className="font-bold capitalize">{cell.zone}</span></div>
                                                <div>Grid Size: <span className="font-bold">{(cell.grid_size * 111).toFixed(1)} km</span></div>
                                            </div>
                                        </div>
                                    </Popup>
                                </Rectangle>
                            );
                        })}

                        {/* Hotspot Center */}
                        {hotspotAnalysis?.center_point && (
                            <Circle
                                center={[hotspotAnalysis.center_point.lat, hotspotAnalysis.center_point.lng]}
                                radius={analysisRadius * 1000}
                                pathOptions={{
                                    color: '#FF0000',
                                    fillColor: '#FF0000',
                                    fillOpacity: 0.1,
                                    weight: 2,
                                    dashArray: '10, 10'
                                }}
                            >
                                <Popup>
                                    <div className="text-gray-900 p-2">
                                        <div className="font-bold text-lg mb-2">Hotspot Center</div>
                                        <div className="text-sm">
                                            <div>Analysis Radius: {analysisRadius} km</div>
                                            <div>Strength: {hotspotAnalysis.hotspot_strength}</div>
                                        </div>
                                    </div>
                                </Popup>
                            </Circle>
                        )}

                        {/* User Location */}
                        {userLocation && (
                            <Circle
                                center={[userLocation.latitude, userLocation.longitude]}
                                radius={1000}
                                pathOptions={{
                                    color: '#00BFFF',
                                    fillColor: '#00BFFF',
                                    fillOpacity: 0.5,
                                    weight: 2
                                }}
                            >
                                <Popup>
                                    <div className="text-gray-900 p-2">
                                        <div className="font-bold">Your Location</div>
                                    </div>
                                </Popup>
                            </Circle>
                        )}
                    </MapContainer>

                    {/* Loading Overlay */}
                    {loading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
                            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                                <div className="flex items-center gap-3">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
                                    <span className="text-white">Analyzing hotspots...</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Analysis Panel */}
                <div className="w-80 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
                    <h3 className="text-lg font-bold text-cyan-400 mb-4">Analysis Results</h3>

                    {/* Hotspot Analysis */}
                    {hotspotAnalysis && (
                        <div className="mb-6 p-3 bg-gray-700 rounded-lg border border-gray-600">
                            <h4 className="font-bold mb-2 flex items-center gap-2">
                                {getSeverityIcon(hotspotAnalysis.hotspot_strength)}
                                Hotspot Detection
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Status:</span>
                                    <span className={`font-bold ${hotspotAnalysis.hotspot_detected ? 'text-red-400' : 'text-green-400'}`}>
                                        {hotspotAnalysis.hotspot_detected ? 'DETECTED' : 'NONE'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Strength:</span>
                                    <span className="font-bold">{hotspotAnalysis.hotspot_strength}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Risk Score:</span>
                                    <span className="font-bold">{hotspotAnalysis.risk_score}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Clustered Points:</span>
                                    <span className="font-bold">{hotspotAnalysis.clustered_points}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Zone:</span>
                                    <span className={`font-bold capitalize ${
                                        hotspotAnalysis.zone_classification === 'danger' ? 'text-red-400' :
                                        hotspotAnalysis.zone_classification === 'warning' ? 'text-orange-400' :
                                        hotspotAnalysis.zone_classification === 'caution' ? 'text-yellow-400' :
                                        'text-green-400'
                                    }`}>
                                        {hotspotAnalysis.zone_classification}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Temporal Analysis */}
                    {temporalAnalysis && (
                        <div className="mb-6 p-3 bg-gray-700 rounded-lg border border-gray-600">
                            <h4 className="font-bold mb-2 flex items-center gap-2">
                                <TrendingUp size={16} />
                                Temporal Trends
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Trend:</span>
                                    <span className={`font-bold capitalize ${
                                        temporalAnalysis.trend === 'increasing' ? 'text-red-400' :
                                        temporalAnalysis.trend === 'decreasing' ? 'text-green-400' :
                                        'text-yellow-400'
                                    }`}>
                                        {temporalAnalysis.trend}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Forecast:</span>
                                    <span className="font-bold capitalize">{temporalAnalysis.forecast}</span>
                                </div>
                                {temporalAnalysis.total_recent && (
                                    <div className="flex justify-between">
                                        <span>Recent Incidents:</span>
                                        <span className="font-bold">{temporalAnalysis.total_recent}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Zone Legend */}
                    <div className="p-3 bg-gray-700 rounded-lg border border-gray-600">
                        <h4 className="font-bold mb-2">Zone Legend</h4>
                        <div className="space-y-2">
                            {Object.entries(zoneColors).map(([zone, config]) => (
                                <div key={zone} className="flex items-center gap-2 text-sm">
                                    <div
                                        className="w-4 h-4 rounded border border-gray-500"
                                        style={{ backgroundColor: config.color, opacity: config.opacity }}
                                    ></div>
                                    <span className="capitalize">{config.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Statistics */}
                    <div className="mt-4 p-3 bg-gray-700 rounded-lg border border-gray-600">
                        <h4 className="font-bold mb-2">Statistics</h4>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span>Heatmap Cells:</span>
                                <span className="font-bold">{heatmapData.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Analysis Radius:</span>
                                <span className="font-bold">{analysisRadius} km</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Grid Resolution:</span>
                                <span className="font-bold">{(gridSize * 111).toFixed(1)} km</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeatmapVisualization;