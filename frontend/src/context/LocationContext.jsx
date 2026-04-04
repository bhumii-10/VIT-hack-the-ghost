import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

const LocationContext = createContext();

export const useLocation = () => {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
};

export const LocationProvider = ({ children }) => {
    const { user } = useAuth();
    const [location, setLocation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'granted', 'denied', 'prompt'
    const [watchId, setWatchId] = useState(null);
    const [lastSyncTime, setLastSyncTime] = useState(null);

    // Check if geolocation is supported
    const isSupported = 'geolocation' in navigator;

    // Computed values
    const hasLocation = !!location;
    const isLocationGranted = permissionStatus === 'granted';
    const isLocationDenied = permissionStatus === 'denied';

    // Sync location with database (now with full column support)
    const syncLocationWithDB = useCallback(async (locationData) => {
        if (!user || !locationData) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    last_latitude: locationData.latitude,
                    last_longitude: locationData.longitude,
                    last_location_accuracy: locationData.accuracy,
                    last_location_timestamp: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) {
                console.error('Location sync error:', error);
            } else {
                setLastSyncTime(new Date());
                console.log('Location synced with database:', {
                    latitude: locationData.latitude,
                    longitude: locationData.longitude,
                    accuracy: locationData.accuracy
                });
            }
        } catch (err) {
            console.error('Database sync failed:', err);
        }
    }, [user]);

    // Get current position with enhanced error handling
    const getCurrentPosition = useCallback((options = {}) => {
        return new Promise((resolve, reject) => {
            if (!isSupported) {
                reject(new Error('Geolocation is not supported by this browser'));
                return;
            }

            const defaultOptions = {
                enableHighAccuracy: true,
                timeout: 15000, // 15 seconds
                maximumAge: 300000, // 5 minutes
                ...options
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const locationData = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        altitude: position.coords.altitude,
                        altitudeAccuracy: position.coords.altitudeAccuracy,
                        heading: position.coords.heading,
                        speed: position.coords.speed,
                        timestamp: position.timestamp
                    };
                    resolve(locationData);
                },
                (error) => {
                    let errorMessage = 'Location access failed';
                    
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Location access denied by user';
                            setPermissionStatus('denied');
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Location information unavailable';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Location request timeout. Please try again.';
                            break;
                        default:
                            errorMessage = 'Unknown location error occurred';
                            break;
                    }
                    
                    reject(new Error(errorMessage));
                },
                defaultOptions
            );
        });
    }, [isSupported]);

    // Request location permission and get initial position
    const requestLocation = useCallback(async (showToast = true) => {
        if (!isSupported) {
            const error = 'Geolocation not supported';
            setError(error);
            if (showToast) toast.error(error);
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Check permission status first
            if ('permissions' in navigator) {
                const permission = await navigator.permissions.query({ name: 'geolocation' });
                setPermissionStatus(permission.state);
                
                if (permission.state === 'denied') {
                    localStorage.setItem('location-denied', 'true');
                    localStorage.setItem('last-location-request', Date.now().toString());
                    throw new Error('Location permission denied. Please enable location access in your browser settings.');
                }
            }

            const locationData = await getCurrentPosition();
            
            setLocation(locationData);
            setPermissionStatus('granted');
            
            // Clear denial flags on success
            localStorage.removeItem('location-denied');
            localStorage.removeItem('last-location-request');
            
            // Sync with database
            await syncLocationWithDB(locationData);
            
            if (showToast) {
                toast.success('Location access granted successfully');
            }
            
            return true;
        } catch (err) {
            const errorMessage = err.message;
            setError(errorMessage);
            
            // Store denial info
            localStorage.setItem('location-denied', 'true');
            localStorage.setItem('last-location-request', Date.now().toString());
            
            if (showToast) {
                toast.error(errorMessage, {
                    action: {
                        label: 'Retry',
                        onClick: () => requestLocation(true)
                    },
                    duration: 10000
                });
            }
            
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [isSupported, getCurrentPosition, syncLocationWithDB]);

    // Start watching position changes
    const startWatching = useCallback(() => {
        if (!isSupported || watchId) return;

        const options = {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 60000 // 1 minute
        };

        const id = navigator.geolocation.watchPosition(
            (position) => {
                const locationData = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    altitude: position.coords.altitude,
                    altitudeAccuracy: position.coords.altitudeAccuracy,
                    heading: position.coords.heading,
                    speed: position.coords.speed,
                    timestamp: position.timestamp
                };
                
                setLocation(locationData);
                syncLocationWithDB(locationData);
            },
            (error) => {
                console.error('Location watch error:', error);
                // Don't show toast for watch errors to avoid spam
            },
            options
        );

        setWatchId(id);
        console.log('Location watching started');
    }, [isSupported, watchId, syncLocationWithDB]);

    // Stop watching position changes
    const stopWatching = useCallback(() => {
        if (watchId) {
            navigator.geolocation.clearWatch(watchId);
            setWatchId(null);
            console.log('Location watching stopped');
        }
    }, [watchId]);

    // Retry location access with progressive timeout
    const retryLocation = useCallback(async (attempt = 1) => {
        const maxAttempts = 3;
        const timeouts = [10000, 20000, 30000]; // Progressive timeouts
        
        if (attempt > maxAttempts) {
            toast.error('Unable to access location after multiple attempts. Please check your browser settings.');
            return false;
        }

        toast.info(`Attempting to get location (${attempt}/${maxAttempts})...`);
        
        try {
            const locationData = await getCurrentPosition({ 
                timeout: timeouts[attempt - 1] 
            });
            
            setLocation(locationData);
            setPermissionStatus('granted');
            await syncLocationWithDB(locationData);
            
            toast.success('Location access successful!');
            return true;
        } catch (err) {
            console.error(`Location attempt ${attempt} failed:`, err);
            
            if (attempt < maxAttempts) {
                setTimeout(() => retryLocation(attempt + 1), 2000);
            } else {
                setError(err.message);
                toast.error('Location access failed. Some features may be limited.');
            }
            
            return false;
        }
    }, [getCurrentPosition, syncLocationWithDB]);

    // Initialize location on mount - smarter approach
    useEffect(() => {
        if (user && isSupported) {
            // Check if user has previously denied location
            const locationDenied = localStorage.getItem('location-denied');
            const lastLocationRequest = localStorage.getItem('last-location-request');
            const now = Date.now();
            const oneHour = 60 * 60 * 1000;

            // Don't auto-request if user denied recently (within 1 hour)
            if (locationDenied && lastLocationRequest && (now - parseInt(lastLocationRequest)) < oneHour) {
                console.log('Skipping auto location request - user recently denied');
                return;
            }

            // Auto-request location on app start
            requestLocation(false).then((success) => {
                if (success) {
                    startWatching();
                    localStorage.removeItem('location-denied');
                } else {
                    localStorage.setItem('location-denied', 'true');
                    localStorage.setItem('last-location-request', now.toString());
                }
            });
        }

        // Cleanup on unmount
        return () => {
            stopWatching();
        };
    }, [user, isSupported, requestLocation, startWatching, stopWatching]);

    // Smart location request on user interaction (only if needed)
    useEffect(() => {
        const handleUserInteraction = () => {
            if (user && isSupported && !hasLocation && !isLoading) {
                const locationDenied = localStorage.getItem('location-denied');
                const lastLocationRequest = localStorage.getItem('last-location-request');
                const now = Date.now();
                const tenMinutes = 10 * 60 * 1000;

                // Only request if user hasn't denied recently
                if (!locationDenied || !lastLocationRequest || (now - parseInt(lastLocationRequest)) > tenMinutes) {
                    console.log('User interaction detected, requesting location...');
                    requestLocation(false);
                }
            }
        };

        // Listen for user interactions (less aggressive)
        const events = ['click'];
        let interactionCount = 0;
        const maxInteractions = 3; // Only try 3 times per session

        const throttledHandler = () => {
            interactionCount++;
            if (interactionCount <= maxInteractions) {
                handleUserInteraction();
            }
        };

        events.forEach(event => {
            document.addEventListener(event, throttledHandler, { once: true });
        });

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, throttledHandler);
            });
        };
    }, [user, isSupported, hasLocation, isLoading, requestLocation]);

    // Periodic location refresh (only if already granted)
    useEffect(() => {
        if (user && hasLocation && isLocationGranted) {
            const interval = setInterval(() => {
                console.log('Periodic location refresh...');
                requestLocation(false);
            }, 10 * 60 * 1000); // 10 minutes instead of 5

            return () => clearInterval(interval);
        }
    }, [user, hasLocation, isLocationGranted, requestLocation]);

    // Calculate distance between two points (Haversine formula)
    const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // Distance in kilometers
    }, []);

    // Get formatted address from coordinates (reverse geocoding)
    const getAddressFromCoords = useCallback(async (lat, lng) => {
        try {
            // Using a free geocoding service (you can replace with Google Maps API if available)
            const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
            );
            const data = await response.json();
            return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        } catch (error) {
            console.error('Geocoding error:', error);
            return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
    }, []);

    const value = {
        // State
        location,
        isLoading,
        error,
        permissionStatus,
        isSupported,
        isWatching: !!watchId,
        lastSyncTime,

        // Actions
        requestLocation,
        retryLocation,
        startWatching,
        stopWatching,
        getCurrentPosition,
        
        // Utilities
        calculateDistance,
        getAddressFromCoords,
        
        // Computed values
        hasLocation,
        isLocationGranted,
        isLocationDenied,
        
        // Quick access to coordinates
        latitude: location?.latitude,
        longitude: location?.longitude,
        accuracy: location?.accuracy
    };

    return (
        <LocationContext.Provider value={value}>
            {children}
        </LocationContext.Provider>
    );
};

export default LocationProvider;