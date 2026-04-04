import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useEarthTextures } from '../hooks/useEarthTextures';
import AsteroidField from './AsteroidField';
import OrbitalRings from './OrbitalRings';

const EarthScene = ({ setRotation }) => {
    const earthRef = useRef();
    const cloudsRef = useRef();
    const groupRef = useRef();
    const wireframeRef = useRef();
    const glowRef = useRef();

    // Load textures
    const { colorMap, normalMap, specularMap, cloudsMap, lightsMap } = useEarthTextures();

    useFrame(({ clock }) => {
        const elapsedTime = clock.getElapsedTime();

        // Rotate Earth slowly
        if (earthRef.current) {
            earthRef.current.rotation.y = elapsedTime / 10;
        }

        // Rotate Wireframe together
        if (wireframeRef.current) {
            wireframeRef.current.rotation.y = elapsedTime / 10;
        }

        // Rotate Clouds slightly faster/independently
        if (cloudsRef.current) {
            cloudsRef.current.rotation.y = elapsedTime / 8;
        }
    });

    return (
        <group ref={groupRef} rotation={[0, 0, 23.5 * Math.PI / 180]} >
            {/* Sun Glow - Ambient Lighting from behind */}
            <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
            <pointLight position={[-10, -10, -5]} intensity={0.3} color="#ff6b9d" />

            {/* Outer Glow Aura */}
            <mesh scale={[1.15, 1.15, 1.15]}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshBasicMaterial
                    color="#4db5ff"
                    transparent
                    opacity={0.15}
                    side={THREE.BackSide}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* Atmosphere Glow */}
            <mesh scale={[1.02, 1.02, 1.02]}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshBasicMaterial
                    color="#4db5ff"
                    transparent
                    opacity={0.1}
                    side={THREE.BackSide}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* Clouds Layer */}
            <mesh ref={cloudsRef} scale={[1.005, 1.005, 1.005]}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshStandardMaterial
                    map={cloudsMap}
                    transparent={true}
                    opacity={0.4}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Earth Sphere - Using Phong for Specular Map support */}
            <mesh ref={earthRef}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshPhongMaterial
                    map={colorMap}
                    normalMap={normalMap}
                    specularMap={specularMap}
                    shininess={5}
                />
            </mesh>

            {/* Wireframe Overlay for "Global Lines" Visibility */}
            <mesh ref={wireframeRef} scale={[1.002, 1.002, 1.002]}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshBasicMaterial
                    color="#0044aa" // Deep blue/darker contrast
                    wireframe={true}
                    transparent={true}
                    opacity={0.15} // Visible but not overwhelming
                />
            </mesh>

            {/* Night Lights (Optional - overlay) */}
            <mesh scale={[1.001, 1.001, 1.001]}>
                <sphereGeometry args={[1, 64, 64]} />
                <meshBasicMaterial
                    map={lightsMap}
                    transparent={true}
                    opacity={0.5}
                    blending={THREE.AdditiveBlending}
                    color="#ffccaa" // Tint lights slightly
                />
            </mesh>

            {/* Orbital Rings */}
            <OrbitalRings />

            {/* Asteroid Field */}
            <AsteroidField count={400} radius={25} insideColor="#ff3b30" outsideColor="#4db5ff" />
        </group>
    );
};


export default EarthScene;
