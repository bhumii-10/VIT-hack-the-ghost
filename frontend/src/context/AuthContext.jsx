
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Guard: If supabase client failed to init (missing env vars), use fallback auth
        if (!supabase || !supabase.auth || typeof supabase.auth.getSession !== 'function') {
            console.warn("AuthContext: Supabase client not properly initialized. Using fallback auth.");
            
            // Check for fallback authentication
            const fallbackAuth = localStorage.getItem('fallback_auth');
            if (fallbackAuth) {
                try {
                    const { user, profile } = JSON.parse(fallbackAuth);
                    console.log('AuthContext: Using stored fallback authentication', user.email);
                    setUser(user);
                    setProfile(profile);
                } catch (e) {
                    console.error('AuthContext: Invalid fallback auth data');
                    localStorage.removeItem('fallback_auth');
                }
            }
            setLoading(false);
            return;
        }

        // Check for fallback authentication first
        const fallbackAuth = localStorage.getItem('fallback_auth');
        if (fallbackAuth) {
            try {
                const { user, profile } = JSON.parse(fallbackAuth);
                console.log('AuthContext: Using fallback authentication', user.email);
                setUser(user);
                setProfile(profile);
                setLoading(false);
                return;
            } catch (e) {
                console.error('AuthContext: Invalid fallback auth data');
                localStorage.removeItem('fallback_auth');
            }
        }

        // 1. Get Session
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log('AuthContext: Initial session check', { hasSession: !!session });
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        }).catch(error => {
            console.error('AuthContext: Session check failed', error);
            setLoading(false);
        });

        // 2. Listen for Auth Changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log('AuthContext: Auth state changed', { event: _event, hasSession: !!session });
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => {
            if (subscription && subscription.unsubscribe) {
                subscription.unsubscribe();
            }
        };
    }, []);

    const fetchProfile = async (userId) => {
        try {
            console.log('AuthContext: Fetching profile for user', userId);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('AuthContext: Profile fetch error', error);
                // If profile doesn't exist, create a default one
                if (error.code === 'PGRST116') {
                    console.log('AuthContext: Profile not found, creating default profile');
                    const defaultProfile = {
                        id: userId,
                        full_name: 'User',
                        role: 'user',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                    setProfile(defaultProfile);
                } else {
                    throw error;
                }
            } else {
                console.log('AuthContext: Profile fetched successfully', data);
                setProfile(data);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            // Set a default profile to prevent auth issues
            setProfile({
                id: userId,
                full_name: 'User',
                role: 'user',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (email, password) => {
        if (!supabase) throw new Error("Supabase not configured");
        
        // --- FALLBACK AUTHENTICATION FOR DEMO & HACKATHON ---
        const DEMO_USERS = [
            {
                email: 'admin@sankatsaathi.com',
                password: 'SankatSaathi@2024',
                id: '00000000-0000-0000-0000-000000000001',
                name: 'System Administrator',
                role: 'admin'
            },
            {
                email: 'bestfriendsforever17co@gmail.com',
                password: 'Dhruvsave',
                id: 'c9d59104-24d2-4357-b0f5-461fe43328d4',
                name: 'Dhruv Save',
                role: 'user'
            },
            {
                email: 'bingostingo1@gmail.com',
                password: 'bingostingo1',
                id: 'bfd89b7c-8a49-4918-87b6-7316da4e8298',
                name: 'Bingo Stingo',
                role: 'user'
            }
        ];

        const matchedDemoUser = DEMO_USERS.find(u => u.email === email && u.password === password);

        if (matchedDemoUser) {
            console.log(`AuthContext: Demo login detected for ${email}, using fallback authentication`);
            const mockUser = {
                id: matchedDemoUser.id,
                email: matchedDemoUser.email,
                user_metadata: {
                    full_name: matchedDemoUser.name
                }
            };
            const mockProfile = {
                id: matchedDemoUser.id,
                full_name: matchedDemoUser.name,
                role: matchedDemoUser.role,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            setUser(mockUser);
            setProfile(mockProfile);
            
            // Store in localStorage for persistence
            localStorage.setItem('fallback_auth', JSON.stringify({
                user: mockUser,
                profile: mockProfile
            }));
            
            return { user: mockUser };
        }
        
        // Regular user authentication
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('SignIn error:', error);
            throw error;
        }
    };

    const signUp = async (email, password, fullName, role = 'user') => {
        if (!supabase) throw new Error("Supabase not configured");
        
        // Only allow user role for new signups
        const userRole = 'user';
        
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: userRole
                }
            }
        });
        if (error) throw error;
        return data;
    };

    const signOut = async () => {
        if (!supabase) return;
        
        // Clear fallback auth
        localStorage.removeItem('fallback_auth');
        
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('SignOut error:', error);
        }
        
        setUser(null);
        setProfile(null);
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            profile, 
            loading, 
            signIn, 
            signUp, 
            signOut,
            isAdmin: profile?.role === 'admin',
            isUser: profile?.role === 'user'
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
