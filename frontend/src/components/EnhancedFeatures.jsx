import React from 'react';
import { motion } from 'framer-motion';
import { Satellite, Activity, Globe, Zap, Shield, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

const EnhancedFeatures = () => {
    const features = [
        {
            icon: Satellite,
            title: 'Detection Layer',
            description: 'IoT sensors, satellite imagery, and public reports fuse to identify threats instantly.',
            color: 'info-blue',
            bgColor: 'bg-info-blue/10',
            link: '/intelligence',
            tag: 'MODULE 01'
        },
        {
            icon: Activity,
            title: 'Analysis Engine',
            description: 'AI algorithms process severity and recommend optimal response strategies.',
            color: 'crisis-red',
            bgColor: 'bg-crisis-red/10',
            link: '/analytics',
            tag: 'MODULE 02'
        },
        {
            icon: Globe,
            title: 'Response Grid',
            description: 'Autonomous assignment of nearest responders and resource tracking.',
            color: 'signal-success',
            bgColor: 'bg-signal-success/10',
            link: '/coordination',
            tag: 'MODULE 03'
        },
        {
            icon: Shield,
            title: 'Verification System',
            description: 'Multi-factor validation to reduce false alarms and maintain public trust.',
            color: 'crisis-cyan',
            bgColor: 'bg-crisis-cyan/10',
            link: '/verification',
            tag: 'MODULE 04'
        },
        {
            icon: BarChart3,
            title: 'Analytics Dashboard',
            description: 'Real-time metrics and historical trend analysis for informed decision making.',
            color: 'signal-warn',
            bgColor: 'bg-signal-warn/10',
            link: '/analytics',
            tag: 'MODULE 05'
        },
        {
            icon: Zap,
            title: 'Alert System',
            description: 'Location-based emergency notifications with multi-channel delivery.',
            color: 'warning-orange',
            bgColor: 'bg-warning-orange/10',
            link: '/alerts',
            tag: 'MODULE 06'
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    // Helper to get hex color for style props
    const getHexColor = (colorName) => {
        const colors = {
            'info-blue': '#007AFF',
            'crisis-red': '#FF3B30',
            'signal-success': '#34C759',
            'crisis-cyan': '#39ff14', // Using a bright neon green/cyan for this specific highlight
            'signal-warn': '#FFD60A',
            'warning-orange': '#FF9500'
        };
        return colors[colorName] || '#FFFFFF';
    };

    const getRgbaColor = (colorName) => {
        const colors = {
            'info-blue': 'rgba(0, 122, 255, 0.2)',
            'crisis-red': 'rgba(255, 59, 48, 0.2)',
            'signal-success': 'rgba(52, 199, 89, 0.2)',
            'crisis-cyan': 'rgba(57, 255, 20, 0.2)',
            'signal-warn': 'rgba(255, 214, 10, 0.2)',
            'warning-orange': 'rgba(255, 149, 0, 0.2)'
        };
        return colors[colorName] || 'rgba(255, 255, 255, 0.2)';
    }

    return (
        <div className="w-full py-20 md:py-32 bg-gradient-to-b from-black via-black/80 to-black relative z-20 border-t border-white/5 pointer-events-auto">
            <div className="container mx-auto px-6 md:px-12">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16 md:mb-24"
                >
                    <span className="text-crisis-red font-mono text-sm tracking-[0.4em] uppercase block mb-4">System Capabilities</span>
                    <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">
                        THE UNIFIED <span className="text-transparent bg-clip-text bg-gradient-to-r from-crisis-red to-crisis-cyan">GRID</span>
                    </h2>
                    <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto font-light">
                        Seamless integration between ground units, command centers, and AI infrastructure for maximum operational efficiency.
                    </p>
                </motion.div>

                {/* Features Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
                >
                    {features.map((feature, idx) => {
                        const Icon = feature.icon;
                        const iconColor = getHexColor(feature.color);
                        const iconBg = getRgbaColor(feature.color);

                        return (
                            <motion.div
                                key={idx}
                                variants={itemVariants}
                                whileHover={{ scale: 1.05, y: -5 }}
                                className="relative group"
                            >
                                {/* Glow Background */}
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-transparent via-crisis-red/20 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl blur transition-opacity duration-300"></div>

                                {/* Card */}
                                <Link
                                    to={feature.link}
                                    className="relative block p-8 md:p-10 glass-panel border border-white/10 group-hover:border-white/30 rounded-2xl transition-all duration-300 overflow-hidden h-full"
                                >
                                    {/* Background Gradient */}
                                    <div className={`absolute top-0 right-0 w-32 h-32 ${feature.bgColor} rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-300`}></div>

                                    {/* Content */}
                                    <div className="relative z-10">
                                        {/* Tag */}
                                        <div className="text-xs font-mono uppercase tracking-widest mb-4 font-bold"
                                            style={{ color: iconColor }}
                                        >
                                            {feature.tag}
                                        </div>

                                        {/* Icon */}
                                        <div className="w-14 h-14 rounded-lg mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                                            style={{ backgroundColor: iconBg }}
                                        >
                                            <Icon className="w-7 h-7" style={{ color: iconColor }} />
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-xl md:text-2xl font-display font-bold text-white mb-3 group-hover:text-white transition-colors">
                                            {feature.title}
                                        </h3>

                                        {/* Description */}
                                        <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-6 font-sans">
                                            {feature.description}
                                        </p>

                                        {/* Hover Action */}
                                        <div className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <span className="text-crisis-red">Activate Module</span>
                                            <span className="text-crisis-red">→</span>
                                        </div>
                                    </div>

                                    {/* Border Glow */}
                                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* Integration Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="mt-20 p-8 md:p-12 border border-crisis-cyan/30 rounded-2xl bg-crisis-cyan/5 backdrop-blur-sm"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-2 h-2 rounded-full bg-crisis-cyan mt-2 flex-shrink-0 animate-pulse-fast"></div>
                        <div>
                            <h4 className="text-xl font-display font-bold text-white mb-2">Real-Time Integration</h4>
                            <p className="text-gray-400 font-mono text-sm leading-relaxed">
                                All modules operate with sub-second latency through WebSocket connections. The system achieves 99.9% uptime with automatic failover and redundancy across multiple data centers.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default EnhancedFeatures;
