import { useTexture } from '@react-three/drei';

export const useEarthTextures = () => {
    // Using simple texture loading with Drei's useTexture which suspends automatically
    const textures = useTexture({
        colorMap: '/textures/Earth.webp',
        normalMap: '/textures/earth-topology.png',
        specularMap: '/textures/earth-water.png',
        cloudsMap: '/textures/earth-clouds.png',
        lightsMap: '/textures/earth-night.jpg',
    });

    return textures;
};
