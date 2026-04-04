import React, { Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import * as THREE from 'three';
import { supabase } from './lib/supabaseClient';

// Helper for VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center max-w-md mx-auto p-6">
            <h1 className="text-2xl font-bold text-red-400 mb-4">⚠️ System Error</h1>
            <p className="text-gray-300 mb-4">
              The application encountered an error. This might be due to missing environment variables.
            </p>
            <div className="bg-gray-800 p-4 rounded-lg mb-4 text-left">
              <p className="text-sm text-gray-400 mb-2">Error Details:</p>
              <code className="text-xs text-red-300 break-all">
                {this.state.error?.message || 'Unknown error'}
              </code>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                🔄 Refresh Page
              </button>
              <button
                onClick={() => {
                  // Try demo mode
                  localStorage.setItem('fallback_auth', JSON.stringify({
                    user: {
                      id: '00000000-0000-0000-0000-000000000001',
                      email: 'admin@sankatsaathi.com',
                      user_metadata: { full_name: 'Demo User' }
                    },
                    profile: {
                      id: '00000000-0000-0000-0000-000000000001',
                      full_name: 'Demo User',
                      role: 'admin'
                    }
                  }));
                  window.location.reload();
                }}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                🚀 Try Demo Mode
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Components - Lazy load to prevent blank screen
const EarthScene = React.lazy(() => import('./components/EarthScene'));
const CrisisMarkers = React.lazy(() => import('./components/CrisisMarkers').then(module => ({ default: module.CrisisMarkers })));
const CrisisDashboard = React.lazy(() => import('./components/CrisisDashboard'));
const Navbar = React.lazy(() => import('./components/Navbar'));
const LandingPage = React.lazy(() => import('./components/LandingPage'));
const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage'));
const NewsPage = React.lazy(() => import('./pages/NewsPage'));
const EmergencyPage = React.lazy(() => import('./pages/EmergencyPage'));
const ResourcesPage = React.lazy(() => import('./pages/ResourcesPage'));
const Login = React.lazy(() => import('./components/Login'));
const IncidentReport = React.lazy(() => import('./components/IncidentReport'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const SeverityEnginePage = React.lazy(() => import('./pages/SeverityEnginePage'));
const HotspotPage = React.lazy(() => import('./pages/HotspotPage'));
const EscalationPage = React.lazy(() => import('./pages/EscalationPage'));
const RiskAssessmentPage = React.lazy(() => import('./pages/RiskAssessmentPage'));

// Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { LanguageProvider } from './context/LanguageContext';

// Loading Component
const LoadingScreen = () => (
  <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
      <p className="text-lg">Loading SankatSaathi...</p>
    </div>
  </div>
);

const CameraController = () => {
  const location = useLocation();
  const { camera } = useThree();

  useEffect(() => {
    // Target position based on route
    const targetX = location.pathname === '/landing' ? 2.5 : 5;
    const targetZ = location.pathname === '/landing' ? 5.0 : 8;

    // Animate camera to new position
    let startX = camera.position.x;
    let startZ = camera.position.z;
    let startTime = Date.now();
    let duration = 1500; // 1.5s transition

    const animate = () => {
      let now = Date.now();
      let progress = Math.min((now - startTime) / duration, 1);
      // Ease out cubic
      let ease = 1 - Math.pow(1 - progress, 3);

      camera.position.x = startX + (targetX - startX) * ease;
      camera.position.z = startZ + (targetZ - startZ) * ease;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();

  }, [location, camera]);

  return null;
};

const ProtectedRoute = ({ children, adminOnly = false, userOnly = false }) => {
  const { user, profile, loading } = useAuth();

  // If no user and Supabase is configured, redirect to login
  const isAuthRequired = !!import.meta.env.VITE_SUPABASE_URL;

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center bg-crisis-deep text-crisis-red font-mono animate-pulse">
      LOADING...
    </div>;
  }

  if (isAuthRequired && !user) {
    return <Navigate to="/login" replace />;
  }

  // Role-based access control
  if (adminOnly && profile?.role !== 'admin') {
    return <Navigate to="/landing" replace />;
  }

  if (userOnly && profile?.role !== 'user') {
    return <Navigate to="/landing" replace />;
  }

  return children;
};

const MainApp = () => {
  const { user, loading, signOut } = useAuth();
  const [rotation, setRotation] = useState(0);
  const [isSystemOnline, setIsSystemOnline] = useState(false);
  const [bootFlash, setBootFlash] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (isSystemOnline) {
      // 1. Trigger Visual Flash
      setBootFlash(true);
      setTimeout(() => setBootFlash(false), 500);

      // 2. Play Audio Cue (Futuristic Chirp)
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
          osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.3);

          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        }
      } catch (e) {
        console.error("Audio play failed", e);
      }
    }
  }, [isSystemOnline]);

  // --- Debug: Test Notification ---
  const showTestNotification = () => {
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification('SankatSaathi: System Test', {
          body: 'This is a test notification to verify your browser settings. If you see this, notifications are working!',
          icon: '/vite.svg',
          requireInteraction: true,
          vibrate: [200, 100, 200],
          tag: 'test-sync'
        });
      });
    } else {
      alert("Notification permission not granted or SW not ready.");
    }
  };

  useEffect(() => {
    const registerPush = async () => {
      if (user && 'serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          const sw = registration || await navigator.serviceWorker.register('/sw.js');

          // Wait for service worker to be ready
          await navigator.serviceWorker.ready;

          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            const subscription = await sw.pushManager.getSubscription() || await sw.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY)
            });

            // Sync with backend
            const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
            const apiUrl = import.meta.env.VITE_API_URL || (backendUrl ? `${backendUrl}/api` : '/api');
            const fetchUrl = `${apiUrl}/crisis/subscribe`;
            await fetch(fetchUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: user.id,
                subscription: subscription
              })
            });
            console.log("Push System: OPERATIONAL");
          } else {
            console.warn("Push System: Permission DENIED");
          }
        } catch (err) {
          console.error("Push registration error:", err);
        }
      } else {
        console.warn("Push System: Browser NOT SUPPORTED / Secure Context Required");
      }
    };
    registerPush();
  }, [user]);

  // --- Global Location Tracking is now handled by LocationProvider ---

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-crisis-deep text-crisis-red font-mono animate-pulse">
        INITIALIZING SANKATSAATHI SYSTEM...
      </div>
    );
  }

  const isLoginPage = location.pathname === '/login';

  return (
    <div className="relative w-full h-screen bg-crisis-deep selection:bg-crisis-red/30 selection:text-white overflow-hidden">

      {/* 2D UI Layer - Navbar only shows if NOT on login page */}
      {!isLoginPage && <Navbar user={user} signOut={signOut} isSystemOnline={isSystemOnline} onTestPush={showTestNotification} />}

      {/* Content Routes - Scrollable Container for Pages */}
      <div className={`absolute inset-0 ${!isLoginPage ? 'pt-[60px] sm:pt-[80px]' : ''} z-20 overflow-y-auto custom-scrollbar pointer-events-none`}>
        <div className="pointer-events-auto min-h-full px-2 sm:px-4 lg:px-0">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/landing" replace />} />
            <Route path="/landing" element={<LandingPage onSystemInitialize={() => setIsSystemOnline(true)} />} />
            <Route path="/login" element={user ? <Navigate to="/landing" /> : <Login />} />

            {/* Protected Routes */}
            <Route path="/intelligence" element={
              <ProtectedRoute>
                <CrisisDashboard />
              </ProtectedRoute>
            } />
            <Route path="/report" element={
              <ProtectedRoute>
                <IncidentReport />
              </ProtectedRoute>
            } />
            <Route path="/coordination" element={
              <ProtectedRoute>
                <ResourcesPage />
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <RiskAssessmentPage />
              </ProtectedRoute>
            } />
            <Route path="/predictive-data" element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            } />
            <Route path="/risk" element={
              <ProtectedRoute>
                <RiskAssessmentPage />
              </ProtectedRoute>
            } />
            <Route path="/escalation" element={
              <ProtectedRoute>
                <EscalationPage />
              </ProtectedRoute>
            } />
            <Route path="/news" element={
              <ProtectedRoute>
                <NewsPage />
              </ProtectedRoute>
            } />
            <Route path="/emergency" element={
              <ProtectedRoute>
                <EmergencyPage />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/severity" element={
              <ProtectedRoute>
                <SeverityEnginePage />
              </ProtectedRoute>
            } />
            <Route path="/hotspot" element={
              <ProtectedRoute>
                <HotspotPage />
              </ProtectedRoute>
            } />
            <Route path="/resources" element={
              <ProtectedRoute>
                <ResourcesPage />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </div>

      {/* 3D Scene Layer (Persistent Background) */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <Canvas camera={{ position: [0, 0, 10], fov: 35 }}>
          <color attach="background" args={['#000000']} />

          {/* Cinematic Lighting */}
          <ambientLight intensity={1.5} color="#8080ff" />
          <spotLight position={[50, 50, 50]} angle={0.2} penumbra={1} intensity={50} color="#ffffff" />
          <pointLight position={[-20, 0, -20]} intensity={20} color="#ff3b30" />
          <pointLight position={[20, 10, 20]} intensity={10} color="#40c9ff" />

          <CameraController />

          <Suspense fallback={null}>
            <group rotation={[0, 0, 0]}>
              <EarthScene setRotation={setRotation} />
              <CrisisMarkers />
            </group>
            <Stars radius={200} depth={50} count={1500} factor={3} saturation={0} fade speed={0.5} />
          </Suspense>

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableRotate={true}
            rotateSpeed={0.5}
            target={[0, 0, 0]}
          />
        </Canvas>
      </div>

      {/* VFX Overlays */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] opacity-40"></div>
      <div className="absolute inset-0 pointer-events-none z-10 bg-[url('/noise.svg')] opacity-10 mix-blend-overlay"></div>

      {/* Boot Flash Effect */}
      <div className={`absolute inset-0 z-50 pointer-events-none bg-green-500/20 mix-blend-screen transition-opacity duration-500 ${bootFlash ? 'opacity-100' : 'opacity-0'}`}></div>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <LocationProvider>
              <Suspense fallback={<LoadingScreen />}>
                <MainApp />
              </Suspense>
            </LocationProvider>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
