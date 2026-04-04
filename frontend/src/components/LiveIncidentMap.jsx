import React, { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getApiEndpoint } from '../lib/api';
import { supabase } from '../lib/supabaseClient';

// Fix Leaflet Icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons
const incidentIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const responderIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const broadcastingUserIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Precision Marker Icon (Blue/Draggable)
const precisionIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const RecenterMap = ({ lat, lon }) => {
    const map = useMap();
    useEffect(() => {
        if (lat && lon) map.flyTo([lat, lon], 17); // Zoom in closer for precision
    }, [lat, lon, map]);
    return null;
};

// Component to handle map clicks/zoom to show zones
const MicroZoneLayer = ({ center, isPreciseMode }) => {
    const map = useMap();
    const [zoom, setZoom] = useState(map.getZoom());

    useMapEvents({
        zoomend: () => {
            setZoom(map.getZoom());
        }
    });

    if (!center) return null;

    // Show 40m Zones only when zoomed in or in Precise Mode
    const showZones = isPreciseMode || zoom > 16;

    if (!showZones) return null;

    return (
        <>
            {/* 40m Inner Zone */}
            <Circle
                center={center}
                radius={40}
                pathOptions={{ color: 'cyan', fillOpacity: 0.05, dashArray: '5, 5', weight: 1 }}
            />
            {/* 80m Outer Zone */}
            <Circle
                center={center}
                radius={80}
                pathOptions={{ color: 'cyan', fillOpacity: 0.02, dashArray: '10, 10', weight: 1 }}
            />
            {/* 120m Outer Zone */}
            <Circle
                center={center}
                radius={120}
                pathOptions={{ color: 'cyan', fillOpacity: 0.01, dashArray: '10, 10', weight: 1 }}
            />
        </>
    );
};

