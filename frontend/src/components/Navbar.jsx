import React from 'react';
import { clsx } from 'clsx';
import { ShieldAlert, Activity, Users, ChevronDown, UserCircle, BrainCircuit, Target } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import LocationStatus from './LocationStatus';
import VoiceNavigator from './VoiceNavigator';
import LanguageSelector from './LanguageSelector';

const Navbar = ({ isSystemOnline, onTestPush }) => {
    const { user, profile, signOut, isAdmin, isUser, loading } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    // Debug authentication state
    React.useEffect(() => {
        console.log('Navbar - Auth State:', {
            user: !!user,
            userId: user?.id?.slice(0, 8),
            profile: profile?.role,
            isAdmin,
            isUser,
            loading
        });
    }, [user, profile, isAdmin, isUser, loading]);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 h-auto bg-gradient-to-b from-black/90 to-black/70 backdrop-blur-md pointer-events-none flex flex-col">
            {/* Top Status Bar - Hidden on Mobile */}
            <div className="hidden lg:flex w-full h-[32px] border-b border-white/10 bg-[#020408] items-center justify-between px-6 z-50 relative">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <img src="/logo.jpg" alt="SankatSaathi Logo" className="w-5 h-5 object-contain opacity-90" />
                        <span className="text-xs font-bold tracking-widest text-gray-200">SANKAT<span className="text-red-600">SAATHI</span></span>
                    </div>
                    <div className="h-3 w-[1px] bg-white/20"></div>
                    <span className="text-[10px] font-medium text-gray-500 tracking-wider uppercase">National Emergency Response System</span>
                </div>

                <div className="flex items-center gap-6">
                    <LocationStatus compact={true} />
                    <div className="h-3 w-[1px] bg-white/10"></div>
                    <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${isSystemOnline ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></span>
                        <span className="text-[10px] font-bold text-gray-400 tracking-wider">
                            SYSTEM: <span className={isSystemOnline ? 'text-emerald-500' : 'text-red-500'}>{isSystemOnline ? 'ONLINE' : 'OFFLINE'}</span>
                        </span>
                    </div>
                    <div className="h-3 w-[1px] bg-white/10"></div>
                    <div className="text-[10px] font-mono text-gray-500 flex gap-2">
                        <span>UTC</span>
                        <span className="text-gray-300">{new Date().toISOString().slice(11, 19)}</span>
                    </div>
                </div>
            </div>

            {/* Main Nav Container */}
            <div className="flex-1 px-3 sm:px-4 lg:px-8 flex items-center justify-between pointer-events-auto backdrop-blur-md bg-[#050508]/90 border-b border-white/5 py-2 sm:py-3 lg:py-0 min-h-[60px] lg:min-h-[48px]">

                {/* Mobile: Logo */}
                <div className="flex lg:hidden items-center gap-2">
                    <img src="/logo.jpg" alt="SankatSaathi Logo" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
                    <span className="font-bold text-white tracking-wider text-xs sm:text-sm">SANKAT<span className="text-red-600">SAATHI</span></span>
                </div>

                {/* Desktop: Navigation Links */}
                <div className="hidden lg:flex items-center gap-1">
                    {[
                        { path: '/', label: 'Overview' },
                        { path: '/intelligence', label: 'Incidents' },
                        { path: '/severity', label: 'Severity AI', icon: BrainCircuit },
                        { path: '/escalation', label: 'Escalation', icon: Target },
                        { path: '/hotspot', label: 'Hotspots', icon: Target },
                        { path: '/coordination', label: 'Coordination' },
                    ].map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={clsx(
                                "relative h-[48px] px-4 text-xs font-bold transition-all duration-200 flex items-center gap-2 uppercase tracking-wide rounded-sm",
                                location.pathname === link.path
                                    ? "text-white bg-white/5 border-b-2 border-red-600 shadow-[0_4px_12px_-6px_rgba(220,38,38,0.5)]"
                                    : "text-gray-500 hover:text-gray-200 hover:bg-white/5 border-b-2 border-transparent"
                            )}
                        >
                            {link.icon && <link.icon size={14} className={location.pathname === link.path ? "text-red-500" : "text-gray-600 group-hover:text-gray-300"} />}
                            {link.label}
                        </Link>
                    ))}

                    {/* User-only: Coordination and SOS Call */}
                    {isUser && (
                        <>
                            <Link
                                to="/analytics"
                                className={clsx(
                                    "relative h-[48px] px-4 text-xs font-bold transition-all duration-200 flex items-center gap-2 uppercase tracking-wide rounded-sm",
                                    location.pathname === '/analytics'
                                        ? "text-white bg-white/5 border-b-2 border-red-600 shadow-[0_4px_12px_-6px_rgba(220,38,38,0.5)]"
                                        : "text-gray-500 hover:text-gray-200 hover:bg-white/5 border-b-2 border-transparent"
                                )}
                            >
                                Analytics
                            </Link>
                            <Link
                                to="/emergency"
                                className={clsx(
                                    "ml-4 relative h-[32px] px-4 text-xs font-bold transition-all duration-200 flex items-center gap-2 uppercase tracking-wide rounded bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20",
                                )}
                            >
                                <ShieldAlert size={14} />
                                SOS
                            </Link>
                        </>
                    )}



                    {/* Admin-only: Admin Dashboard */}
                    {isAdmin && (
                        <Link
                            to="/admin"
                            className={clsx(
                                "relative h-[48px] px-4 text-xs font-bold transition-all duration-200 flex items-center gap-2 uppercase tracking-wide rounded-sm",
                                location.pathname === '/admin'
                                    ? "text-white bg-white/5 border-b-2 border-red-600 shadow-[0_4px_12px_-6px_rgba(220,38,38,0.5)]"
                                    : "text-gray-500 hover:text-gray-200 hover:bg-white/5 border-b-2 border-transparent"
                            )}
                        >
                            Admin (HQ)
                        </Link>
                    )}
                </div>

                {/* Desktop: Widgets & Profile */}
                <div className="hidden lg:flex items-center gap-6">
                    {/* Voice Navigator */}
                    <VoiceNavigator />

                    {/* Language Selector */}
                    <LanguageSelector />

                    {/* Simplified Stats Widget */}
                    <div className="flex items-center gap-4 border-r border-white/10 pr-6 h-8">
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] text-gray-500 font-mono uppercase tracking-wider">Units</span>
                            <span className="text-sm font-mono font-bold text-crisis-cyan">2,405</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] text-gray-500 font-mono uppercase tracking-wider">Alerts</span>
                            <span className="text-sm font-mono font-bold text-signal-error animate-pulse">12</span>
                        </div>
                    </div>

                    {/* Profile Dropdown */}
                    {loading ? (
                        <div className="w-8 h-8 rounded-full border-2 border-gray-600 border-t-transparent animate-spin"></div>
                    ) : user ? (
                        <div className="relative z-50">
                            <div
                                className="flex items-center gap-3 pl-2 group transition-all cursor-pointer"
                                tabIndex={0}
                            >
                                <div className="text-right hidden xl:block">
                                    <div className="text-xs font-bold text-gray-200 group-hover:text-white transition-colors uppercase font-display tracking-wide">
                                        {profile?.full_name || user?.user_metadata?.full_name || 'User'}
                                    </div>
                                    <div className="text-[9px] text-gray-500 font-mono group-hover:text-crisis-cyan transition-colors">
                                        {profile?.role?.toUpperCase() || 'OPERATOR'}
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-crisis-cyan/50 transition-all">
                                        <UserCircle className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-signal-success border-2 border-[#050508] rounded-full"></div>
                                </div>

                                {/* Dropdown Menu (CSS Hover Based) */}
                                <div className="absolute top-full right-0 mt-2 w-48 bg-[#0a0a0f] border border-white/10 rounded-sm shadow-2xl opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                                    <div className="p-3 border-b border-white/5">
                                        <p className="text-xs text-white font-medium truncate">{profile?.full_name || 'User'}</p>
                                        <p className="text-[10px] text-gray-500 font-mono truncate">{user?.email}</p>
                                    </div>
                                    <div className="py-1">
                                        <Link to="/profile" className="block px-4 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2">
                                            <span>Profile Settings</span>
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-xs text-crisis-red hover:bg-crisis-red/10 transition-colors flex items-center gap-2"
                                        >
                                            <span>Sign Out</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Link
                            to="/login"
                            className="px-5 py-2 border border-crisis-cyan/30 bg-crisis-cyan/5 text-crisis-cyan text-xs font-bold uppercase hover:bg-crisis-cyan hover:text-black transition-all duration-300 rounded-sm font-mono tracking-wider"
                        >
                            Login
                        </Link>
                    )}
                </div>

                {/* Mobile: Hamburger Button */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="lg:hidden text-white p-2"
                >
                    <div className="space-y-1.5">
                        <span className={`block w-6 h-0.5 bg-white transition-all ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                        <span className={`block w-6 h-0.5 bg-white transition-all ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                        <span className={`block w-6 h-0.5 bg-white transition-all ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
                    </div>
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="lg:hidden bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/10 pointer-events-auto min-h-screen">
                    <div className="flex flex-col p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-screen overflow-y-auto">
                        <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-lg sm:text-xl font-display font-medium text-gray-300 hover:text-white uppercase tracking-widest border-l-2 border-transparent hover:border-crisis-red pl-4 transition-all">OVERVIEW</Link>
                        <Link to="/intelligence" onClick={() => setIsMenuOpen(false)} className="text-lg sm:text-xl font-display font-medium text-gray-300 hover:text-white uppercase tracking-widest border-l-2 border-transparent hover:border-crisis-red pl-4 transition-all">INCIDENTS</Link>
                        <Link to="/severity" onClick={() => setIsMenuOpen(false)} className="text-lg sm:text-xl font-display font-medium text-gray-300 hover:text-white uppercase tracking-widest border-l-2 border-transparent hover:border-crisis-cyan pl-4 transition-all">SEVERITY AI</Link>
                        <Link to="/escalation" onClick={() => setIsMenuOpen(false)} className="text-lg sm:text-xl font-display font-medium text-gray-300 hover:text-white uppercase tracking-widest border-l-2 border-transparent hover:border-purple-400 pl-4 transition-all">ESCALATION</Link>
                        <Link to="/hotspot" onClick={() => setIsMenuOpen(false)} className="text-lg sm:text-xl font-display font-medium text-gray-300 hover:text-white uppercase tracking-widest border-l-2 border-transparent hover:border-crisis-cyan pl-4 transition-all">ML HOTSPOT</Link>
                        <Link to="/resources" onClick={() => setIsMenuOpen(false)} className="text-lg sm:text-xl font-display font-medium text-gray-300 hover:text-white uppercase tracking-widest border-l-2 border-transparent hover:border-green-400 pl-4 transition-all">RESOURCES</Link>

                        {/* User-only links */}
                        {isUser && (
                            <>
                                <Link to="/coordination" onClick={() => setIsMenuOpen(false)} className="text-lg sm:text-xl font-display font-medium text-gray-300 hover:text-white uppercase tracking-widest border-l-2 border-transparent hover:border-crisis-red pl-4 transition-all">COORDINATION</Link>
                                <Link to="/emergency" onClick={() => setIsMenuOpen(false)} className="text-lg sm:text-xl font-display font-medium text-red-400 hover:text-red-300 uppercase tracking-widest border-l-2 border-transparent hover:border-red-500 pl-4 transition-all">SOS CALL</Link>
                            </>
                        )}

                        <Link to="/analytics" onClick={() => setIsMenuOpen(false)} className="text-lg sm:text-xl font-display font-medium text-gray-300 hover:text-white uppercase tracking-widest border-l-2 border-transparent hover:border-crisis-red pl-4 transition-all">ANALYTICS</Link>

                        {/* Admin-only link */}
                        {isAdmin && (
                            <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="text-xl font-display font-medium text-gray-300 hover:text-white uppercase tracking-widest border-l-2 border-transparent hover:border-crisis-red pl-4 transition-all">ADMIN HQ</Link>
                        )}

                        {/* Language Selector for Mobile */}
                        <div className="pl-4">
                            <div className="text-xs text-gray-500 uppercase mb-2">Language</div>
                            <LanguageSelector />
                        </div>

                        <div className="h-[1px] bg-white/10 my-4"></div>
                        {loading ? (
                            <div className="flex items-center justify-center gap-2 text-gray-400">
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm font-mono">Loading...</span>
                            </div>
                        ) : user ? (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="text-sm text-gray-400 font-mono">
                                    <div className="truncate max-w-[200px]">User: {profile?.full_name || 'User'}</div>
                                    <div className="text-xs text-gray-500">Role: {profile?.role?.toUpperCase() || 'USER'}</div>
                                </div>
                                <button onClick={handleLogout} className="text-crisis-red text-sm font-bold uppercase font-mono tracking-wider border border-crisis-red/30 px-3 py-2 bg-crisis-red/10 w-full sm:w-auto text-center">Logout</button>
                            </div>
                        ) : (
                            <div className="flex justify-center">
                                <Link
                                    to="/login"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="text-crisis-red text-sm font-bold uppercase font-mono tracking-wider border border-crisis-red/30 px-4 py-2 bg-crisis-red/10 w-full text-center"
                                >
                                    Login
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
