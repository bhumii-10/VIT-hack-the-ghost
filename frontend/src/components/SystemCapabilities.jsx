import React, { useState } from 'react';
import CardSwap from './CardSwap';
import { motion, AnimatePresence } from 'framer-motion';

const CAPABILITIES_DATA = [
    {
        id: 1,
        title: "Real-Time Tracking",
        description: "Live monitoring of global incidents with sub-second latency precision worldwide.",
        stat: "ACCURACY: 99.9%",
        category: "INTELLIGENCE",
        status: "ACTIVE",
        color: "from-crisis-blue to-transparent"
    },
    {
        id: 2,
        title: "Threat Prediction",
        description: "AI-driven algorithms forecast potential crisis escalation before it happens.",
        stat: "CONFIDENCE: 94%",
        category: "AI CORE",
        status: "LEARNING",
        color: "from-crisis-cyan to-transparent"
    },
    {
        id: 3,
        title: "Resource Allocation",
        description: "Autonomous routing of emergency units to high-priority zones instantly.",
        stat: "UNITS: 2400+",
        category: "LOGISTICS",
        status: "READY",
        active: true,
        color: "from-crisis-red to-transparent"
    }
];

const SystemCapabilities = () => {
    const [activeCard, setActiveCard] = useState(null);

    return (
        <div className="absolute bottom-12 right-12 w-[800px] h-[300px] flex items-center gap-12 z-20 pointer-events-none">
            {/* Left Side: Contextual Text */}
            <div className="flex-1 text-right pointer-events-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeCard ? activeCard.id : 'init'}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <h3 className="text-gray-500 font-mono text-sm uppercase mb-2 tracking-widest">
                            System Capability // {activeCard?.id || '01'}
                        </h3>
                        <h2 className="text-3xl font-display font-bold text-white mb-4">
                            {activeCard?.title || "Initializing..."}
                        </h2>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            {activeCard?.description || "Standby for system module synchronization sequence."}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Right Side: Card Swap */}
            <div className="flex-1 pointer-events-auto">
                <CardSwap items={CAPABILITIES_DATA} onSwap={setActiveCard} />
            </div>
        </div>
    );
};

export default SystemCapabilities;
