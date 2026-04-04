import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const OrbitalRings = () => {
    const ring1Ref = useRef();
    const ring2Ref = useRef();
    const ring3Ref = useRef();

    useFrame(() => {
        if (ring1Ref.current) ring1Ref.current.rotation.z += 0.0003;
        if (ring2Ref.current) ring2Ref.current.rotation.z -= 0.0002;
        if (ring3Ref.current) ring3Ref.current.rotation.x += 0.0001;
    });

    const RingLine = ({ radius, color, thickness, ref }) => (
        <lineSegments ref={ref}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    array={new Float32Array(
                        Array.from({ length: 256 }, (_, i) => {
                            const angle = (i / 256) * Math.PI * 2;
                            return [
                                Math.cos(angle) * radius,
                                Math.sin(angle) * radius,
                                0
                            ];
                        }).flat()
                    )}
                    count={256}
                    itemSize={3}
                />
            </bufferGeometry>
            <lineBasicMaterial
                color={color}
                linewidth={thickness}
                transparent={true}
                opacity={0.6}
                blending={THREE.AdditiveBlending}
            />
        </lineSegments>
    );

    return (
        <group>
            <RingLine ref={ring1Ref} radius={1.5} color="#4db5ff" thickness={2} />
            <RingLine ref={ring2Ref} radius={2.2} color="#ff3b30" thickness={1.5} />
            <RingLine ref={ring3Ref} radius={2.8} color="#00ff88" thickness={1} />
        </group>
    );
};

export default OrbitalRings;