const LiveIncidentMap = ({ incidents, responders, broadcastingUsers, userLocation }) => {
    const defaultCenter = [28.6139, 77.2090];
    const initialCenter = userLocation ? [userLocation.latitude, userLocation.longitude] : defaultCenter;

    const [isPreciseMode, setIsPreciseMode] = useState(false);
    const [precisePos, setPrecisePos] = useState(initialCenter);
    const [floorLevel, setFloorLevel] = useState(0);
    const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, synced, offline
    const precisionMarkerRef = useRef(null);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    // Monitor Online Status
    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            attemptSyncQueue();
        };
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Effect to update precise pos when user GPS updates (unless manually dragging)
    useEffect(() => {
        if (userLocation && !isPreciseMode) {
            setPrecisePos([userLocation.latitude, userLocation.longitude]);
        }
    }, [userLocation, isPreciseMode]);

    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = precisionMarkerRef.current;
                if (marker != null) {
                    const newPos = marker.getLatLng();
                    setPrecisePos([newPos.lat, newPos.lng]);
                }
            },
        }),
        [],
    );

    const attemptSyncQueue = async () => {
        const queue = JSON.parse(localStorage.getItem('location_sync_queue') || '[]');
        if (queue.length === 0) return;

        setSyncStatus('syncing');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const url = getApiEndpoint('crisis/location/sync');
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    locations: queue
                })
            });

            if (res.ok) {
                localStorage.removeItem('location_sync_queue');
                setSyncStatus('synced');
                setTimeout(() => setSyncStatus('idle'), 2000);
            }
        } catch (e) {
            console.error("Sync failed", e);
        }
    };

    const handleConfirmLocation = async () => {
        const timestamp = Date.now();
        const payload = {
            latitude: precisePos[0],
            longitude: precisePos[1],
            accuracy: 5, // High accuracy manually confirmed
            timestamp: timestamp,
            floor: floorLevel,
            zone_id: `ZONE-${Math.floor(timestamp / 1000)}` // Mock Zone ID
        };

        if (isOffline) {
            // Save to Queue
            const queue = JSON.parse(localStorage.getItem('location_sync_queue') || '[]');
            queue.push(payload);
            localStorage.setItem('location_sync_queue', JSON.stringify(queue));
            setSyncStatus('offline_saved');
            setTimeout(() => setSyncStatus('idle'), 2000);
        } else {
            // Direct Sync
            setSyncStatus('syncing');
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const url = getApiEndpoint('crisis/location/sync');
                    await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            user_id: user.id,
                            locations: [payload]
                        })
                    });
                    setSyncStatus('synced');
                    setTimeout(() => setSyncStatus('idle'), 2000);
                }
            } catch (e) {
                console.error("Manual sync failed", e);
                // Fallback to queue
                const queue = JSON.parse(localStorage.getItem('location_sync_queue') || '[]');
                queue.push(payload);
                localStorage.setItem('location_sync_queue', JSON.stringify(queue));
            }
        }
        setIsPreciseMode(false);
    };

    return (
        <div className="h-[500px] w-full rounded-lg overflow-hidden border border-gray-600 shadow-lg relative z-10">
            <MapContainer center={initialCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Micro Zones Visualization */}
                <MicroZoneLayer center={precisePos} isPreciseMode={isPreciseMode} />

                {/* Default User Location (GPS) */}
                {userLocation && !isPreciseMode && (
                    <Circle center={[userLocation.latitude, userLocation.longitude]} radius={userLocation.accuracy || 20} pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }} />
                )}

                {/* Precision Marker (Draggable) */}
                {isPreciseMode && (
                    <Marker
                        draggable={true}
                        eventHandlers={eventHandlers}
                        position={precisePos}
                        ref={precisionMarkerRef}
                        icon={precisionIcon}
                    >
                        <Popup>
                            Drag to your exact location.<br />
                            <div className="mt-2 text-xs">
                                Lat: {precisePos[0].toFixed(5)}<br />
                                Lon: {precisePos[1].toFixed(5)}
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Recenter Helper (only initially or if not precise dragging) */}
                {!isPreciseMode && <RecenterMap lat={initialCenter[0]} lon={initialCenter[1]} />}

                {/* Incidents */}
                {incidents.map(inc => (
                    <Marker key={inc.id} position={[inc.latitude, inc.longitude]} icon={incidentIcon}>
                        <Popup>
                            <div className="text-gray-900">
                                <h3 className="font-bold text-red-600">{inc.title}</h3>
                                <p className="text-sm">{inc.description}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Responders & SOS Users omitted for brevity, keeping existing logic normally... 
                   (Re-adding them to maintain functionality as requested)
                */}
                {responders && responders.map(resp => (
                    <Marker key={resp.id} position={[resp.lat, resp.lon]} icon={responderIcon}>
                        <Popup><h3 className="text-green-600 font-bold">{resp.name}</h3></Popup>
                    </Marker>
                ))}
                {broadcastingUsers && broadcastingUsers.map(u => (
                    <Marker key={u.id} position={[u.last_latitude, u.last_longitude]} icon={broadcastingUserIcon}>
                        <Popup>
                            <div className="text-gray-900">
                                <h3 className="font-bold text-yellow-600">🆘 SOS: {u.full_name}</h3>
                                <p className="text-xs">Location shared in real-time</p>
                                {(u.floor_level !== undefined || u.micro_zone_id) && (
                                    <div className="mt-2 text-xs font-mono bg-yellow-100 p-1 rounded border border-yellow-300">
                                        {u.floor_level !== undefined && <div>🏢 Floor: {u.floor_level === 0 ? 'Ground' : u.floor_level}</div>}
                                        {u.micro_zone_id && <div>🎯 Zone: {u.micro_zone_id}</div>}
                                    </div>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}

            </MapContainer>

            {/* Precision Mode Controls Upgrade */}
            <div className="absolute bottom-4 left-4 z-[500] flex flex-col gap-2">
                <button
                    onClick={() => setIsPreciseMode(!isPreciseMode)}
                    className={`px-4 py-2 rounded shadow-lg font-bold text-xs uppercase transition-colors ${isPreciseMode ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'}`}
                >
                    {isPreciseMode ? 'Cancel Precision Mode' : '📍 Improve Accuracy'}
                </button>

                {isPreciseMode && (
                    <div className="bg-white/90 backdrop-blur p-4 rounded shadow-lg border border-blue-500 w-64 animate-in fade-in slide-in-from-bottom-4">
                        <h4 className="text-blue-900 font-bold text-sm mb-2">Micro-Location Adjustment</h4>
                        <div className="text-xs text-gray-600 mb-2">
                            Drag the blue marker to your exact point in the building.
                        </div>

                        <label className="block text-xs font-bold text-gray-700 mb-1">Floor Level</label>
                        <select
                            value={floorLevel}
                            onChange={(e) => setFloorLevel(parseInt(e.target.value))}
                            className="w-full text-black border rounded p-1 text-sm mb-3"
                        >
                            <option value="0">Ground Floor</option>
                            <option value="1">1st Floor</option>
                            <option value="2">2nd Floor</option>
                            <option value="-1">Basement 1</option>
                        </select>

                        <button
                            onClick={handleConfirmLocation}
                            className="w-full py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded text-xs uppercase"
                        >
                            Confirm Precision
                        </button>
                    </div>
                )}
            </div>

            {/* Sync Status Badge */}
            {(syncStatus !== 'idle' || isOffline) && (
                <div className="absolute top-4 right-16 z-[500] bg-black/80 text-white text-xs px-3 py-1 rounded-full border border-white/20">
                    {isOffline && "🔌 Offline Mode • "}
                    {syncStatus === 'syncing' && "🔄 Syncing..."}
                    {syncStatus === 'synced' && "✅ Location Synced"}
                    {syncStatus === 'offline_saved' && "💾 Saved Locally"}
                </div>
            )}
        </div>
    );
};

export default LiveIncidentMap;
