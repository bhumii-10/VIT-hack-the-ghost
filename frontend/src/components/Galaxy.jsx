import React, { useRef, useMemo } from 'react';
import { useFrame, Canvas } from '@react-three/fiber';
import * as THREE from 'three';

const Galaxy = ({
    count = 3000,
    radius = 25,
    branches = 5,
    spin = 2,
    randomness = 0.3,
    randomnessPower = 3,
    insideColor = '#ff2a2a',
    outsideColor = '#000000',
    mouseInteraction = true
}) => {
    const points = useRef();
    const glowRef = useRef();

    const particles = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        const colorInside = new THREE.Color(insideColor);
        const colorOutside = new THREE.Color(outsideColor);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            // Position
            const r = Math.random() * radius;
            const spinAngle = r * spin;
            const branchAngle = (i % branches) / branches * Math.PI * 2;

            const randomX = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * randomness * r;
            const randomY = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * randomness * r * 0.3;
            const randomZ = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * randomness * r;

            positions[i3] = Math.cos(branchAngle + spinAngle) * r + randomX;
            positions[i3 + 1] = randomY;
            positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + randomZ;

            // Color gradient with more vibrant transition
            const mixedColor = colorInside.clone();
            mixedColor.lerp(colorOutside, Math.pow(r / radius, 0.6));

            colors[i3] = mixedColor.r;
            colors[i3 + 1] = mixedColor.g;
            colors[i3 + 2] = mixedColor.b;
        }

        return { positions, colors };
    }, [count, radius, branches, spin, randomness, randomnessPower, insideColor, outsideColor]);

    useFrame((state, delta) => {
        if (points.current) {
            // Rotation
            points.current.rotation.y += delta * 0.02;

            // Mouse Interaction (Tilt)
            if (mouseInteraction) {
                const mouseX = (state.mouse.x * Math.PI) / 15;
                const mouseY = (state.mouse.y * Math.PI) / 15;
                points.current.rotation.x = -mouseY * 0.3 + points.current.rotation.x * 0.95;
                points.current.rotation.z = mouseX * 0.3 + points.current.rotation.z * 0.95;
            }
        }
    });

    return (
        <group>
            <points ref={points}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={particles.positions.length / 3}
                        array={particles.positions}
                        itemSize={3}
                    />
                    <bufferAttribute
                        attach="attributes-color"
                        count={particles.colors.length / 3}
                        array={particles.colors}
                        itemSize={3}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={0.12}
                    sizeAttenuation={true}
                    depthWrite={false}
                    vertexColors={true}
                    blending={THREE.AdditiveBlending}
                    transparent={true}
                    opacity={0.9}
                />
            </points>

            {/* Glow Layer */}
            <points ref={glowRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={particles.positions.length / 3}
                        array={particles.positions}
                        itemSize={3}
                    />
                    <bufferAttribute
                        attach="attributes-color"
                        count={particles.colors.length / 3}
                        array={particles.colors}
                        itemSize={3}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={0.3}
                    sizeAttenuation={true}
                    depthWrite={false}
                    vertexColors={true}
                    blending={THREE.AdditiveBlending}
                    transparent={true}
                    opacity={0.3}
                />
            </points>
        </group>
    );
};

// Canvas Wrapper to easy integration
const GalaxyCanvas = (props) => {
    return (
        <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
            <Canvas camera={{ position: [0, 5, 10], fov: 45 }}>
                <color attach="background" args={['#000000']} />
                <Galaxy {...props} />
            </Canvas>
        </div>
    );
};

export default GalaxyCanvas;
