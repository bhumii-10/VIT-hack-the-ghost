import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const AsteroidField = ({
    count = 500,
    radius = 30,
    speed = 0.001,
    insideColor = '#ff3b30',
    outsideColor = '#4db5ff'
}) => {
    const pointsRef = useRef();
    const asteroidsRef = useRef([]);

    const { positions, colors, sizes } = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        const colorInside = new THREE.Color(insideColor);
        const colorOutside = new THREE.Color(outsideColor);

        asteroidsRef.current = [];

        for (let i = 0; i < count; i++) {
            // Random spherical distribution
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const r = Math.random() * radius + 10;

            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            // Color gradient
            const mixColor = colorInside.clone();
            mixColor.lerp(colorOutside, Math.random());
            colors[i * 3] = mixColor.r;
            colors[i * 3 + 1] = mixColor.g;
            colors[i * 3 + 2] = mixColor.b;

            // Varying sizes
            sizes[i] = Math.random() * 0.15 + 0.05;

            // Store asteroid info
            asteroidsRef.current.push({
                x, y, z,
                vx: (Math.random() - 0.5) * 0.02,
                vy: (Math.random() - 0.5) * 0.02,
                vz: (Math.random() - 0.5) * 0.02,
            });
        }

        return { positions, colors, sizes };
    }, [count, radius, insideColor, outsideColor]);

    useFrame(() => {
        if (!pointsRef.current) return;

        const posArray = pointsRef.current.geometry.attributes.position.array;

        for (let i = 0; i < asteroidsRef.current.length; i++) {
            const asteroid = asteroidsRef.current[i];
            
            // Update position
            asteroid.x += asteroid.vx;
            asteroid.y += asteroid.vy;
            asteroid.z += asteroid.vz;

            // Wrap around
            if (Math.abs(asteroid.x) > radius + 10) asteroid.vx *= -1;
            if (Math.abs(asteroid.y) > radius + 10) asteroid.vy *= -1;
            if (Math.abs(asteroid.z) > radius + 10) asteroid.vz *= -1;

            posArray[i * 3] = asteroid.x;
            posArray[i * 3 + 1] = asteroid.y;
            posArray[i * 3 + 2] = asteroid.z;
        }

        pointsRef.current.geometry.attributes.position.needsUpdate = true;

        // Gentle rotation
        if (pointsRef.current) {
            pointsRef.current.rotation.x += speed * 0.2;
            pointsRef.current.rotation.y += speed * 0.3;
        }
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={positions.length / 3}
                    array={positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={colors.length / 3}
                    array={colors}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-size"
                    count={sizes.length}
                    array={sizes}
                    itemSize={1}
                />
            </bufferGeometry>
            <pointsMaterial
                vertexColors={true}
                size={0.2}
                sizeAttenuation={true}
                depthWrite={false}
                transparent={true}
                opacity={0.8}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
};

export default AsteroidField;
