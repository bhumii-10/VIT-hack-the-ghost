import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { getApiEndpoint } from '../lib/api';

function Marker({ position, type, label }) {
    const ref = useRef();

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        // Pulse effect
        if (ref.current) {
            ref.current.scale.setScalar(1 + Math.sin(t * 1.5) * 0.2);
        }
    });

    // Color logic
    const color = type === 'critical' ? '#ff2a2a' : (type === 'warning' ? '#ff8800' : '#00ff41');

    return (
        <group position={position}>
            {/* 3D Pulse Circle */}
            <mesh ref={ref}>
                <ringGeometry args={[0.02, 0.03, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.8} />
            </mesh>
            <mesh>
                <circleGeometry args={[0.015, 32]} />
                <meshBasicMaterial color={color} />
            </mesh>

            {/* Optional HTML Label on hover/always */}
            {/* <Html distanceFactor={10}>
                <div className="text-xs bg-black/50 p-1 rounded text-white whitespace-nowrap backdrop-blur-sm">
                    {label}
                </div>
            </Html> */}
        </group>
    );
}

// Helper to convert Lat/Lon to Vector3
const latLonToVector3 = (lat, lon, radius) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));
    return [x, y, z];
}

export const CrisisMarkers = () => {
    const [incidents, setIncidents] = React.useState([]);

    React.useEffect(() => {
        const fetchMarkers = async () => {
            const url = getApiEndpoint('crisis/active');
            console.log(`[CrisisMarkers] Fetching from: ${url}`);

            try {
                const res = await fetch(url);
                if (!res.ok) {
                    console.error('[CrisisMarkers] HTTP error:', res.status);
                    throw new Error(`HTTP error! status: ${res.status}`);
                }

                const data = await res.json();
                console.log('[CrisisMarkers] Data received:', data);
                const crises = data.crises || [];
                console.log('[CrisisMarkers] Crises count:', crises.length);

                const mapped = crises.map(c => ({
                    id: c.id,
                    lat: c.latitude,
                    lon: c.longitude,
                    type: c.severity,
                    label: c.title
                }));

                if (mapped.length > 0) {
                    console.log('[CrisisMarkers] Setting incidents:', mapped.length);
                    setIncidents(mapped);
                } else {
                    console.warn("[CrisisMarkers] No active crises found");
                }
            } catch (err) {
                console.error("[CrisisMarkers] Fetch failed:", err);
            }
        };

        fetchMarkers();
        // Poll every 10 seconds
        const interval = setInterval(fetchMarkers, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <group rotation={[0, 0, 23.5 * Math.PI / 180]}>
            {incidents.map((incident) => (
                <Marker
                    key={incident.id}
                    position={latLonToVector3(incident.lat, incident.lon, 1.01)}
                    type={incident.type}
                    label={incident.label}
                />
            ))}
        </group>
    )
}
