import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const CountUp = ({ end, duration = 2, suffix = '' }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let start = 0;
        const increment = end / (duration * 60); // 60 fps
        const interval = setInterval(() => {
            start += increment;
            if (start >= end) {
                setCount(end);
                clearInterval(interval);
            } else {
                setCount(Math.floor(start));
            }
        }, 1000 / 60);

        return () => clearInterval(interval);
    }, [end, duration]);

    return <>{count}{suffix}</>;
};

const AnimatedStats = () => {
    const stats = [
        { label: 'Active Incidents', value: 847, suffix: '', color: 'text-crisis-red' },
        { label: 'Response Time', value: 300, suffix: 'ms', color: 'text-crisis-cyan' },
        { label: 'Coverage', value: 190, suffix: '+', color: 'text-info-blue' },
        { label: 'Uptime', value: 99, suffix: '%', color: 'text-signal-success' },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, idx) => (
                <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                    viewport={{ once: true }}
                    className="glass-panel p-4 md:p-6 rounded-xl hover:border-crisis-cyan/30 transition-colors group"
                >
                    <div className={`text-2xl md:text-3xl font-display font-bold mb-2 ${stat.color} group-hover:text-white transition-colors`}>
                        <CountUp end={stat.value} suffix={stat.suffix} />
                    </div>
                    <div className="text-xs md:text-sm text-gray-400 font-mono uppercase tracking-wider group-hover:text-gray-300">
                        {stat.label}
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default AnimatedStats;
