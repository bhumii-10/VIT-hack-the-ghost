import React, { useEffect } from 'react';
import { MapPin, Satellite, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useLocation } from '../context/LocationContext';

const LocationTracker = ({ onLocationUpdate, showUI = true }) => {
    const {
        location,
        isLoading,
        error,
        permissionStatus,
        isSupported,
        requestLocation,
        retryLocation,
        startWatching,
        stopWatching,
        isWatching,
        hasLocation,
        isLocationGranted,
        isLocationDenied,
        lastSyncTime,
        accuracy
    } = useLocation();

    // Notify parent component when location changes
    useEffect(() => {
        if (location && onLocationUpdate) {
            onLocationUpdate({
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy,
                timestamp: new Date().toISOString()
            });
        }
    }, [location, onLocationUpdate]);

    const getLocationStatus = () => {
        if (isLoading) return 'requesting';
        if (isLocationGranted && hasLocation) return 'active';
        if (isLocationDenied || error) return 'denied';
        return 'inactive';
    };

    const toggleLocationTracking = () => {
        const status = getLocationStatus();
        if (status === 'active') {
            stopWatching();
        } else {
            requestLocation(true);
        }
    };

    const handleRetry = () => {
        if (isLocationDenied) {
            // Show instructions for enabling location
            alert('Please enable location access in your browser settings:\n\n1. Click the location icon in the address bar\n2. Select "Allow" for location access\n3. Refresh the page');
        } else {
            retryLocation(1);
        }
    };

    if (!showUI) {
        return null; // Silent tracking mode
    }

    if (!isSupported) {
        return (
            <div className="bg-black/30 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Geolocation not supported by your browser</span>
                </div>
            </div>
        );
    }

    const locationStatus = getLocationStatus();

    const getStatusIcon = () => {
        switch (locationStatus) {
            case 'active':
                return <CheckCircle className="w-5 h-5 text-green-400" />;
            case 'requesting':
                return <RefreshCw className="w-5 h-5 text-yellow-400 animate-spin" />;
            case 'denied':
            case 'error':
                return <XCircle className="w-5 h-5 text-red-400" />;
            default:
                return <MapPin className="w-5 h-5 text-gray-400" />;
        }
    };

    const getStatusText = () => {
        switch (locationStatus) {
            case 'active':
                return 'Location Active';
            case 'requesting':
                return 'Getting Location...';
            case 'denied':
                return 'Location Denied';
            case 'error':
                return 'Location Error';
            default:
                return 'Location Inactive';
        }
    };

    const getStatusColor = () => {
        switch (locationStatus) {
            case 'active':
                return 'bg-green-500/20 border-green-500/50 text-green-400';
            case 'requesting':
                return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
            case 'denied':
            case 'error':
                return 'bg-red-500/20 border-red-500/50 text-red-400';
            default:
                return 'bg-gray-500/20 border-gray-500/50 text-gray-400';
        }
    };

    return (
        <div className="bg-black/30 backdrop-blur-xl border border-white/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-400" />
                    GPS Tracking
                </h3>
                <button
                    onClick={toggleLocationTracking}
                    className={`px-4 py-2 rounded-lg border font-medium transition-all flex items-center gap-2 ${getStatusColor()}`}
                >
                    {getStatusIcon()}
                    <span>{getStatusText()}</span>
                </button>
            </div>

            {/* Location Details */}
            {hasLocation && location && (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-black/30 p-3 rounded-lg">
                            <div className="text-gray-400 text-xs uppercase">Latitude</div>
                            <div className="text-white font-mono">
                                {location.latitude.toFixed(6)}°
                            </div>
                        </div>
                        <div className="bg-black/30 p-3 rounded-lg">
                            <div className="text-gray-400 text-xs uppercase">Longitude</div>
                            <div className="text-white font-mono">
                                {location.longitude.toFixed(6)}°
                            </div>
                        </div>
                    </div>

                    {location.accuracy && (
                        <div className="bg-black/30 p-3 rounded-lg">
                            <div className="text-gray-400 text-xs uppercase mb-1">GPS Accuracy</div>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                    location.accuracy < 10 ? 'bg-green-400' :
                                    location.accuracy < 50 ? 'bg-yellow-400' : 'bg-red-400'
                                }`}></div>
                                <span className="text-white font-mono">±{Math.round(location.accuracy)}m</span>
                                <span className="text-xs text-gray-400">
                                    ({location.accuracy < 10 ? 'Excellent' : location.accuracy < 50 ? 'Good' : 'Fair'})
                                </span>
                            </div>
                        </div>
                    )}

                    {lastSyncTime && (
                        <div className="text-xs text-gray-400 flex items-center gap-2">
                            <Satellite className="w-3 h-3" />
                            Last synced: {lastSyncTime.toLocaleTimeString()}
                        </div>
                    )}

                    {isWatching && (
                        <div className="text-xs text-green-400 flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            Continuous tracking active
                        </div>
                    )}
                </div>
            )}

            {/* Status Messages */}
            {locationStatus === 'denied' && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        Location access denied
                    </div>
                    <p className="text-xs text-gray-400 mb-3">
                        Enable location services for accurate risk assessment and emergency features.
                    </p>
                    <button
                        onClick={handleRetry}
                        className="px-3 py-1 bg-red-600/20 border border-red-500/30 text-red-400 text-xs rounded hover:bg-red-600/30 transition-colors"
                    >
                        Enable Location
                    </button>
                </div>
            )}

            {error && locationStatus !== 'denied' && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
                        <XCircle className="w-4 h-4" />
                        Location Error
                    </div>
                    <p className="text-xs text-gray-400 mb-3">{error}</p>
                    <button
                        onClick={() => retryLocation(1)}
                        className="px-3 py-1 bg-orange-600/20 border border-orange-500/30 text-orange-400 text-xs rounded hover:bg-orange-600/30 transition-colors flex items-center gap-1"
                    >
                        <RefreshCw className="w-3 h-3" />
                        Retry
                    </button>
                </div>
            )}

            {locationStatus === 'active' && hasLocation && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        GPS tracking active. Your location is being used for accurate risk assessment.
                    </div>
                </div>
            )}

            {!hasLocation && !isLoading && locationStatus === 'inactive' && (
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-400 text-sm mb-2">
                        <MapPin className="w-4 h-4" />
                        Location services inactive
                    </div>
                    <p className="text-xs text-gray-400 mb-3">
                        Enable location tracking for personalized emergency services and risk assessment.
                    </p>
                    <button
                        onClick={() => requestLocation(true)}
                        className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs rounded hover:bg-blue-600/30 transition-colors"
                    >
                        Enable Location
                    </button>
                </div>
            )}
        </div>
    );
};

export default LocationTracker;