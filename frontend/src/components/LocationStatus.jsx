import { useState, useEffect } from 'react';
import { MapPin, AlertCircle, CheckCircle, RefreshCw, Settings } from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { motion, AnimatePresence } from 'framer-motion';

const LocationStatus = ({ compact = false, showAddress = false }) => {
    const {
        location,
        isLoading,
        error,
        permissionStatus,
        isSupported,
        requestLocation,
        retryLocation,
        hasLocation,
        isLocationGranted,
        isLocationDenied,
        lastSyncTime,
        getAddressFromCoords
    } = useLocation();

    const [address, setAddress] = useState('');
    const [showDetails, setShowDetails] = useState(false);

    // Get address when location changes
    useEffect(() => {
        if (location && showAddress) {
            getAddressFromCoords(location.latitude, location.longitude)
                .then(setAddress)
                .catch(() => setAddress('Address unavailable'));
        }
    }, [location, showAddress, getAddressFromCoords]);

    if (!isSupported) {
        return (
            <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Geolocation not supported</span>
            </div>
        );
    }

    const getStatusColor = () => {
        if (isLoading) return 'text-yellow-400';
        if (isLocationGranted && hasLocation) return 'text-green-400';
        if (isLocationDenied || error) return 'text-red-400';
        return 'text-gray-400';
    };

    const getStatusIcon = () => {
        if (isLoading) return <RefreshCw className="w-4 h-4 animate-spin" />;
        if (isLocationGranted && hasLocation) return <CheckCircle className="w-4 h-4" />;
        if (isLocationDenied || error) return <AlertCircle className="w-4 h-4" />;
        return <MapPin className="w-4 h-4" />;
    };

    const getStatusText = () => {
        if (isLoading) return 'Getting location...';
        if (isLocationGranted && hasLocation) return 'Location active';
        if (isLocationDenied) return 'Location denied';
        if (error) return 'Location error';
        return 'Location inactive';
    };

    const handleRetry = () => {
        if (isLocationDenied) {
            // Show instructions for enabling location
            alert('Please enable location access in your browser settings:\n\n1. Click the location icon in the address bar\n2. Select "Allow" for location access\n3. Refresh the page');
        } else {
            retryLocation(1);
        }
    };

    if (compact) {
        return (
            <div 
                className={`flex items-center gap-2 ${getStatusColor()} cursor-pointer hover:opacity-80 transition-opacity`}
                onClick={() => setShowDetails(!showDetails)}
                title={getStatusText()}
            >
                {getStatusIcon()}
                {!hasLocation && !isLoading && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRetry();
                        }}
                        className="text-xs underline hover:no-underline"
                    >
                        Enable
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={getStatusColor()}>
                        {getStatusIcon()}
                    </div>
                    <span className="font-medium text-white">Location Status</span>
                </div>
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    <Settings className="w-4 h-4" />
                </button>
            </div>

            <div className={`text-sm ${getStatusColor()} mb-2`}>
                {getStatusText()}
            </div>

            {hasLocation && (
                <div className="text-xs text-gray-400 space-y-1">
                    <div>
                        📍 {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </div>
                    <div>
                        🎯 Accuracy: ±{Math.round(location.accuracy)}m
                    </div>
                    {showAddress && address && (
                        <div className="text-gray-300">
                            📍 {address}
                        </div>
                    )}
                    {lastSyncTime && (
                        <div>
                            🔄 Synced: {lastSyncTime.toLocaleTimeString()}
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className="text-xs text-red-400 mt-2 p-2 bg-red-900/20 rounded border border-red-500/30">
                    ⚠️ {error}
                </div>
            )}

            <AnimatePresence>
                {showDetails && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-white/10"
                    >
                        <div className="space-y-2">
                            <button
                                onClick={() => requestLocation(true)}
                                disabled={isLoading}
                                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <MapPin className="w-4 h-4" />
                                )}
                                {isLoading ? 'Getting Location...' : 'Request Location Now'}
                            </button>

                            {(error || isLocationDenied) && (
                                <button
                                    onClick={handleRetry}
                                    className="w-full px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded transition-colors flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Retry Location Access
                                </button>
                            )}

                            <div className="text-xs text-gray-500">
                                <div className="mb-1">Permission: <span className="capitalize">{permissionStatus}</span></div>
                                <div>Required for: Emergency services, Risk assessment, News filtering</div>
                                {!hasLocation && (
                                    <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded text-yellow-300">
                                        ⚠️ Location access is required for full functionality
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LocationStatus;