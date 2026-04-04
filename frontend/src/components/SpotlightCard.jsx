import React, { useRef, useEffect, useState } from 'react';

const SpotlightCard = ({ 
    children, 
    className = '', 
    spotlightColor = 'rgba(0, 229, 255, 0.2)',
    spotlightSize = 300,
    ...props 
}) => {
    const cardRef = useRef(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;

        const handleMouseMove = (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            setMousePosition({ x, y });
        };

        const handleMouseEnter = () => setIsHovered(true);
        const handleMouseLeave = () => setIsHovered(false);

        card.addEventListener('mousemove', handleMouseMove);
        card.addEventListener('mouseenter', handleMouseEnter);
        card.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            card.removeEventListener('mousemove', handleMouseMove);
            card.removeEventListener('mouseenter', handleMouseEnter);
            card.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return (
        <div
            ref={cardRef}
            className={`relative overflow-hidden rounded-xl border border-white/10 bg-black/20 backdrop-blur-xl transition-all duration-300 ${className}`}
            style={{
                background: isHovered 
                    ? `radial-gradient(${spotlightSize}px circle at ${mousePosition.x}px ${mousePosition.y}px, ${spotlightColor}, transparent 40%)`
                    : 'rgba(0, 0, 0, 0.2)'
            }}
            {...props}
        >
            {/* Spotlight overlay */}
            <div 
                className="absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none"
                style={{
                    opacity: isHovered ? 1 : 0,
                    background: `radial-gradient(${spotlightSize}px circle at ${mousePosition.x}px ${mousePosition.y}px, ${spotlightColor}, transparent 40%)`
                }}
            />
            
            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
            
            {/* Border glow effect */}
            <div 
                className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 pointer-events-none"
                style={{
                    opacity: isHovered ? 0.6 : 0,
                    background: `linear-gradient(90deg, transparent, ${spotlightColor.replace('0.2', '0.8')}, transparent)`,
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'xor',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    padding: '1px'
                }}
            />
        </div>
    );
};

export default SpotlightCard;