import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { getApiEndpoint } from '../lib/api';
import LiveIncidentMap from './LiveIncidentMap';
import IncidentChat from './IncidentChat';
import IncidentReport from './IncidentReport';
import { AlertTriangle, Activity, Volume2, Bell, CheckCircle } from 'lucide-react';
import TranslatedText from './TranslatedText';
import DisasterIntelligencePanel from './DisasterIntelligencePanel';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const CrisisDashboard = () => {
    const { user } = useAuth();
    const { location: gpsLocation, hasLocation } = useLocation();
    const [activeCrises, setActiveCrises] = useState([]);
    const [agencies, setAgencies] = useState([]);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard', 'report', 'details'
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [broadcastingUsers, setBroadcastingUsers] = useState([]);

    // Initial Data Fetch
    useEffect(() => {
        fetchActiveCrises();
        fetchBroadcastingUsers();

        // --- SUPABASE REALTIME SUBSCRIPTION (Incidents) ---
        const incidentChannel = supabase
            .channel('public:incidents')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'incidents' },
                (payload) => {
                    const newIncident = payload.new;
                    setActiveCrises(prev => {
                        if (prev.find(i => i.id === newIncident.id)) return prev;
                        return [...prev, newIncident];
                    });

                    if (hasLocation && gpsLocation) {
                        const dist = calculateDistance(
                            gpsLocation.latitude,
                            gpsLocation.longitude,
                            newIncident.latitude,
                            newIncident.longitude
                        );
                        if (dist <= 5) {
                            new Audio('/alert.mp3').play().catch(() => { });
                            alert(`🚨 PROXIMITY ALERT: ${newIncident.title} reported within ${dist.toFixed(1)}km!`);
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'incidents' },
                (payload) => {
                    setActiveCrises(prev => prev.map(c => c.id === payload.new.id ? payload.new : c));
                }
            )
            .subscribe();

        // --- SUPABASE REALTIME SUBSCRIPTION (Broadcasting Users & Agencies) ---
        const profileChannel = supabase
            .channel('public:profiles')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'profiles' },
                () => {
                    fetchBroadcastingUsers();
                }
            )
            .subscribe();

        const handleMessage = (event) => {
            if (event.data === 'incident-reported') {
                fetchActiveCrises();
            }
        };
        window.addEventListener('message', handleMessage);

        return () => {
            supabase.removeChannel(incidentChannel);
            supabase.removeChannel(profileChannel);
            window.removeEventListener('message', handleMessage);
        };
    }, [hasLocation, gpsLocation]);

    // Handle SOS Broadcasting
    useEffect(() => {
        if (isBroadcasting && user && hasLocation && gpsLocation) {
            // Use the location from LocationContext and update database
            const updateLocation = async () => {
                const { latitude, longitude } = gpsLocation;
                await supabase
                    .from('profiles')
                    .update({
                        is_broadcasting: true,
                        last_latitude: latitude,
                        last_longitude: longitude
                    })
                    .eq('id', user.id);
            };

            updateLocation();

            // Set up periodic updates every 30 seconds while broadcasting
            const interval = setInterval(updateLocation, 30000);

            return () => {
                clearInterval(interval);
            };
        } else if (user) {
            // Stop broadcasting
            supabase
                .from('profiles')
                .update({ is_broadcasting: false })
                .eq('id', user.id);
        }
    }, [isBroadcasting, user, hasLocation, gpsLocation]);

    const fetchBroadcastingUsers = async () => {
        // 1. Fetch SOS Users
        const { data: sosData } = await supabase
            .from('profiles')
            .select('id, full_name, last_latitude, last_longitude, floor_level, micro_zone_id')
            .eq('is_broadcasting', true);

        setBroadcastingUsers(sosData?.filter(u => u.id !== user?.id) || []);

        // 2. Fetch Responders/Agencies (Assuming all agencies are "active" for now)
        const { data: agencyData } = await supabase
            .from('profiles')
            .select('id, full_name, role, last_latitude, last_longitude')
            .eq('role', 'agency');

        // Map to format expected by LiveIncidentMap responders prop
        const mappedAgencies = agencyData?.map(a => ({
            id: a.id,
            name: a.full_name,
            type: a.role,
            lat: a.last_latitude,
            lon: a.last_longitude
        })).filter(a => a.lat && a.lon) || [];

        setAgencies(mappedAgencies);
    };

    const fetchActiveCrises = async () => {
        try {
            const url = getApiEndpoint('crisis/active');
            const res = await fetch(url);
            if (!res.ok) {
                console.error('Crisis fetch failed:', res.status, res.statusText);
                return [];
            }
            const data = await res.json();
            const crises = data.crises || [];
            setActiveCrises(crises);
            return crises;
        } catch (e) {
            console.error("Failed to fetch crises", e);
            return [];
        }
    };

    const handleAccept = async (incidentId) => {
        if (!user) return;
        try {
            const formData = new FormData();
            formData.append('responder_id', user.id);

            const url = getApiEndpoint(`crisis/${incidentId}/accept`);
            const res = await fetch(url, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setSelectedIncident(data.incident);
                fetchActiveCrises();
            } else {
                alert("Failed to accept incident");
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="h-full w-full bg-transparent pt-4 pb-8 px-4 md:px-8 overflow-y-auto lg:overflow-hidden flex flex-col pointer-events-auto text-white">
            <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-8 overflow-visible lg:overflow-hidden">

                {/* LEFT PANEL: MAP & INCIDENT LIST */}
                <div className="w-full lg:flex-[2] flex flex-col gap-4 min-h-[500px] lg:min-h-0">
                    {/* Map */}
                    <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
                        <LiveIncidentMap
                            incidents={activeCrises}
                            responders={agencies}
                            broadcastingUsers={broadcastingUsers}
                            userLocation={hasLocation && gpsLocation ? { latitude: gpsLocation.latitude, longitude: gpsLocation.longitude } : null}
                        />
                        <div className="absolute top-4 left-4 z-[400]">
                            <button
                                onClick={() => setIsBroadcasting(!isBroadcasting)}
                                className={`px-4 py-2 rounded-full font-bold shadow-lg transition-all flex items-center gap-2 border-2 ${isBroadcasting ? 'bg-red-600 border-red-400 text-white animate-pulse' : 'bg-gray-900 border-gray-600 text-gray-400 hover:border-red-500 hover:text-red-500'}`}
                            >
                                <Volume2 size={18} />
                                {isBroadcasting ? 'BROADCASTING SOS' : 'BROADCAST SOS'}
                            </button>
                        </div>
                        <div className="absolute top-4 right-4 z-[400] bg-black/80 backdrop-blur-md px-3 py-1 rounded border border-white/10 text-[10px] text-cyan-400 font-mono uppercase">
                            Satellite Link: Active
                        </div>
                    </div>

                    {/* Active Incident List */}
                    <div className="h-[200px] bg-gray-900/80 backdrop-blur rounded-xl p-4 border border-white/10 overflow-y-auto custom-scrollbar">
                        <h3 className="text-sm font-bold mb-2 flex items-center gap-2 uppercase tracking-wider text-red-500">
                            <Activity size={16} /> Active Zones ({activeCrises.length})
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {activeCrises.map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => { setSelectedIncident(c); setViewMode('details'); }}
                                    className={`p-3 rounded border cursor-pointer transition-all ${selectedIncident?.id === c.id ? 'bg-red-900/40 border-red-500' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                >
                                    <TranslatedText text={c.title} className="font-bold text-sm truncate" as="div" />
                                    <div className="text-[10px] text-gray-400 flex justify-between">
                                        <TranslatedText text={c.type} as="span" />
                                        <span className={`uppercase font-bold ${c.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'}`}>{c.severity}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: DETAILS, CHAT, OR REPORT FORM */}
                <div className="flex-1 flex flex-col gap-4 bg-gray-900/90 backdrop-blur rounded-2xl p-4 border border-white/10 shadow-2xl overflow-hidden">

                    {/* AI Intelligence Header */}
                    <div className="flex-shrink-0">
                        <DisasterIntelligencePanel />
                    </div>

                    {/* Mode Switcher */}
                    <div className="flex border-b border-gray-700 pb-2 mb-2">
                        <button
                            onClick={() => { setSelectedIncident(null); setViewMode('report'); }}
                            className={`flex-1 pb-2 text-sm font-bold uppercase tracking-wider ${viewMode === 'report' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-500 hover:text-white'}`}
                        >
                            Report Incident
                        </button>
                        <button
                            onClick={() => setViewMode('details')}
                            className={`flex-1 pb-2 text-sm font-bold uppercase tracking-wider ${viewMode === 'details' || selectedIncident ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-white'}`}
                        >
                            Incident Details
                        </button>
                    </div>

                    {viewMode === 'details' && selectedIncident ? (
                        <>
                            <div className="border-b border-gray-700 pb-4">
                                <TranslatedText text={selectedIncident.title} className="text-xl font-bold text-red-500 mb-1" as="h2" />
                                <TranslatedText text={selectedIncident.description} className="text-sm text-gray-300 mb-2" as="p" />
                                <div className="flex gap-2 text-[10px] font-mono uppercase">
                                    <span className="bg-gray-800 px-2 py-1 rounded text-red-400">Sev: {selectedIncident.severity}</span>
                                    <span className="bg-gray-800 px-2 py-1 rounded text-blue-400">Status: {selectedIncident.status}</span>
                                    {hasLocation && gpsLocation && (
                                        <span className="bg-gray-800 px-2 py-1 rounded text-green-400">
                                            Dist: {calculateDistance(gpsLocation.latitude, gpsLocation.longitude, selectedIncident.latitude, selectedIncident.longitude).toFixed(1)}km
                                        </span>
                                    )}
                                </div>

                                {selectedIncident.status === 'pending' && (
                                    <button
                                        onClick={() => handleAccept(selectedIncident.id)}
                                        className="mt-4 w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 animate-pulse"
                                    >
                                        <CheckCircle size={18} /> INITIALIZE RESPONSE
                                    </button>
                                )}

                                {selectedIncident.ai_analysis && (
                                    <div className="mt-3 bg-blue-900/20 p-2 rounded border border-blue-500/30 text-xs">
                                        <strong className="text-blue-400 block mb-1">AI Tactical Analysis:</strong>
                                        <TranslatedText text={selectedIncident.ai_analysis.reasoning} />
                                    </div>
                                )}
                            </div>

                            {/* CHAT ROOM */}
                            <div className="flex-1 overflow-hidden flex flex-col">
                                <div className="text-xs font-bold text-gray-500 uppercase mb-2">Secure Channel</div>
                                <IncidentChat incidentId={selectedIncident.id} />
                            </div>
                        </>
                    ) : viewMode === 'report' ? (
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <IncidentReport onSuccess={async (newId) => {
                                // Refresh data
                                const freshCrises = await fetchActiveCrises();

                                // Select new incident correctly from fresh data
                                if (newId) {
                                    const match = freshCrises.find(i => String(i.id) === String(newId));
                                    if (match) setSelectedIncident(match);
                                }
                                setViewMode('details');
                            }} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                            <AlertTriangle size={48} className="opacity-20" />
                            <div className="text-center">
                                <p className="font-bold">NO SECTOR SELECTED</p>
                                <p className="text-xs">Select an incident to view details.</p>
                                <button onClick={() => setViewMode('report')} className="mt-4 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded hover:bg-red-500">
                                    REPORT NEW INCIDENT
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CrisisDashboard;