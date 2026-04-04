import { useState, useEffect } from 'react';
import { Element, scroller } from 'react-scroll';
import HeroSection from './HeroSection';
import CardSwap, { Card } from './CardSwap';
import Galaxy from './Galaxy';
import EnhancedFeatures from './EnhancedFeatures';
import AnimatedStats from './AnimatedStats';
import AIAssistantChatbot from './AIAssistantChatbot';
import { ArrowRight, Lock, Satellite, Activity, Globe, Zap, MapPin, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLocation } from '../context/LocationContext';

const LandingPage = ({ onSystemInitialize }) => {
    const { hasLocation, isLoading, requestLocation, error } = useLocation();
    const [showLocationPrompt, setShowLocationPrompt] = useState(false);

    // Show location prompt after a delay if location is not available and user hasn't denied recently
    useEffect(() => {
        const timer = setTimeout(() => {
            const locationDenied = localStorage.getItem('location-denied');
            const lastLocationRequest = localStorage.getItem('last-location-request');
            const now = Date.now();
            const thirtyMinutes = 30 * 60 * 1000;

            // Only show if user hasn't denied recently
            const shouldShow = !hasLocation && 
                              !isLoading && 
                              (!locationDenied || !lastLocationRequest || (now - parseInt(lastLocationRequest)) > thirtyMinutes);

            if (shouldShow) {
                setShowLocationPrompt(true);
            }
        }, 5000); // Show after 5 seconds instead of 3

        return () => clearTimeout(timer);
    }, [hasLocation, isLoading]);

    const handleLocationRequest = () => {
        requestLocation(true);
        setShowLocationPrompt(false);
    };

    const handleLocationLater = () => {
        setShowLocationPrompt(false);
        // Remember user chose "later" for this session
        localStorage.setItem('location-denied', 'true');
        localStorage.setItem('last-location-request', Date.now().toString());
    };

    const handleInitialize = () => {
        // Trigger system online state
        if (onSystemInitialize) onSystemInitialize();

        // Scroll to capabilities
        scroller.scrollTo('capabilities', {
            smooth: true,
            duration: 800,
        });
    };

    return (
        <div className="w-full relative z-10 scroll-smooth pointer-events-none text-white">

            {/* HERO SECTION */}
            <div className="h-screen w-full relative flex flex-col justify-center px-2 sm:px-4 lg:px-0 pointer-events-none">
                <div className="pointer-events-auto">
                    <HeroSection onInitialize={handleInitialize} />
                </div>
            </div>

            {/* SECTION 2: CAPABILITIES */}
            <Element name="capabilities" className="min-h-screen w-full bg-[#050508]/80 backdrop-blur-md relative z-20 border-t border-white/5 flex items-center pointer-events-auto">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/90 to-black z-0"></div>

                <div className="container mx-auto px-4 sm:px-6 md:px-12 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-24 items-center py-8 sm:py-12 lg:py-0">
                    {/* Left: Text */}
                    <div className="order-2 lg:order-1">
                        <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
                            <h2 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold text-white leading-tight tracking-tight">
                                TACTICAL <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">INTELLIGENCE</span>
                            </h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent"></div>
                        </div>
                        <p className="text-gray-400 text-lg md:text-xl font-light leading-relaxed mb-12 max-w-lg font-sans">
                            SankatSaathi unifies global data streams into a single command interface.
                            Deploy assets, analyze risks, and coordinate responses with military-grade precision.
                        </p>

                        <div className="flex flex-col gap-6">
                            <div className="glass-panel p-6 rounded-xl group hover:border-crisis-cyan/30 transition-colors flex items-center gap-6">
                                <div className="p-3 bg-info-blue/10 rounded-lg">
                                    <Globe className="w-8 h-8 text-info-blue" />
                                </div>
                                <div>
                                    <h4 className="text-white font-display font-bold text-lg mb-1">Global Coverage</h4>
                                    <p className="text-gray-500 text-sm font-mono">Satellite-linked monitoring spanning 190+ countries.</p>
                                </div>
                            </div>
                            <div className="glass-panel p-6 rounded-xl group hover:border-crisis-red/30 transition-colors flex items-center gap-6">
                                <div className="p-3 bg-crisis-red/10 rounded-lg">
                                    <Activity className="w-8 h-8 text-crisis-red" />
                                </div>
                                <div>
                                    <h4 className="text-white font-display font-bold text-lg mb-1">Live Telemetry</h4>
                                    <p className="text-gray-500 text-sm font-mono">Sub-second latency on incident reporting.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Card Swap */}
                    <div className="h-[400px] md:h-[600px] flex items-center justify-center order-1 lg:order-2">
                                                <CardSwap delay={4000}>
                                                    <Card className="glass-panel-heavy p-8 flex flex-col justify-between" key="1">
                                                        <div>
                                                            <div className="text-xs font-mono uppercase text-info-blue mb-4 tracking-widest">Module 01</div>
                                                            <h3 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">Real-Time Tracking</h3>
                                                            <p className="text-gray-400 text-base font-light">Live monitoring of global incidents with sub-second latency precision worldwide.</p>
                                                        </div>
                                                        <Link to="/intelligence" className="text-crisis-red font-bold font-mono uppercase tracking-widest text-sm hover:text-white transition-colors flex items-center gap-2 group">
                                                            View Intel <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                        </Link>
                                                    </Card>
                                                    <Card className="glass-panel-heavy p-8 flex flex-col justify-between" key="2">
                                                        <div>
                                                            <div className="text-xs font-mono uppercase text-crisis-red mb-4 tracking-widest">Module 02</div>
                                                            <h3 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">Global Intelligence</h3>
                                                            <p className="text-gray-400 text-base font-light">Real-time surveillance and AI-filtered news analysis from global sources.</p>
                                                        </div>
                                                        <Link to="/news" className="text-info-blue font-bold font-mono uppercase tracking-widest text-sm hover:text-white transition-colors flex items-center gap-2 group">
                                                            Access Feed <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                        </Link>
                                                    </Card>
                                                    <Card className="glass-panel-heavy p-8 flex flex-col justify-between" key="3">
                                                        <div>
                                                            <div className="text-xs font-mono uppercase text-safe-green mb-4 tracking-widest">Module 03</div>
                                                            <h3 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">Resource Allocation</h3>
                                                            <p className="text-gray-400 text-base font-light">Autonomous routing of emergency units to high-priority zones instantly.</p>
                                                        </div>
                                                        <Link to="/coordination" className="text-safe-green font-bold font-mono uppercase tracking-widest text-sm hover:text-white transition-colors flex items-center gap-2 group">
                                                            Deploy Units <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                        </Link>
                                                    </Card>
                                                    <Card className="glass-panel-heavy p-8 flex flex-col justify-between" key="4">
                                                        <div>
                                                            <div className="text-xs font-mono uppercase text-warning-orange mb-4 tracking-widest">Module 04</div>
                                                            <h3 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">Risk Assessment</h3>
                                                            <p className="text-gray-400 text-base font-light">AI-powered risk analysis and severity prediction for proactive response.</p>
                                                        </div>
                                                        <Link to="/analytics" className="text-warning-orange font-bold font-mono uppercase tracking-widest text-sm hover:text-white transition-colors flex items-center gap-2 group">
                                                            Analyze Risk <Zap className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                        </Link>
                                                    </Card>
                                                </CardSwap>
                    </div>
                </div>
            </Element>

            {/* SECTION 3: ENHANCED FEATURES */}
            <EnhancedFeatures />

            {/* SECTION 4: LIVE STATISTICS */}
            <Element name="stats" className="min-h-[60vh] w-full bg-black relative z-20 py-16 md:py-32 flex flex-col items-center justify-center border-t border-white/5 pointer-events-auto">
                <div className="container mx-auto px-6 md:px-12">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16 md:mb-24"
                    >
                        <span className="text-crisis-cyan font-mono text-sm tracking-[0.4em] uppercase block mb-4">Live Telemetry</span>
                        <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">SYSTEM STATUS</h2>
                    </motion.div>
                    <AnimatedStats />
                </div>
            </Element>

            {/* SECTION 5: PLATFORM OVERVIEW with GALAXY */}
            <Element name="overview" className="min-h-[80vh] w-full bg-black relative z-20 py-16 md:py-32 flex flex-col items-center justify-center border-t border-white/10 pointer-events-auto overflow-hidden">
                {/* Backround Galaxy */}
                <Galaxy
                    mouseInteraction={true}
                    density={1.5}
                    insideColor="#ff3b30"
                    outsideColor="#000000"
                    count={3000}
                    radius={25}
                />

                <div className="relative z-10 text-center mb-12 md:mb-20 px-6">
                    <span className="text-crisis-red font-mono text-sm tracking-[0.4em] uppercase">Architecture Overview</span>
                    <h2 className="text-4xl md:text-6xl font-display font-bold text-white mt-6 mb-6">COMMAND ARCHITECTURE</h2>
                    <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto font-light">
                        Three-layer intelligence system: Detection, Analysis, and Response working in perfect synchronization.
                    </p>
                </div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 container mx-auto px-6 md:px-12">
                    {/* Node 1 */}
                    <motion.div
                        whileHover={{ scale: 1.05, y: -10 }}
                        className="glass-panel p-10 rounded-3xl hover:bg-white/5 transition-all group"
                    >
                        <div className="w-16 h-16 rounded-full bg-info-blue/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                            <Satellite className="w-8 h-8 text-info-blue" />
                        </div>
                        <h3 className="text-2xl font-display font-bold text-white mb-4">Detection Layer</h3>
                        <p className="text-base text-gray-500 mb-4 font-mono text-xs">IoT sensors, satellite imagery, and public reports fuse to identify threats instantly.</p>
                        <div className="text-xs text-info-blue font-mono uppercase tracking-widest">Real-time • 24/7</div>
                    </motion.div>

                    {/* Node 2 */}
                    <motion.div
                        whileHover={{ scale: 1.05, y: -10 }}
                        className="glass-panel-heavy p-10 rounded-3xl relative overflow-hidden group border-crisis-red/30"
                    >
                        <div className="absolute inset-0 bg-crisis-red/5 animate-pulse"></div>
                        <div className="w-16 h-16 rounded-full bg-crisis-red/20 flex items-center justify-center mb-8 relative z-10">
                            <Activity className="w-8 h-8 text-crisis-red" />
                        </div>
                        <h3 className="text-2xl font-display font-bold text-white mb-4 relative z-10">Analysis Engine</h3>
                        <p className="text-base text-gray-400 relative z-10 mb-4 font-mono text-xs">AI algorithms process severity and recommend optimal response strategies.</p>
                        <div className="text-xs text-crisis-red font-mono uppercase relative z-10 tracking-widest">AI-Powered • Ensemble</div>
                    </motion.div>

                    {/* Node 3 */}
                    <motion.div
                        whileHover={{ scale: 1.05, y: -10 }}
                        className="glass-panel p-10 rounded-3xl hover:bg-white/5 transition-all group"
                    >
                        <div className="w-16 h-16 rounded-full bg-safe-green/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                            <Globe className="w-8 h-8 text-safe-green" />
                        </div>
                        <h3 className="text-2xl font-display font-bold text-white mb-4">Response Grid</h3>
                        <p className="text-base text-gray-500 mb-4 font-mono text-xs">Autonomous assignment of nearest responders and resource tracking.</p>
                        <div className="text-xs text-safe-green font-mono uppercase tracking-widest">Optimized • Fast</div>
                    </motion.div>
                </div>

                {/* Flow Visualization */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="relative z-10 mt-20 p-8 max-w-4xl mx-auto border border-white/5 rounded-2xl bg-black/40 backdrop-blur-sm"
                >
                    <div className="flex items-center justify-between text-center">
                        <div className="flex-1">
                            <div className="text-2xl font-display font-bold text-info-blue mb-2">Detect</div>
                            <div className="text-[10px] font-mono text-gray-500 uppercase">Identify Incident</div>
                        </div>
                        <div className="flex-shrink-0 px-4">
                            <motion.div animate={{ x: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                                <ArrowRight className="w-5 h-5 text-gray-700" />
                            </motion.div>
                        </div>
                        <div className="flex-1">
                            <div className="text-2xl font-display font-bold text-crisis-red mb-2">Analyze</div>
                            <div className="text-[10px] font-mono text-gray-500 uppercase">Assess Severity</div>
                        </div>
                        <div className="flex-shrink-0 px-4">
                            <motion.div animate={{ x: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                                <ArrowRight className="w-5 h-5 text-gray-700" />
                            </motion.div>
                        </div>
                        <div className="flex-1">
                            <div className="text-2xl font-display font-bold text-safe-green mb-2">Respond</div>
                            <div className="text-[10px] font-mono text-gray-500 uppercase">Deploy Resources</div>
                        </div>
                    </div>
                </motion.div>
            </Element>

            {/* SECTION 6: FUTURE ROADMAP */}
            <div className="w-full py-24 bg-gradient-to-b from-black via-[#050508] to-black border-t border-white/5 relative z-20 pointer-events-auto">
                <div className="container mx-auto px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-12"
                    >
                        <h3 className="text-gray-500 text-xs font-mono uppercase mb-8 tracking-[0.3em]">System Roadmap // 2026-Q3</h3>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { title: 'Autonomous Drones', status: 'Locked', color: 'gray' },
                            { title: 'Predictive Pre-Crime', status: 'Initializing...', color: 'warning-orange' },
                            { title: 'Neural Link Interface', status: 'Research', color: 'purple' }
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className={`p-6 border border-dashed border-${item.color}-700/30 rounded-xl flex items-center gap-4 hover:border-${item.color}-500/50 transition-colors opacity-60 hover:opacity-100 bg-white/5`}
                            >
                                <Lock className={`text-${item.color}-500`} size={18} />
                                <div>
                                    <h4 className="text-gray-300 font-bold font-display">{item.title}</h4>
                                    <span className={`text-[10px] font-mono text-${item.color}-400 uppercase inline-block mt-1`}>
                                        {item.status}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* SECTION 7: FOOTER */}
            <footer className="w-full py-12 bg-black border-t border-white/10 relative z-20 pointer-events-auto">
                <div className="container mx-auto px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                        {/* Brand */}
                        <div>
                            <div className="text-2xl font-display font-bold tracking-wider text-white mb-2">SANKAT<span className="text-crisis-red">SAATHI</span></div>
                            <div className="text-gray-500 text-xs max-w-xs mb-4 font-mono">
                                Official Crisis Response System authorized by Global Security Council.
                            </div>
                        </div>

                        {/* Links */}
                        <div>
                            <h5 className="text-white font-bold text-xs mb-4 uppercase tracking-wider font-mono">Platform</h5>
                            <ul className="space-y-2 text-gray-500 text-sm">
                                <li><Link to="/" className="hover:text-white transition-colors">Dashboard</Link></li>
                                <li><Link to="/intelligence" className="hover:text-white transition-colors">Intelligence</Link></li>
                                <li><Link to="/analytics" className="hover:text-white transition-colors">Analytics</Link></li>
                                <li><Link to="/coordination" className="hover:text-white transition-colors">Coordination</Link></li>
                            </ul>
                        </div>

                        {/* Support */}
                        <div>
                            <h5 className="text-white font-bold text-xs mb-4 uppercase tracking-wider font-mono">Support</h5>
                            <ul className="space-y-2 text-gray-500 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">Security Protocol</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">System Status</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact Support</a></li>
                            </ul>
                        </div>

                        {/* Status */}
                        <div>
                            <h5 className="text-white font-bold text-xs mb-4 uppercase tracking-wider font-mono">Status</h5>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-safe-green text-sm font-mono">
                                    <div className="w-2 h-2 rounded-full bg-safe-green animate-pulse"></div>
                                    <span>All Systems Operational</span>
                                </div>
                                <div className="text-gray-500 text-xs font-mono">Uptime: 99.9% • Response: &lt;3ms</div>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-gray-600 text-[10px] uppercase tracking-wider font-mono">
                            &copy; 2026 SANKATSAATHI. All Rights Reserved.
                        </div>
                        <div className="flex gap-6 text-gray-600 text-[10px] uppercase tracking-wider font-mono">
                            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                            <a href="#" className="hover:text-white transition-colors">Security</a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Location Access Prompt */}
            {showLocationPrompt && !hasLocation && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="fixed bottom-6 right-6 z-50 max-w-sm"
                >
                    <div className="bg-gradient-to-r from-blue-900/90 to-purple-900/90 backdrop-blur-xl border border-blue-500/50 rounded-xl p-6 shadow-2xl pointer-events-auto">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <MapPin className="w-6 h-6 text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-white font-bold mb-2">Enable Location Access</h3>
                                <p className="text-blue-100 text-sm mb-4">
                                    SankatSaathi needs your location for accurate emergency services and risk assessment.
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleLocationRequest}
                                        disabled={isLoading}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors flex items-center gap-2"
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Getting...
                                            </>
                                        ) : (
                                            <>
                                                <MapPin className="w-3 h-3" />
                                                Allow Access
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={handleLocationLater}
                                        className="px-3 py-2 text-gray-400 hover:text-white text-sm transition-colors"
                                    >
                                        Later
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* AI Assistant Chatbot */}
            <AIAssistantChatbot />
        </div>
    );
};

export default LandingPage;