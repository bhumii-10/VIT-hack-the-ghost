
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log("Initializing Supabase Client...");
console.log("URL:", supabaseUrl ? "Set" : "MISSING");
console.log("Key:", supabaseAnonKey ? "Set" : "MISSING " + (supabaseAnonKey ? "" : "(Check .env)"));

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("CRITICAL: Missing Supabase Environment Variables. Check your .env file.");
}

// Mock Client for Demo/Development without Keys
const mockSupabase = {
    auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: (callback) => {
            // Return a mock subscription
            return { 
                data: { 
                    subscription: { 
                        unsubscribe: () => {} 
                    } 
                } 
            };
        },
        signInWithPassword: async () => ({ data: null, error: new Error("Demo mode - authentication disabled") }),
        signUp: async () => ({ data: null, error: new Error("Demo mode - authentication disabled") }),
        signOut: async () => ({ error: null })
    },
    channel: (name) => ({
        on: () => ({ subscribe: () => { } }),
        subscribe: () => { }
    }),
    removeChannel: () => { },
    from: (table) => ({
        select: () => ({ 
            eq: () => ({ execute: async () => ({ data: [] }) }), 
            execute: async () => ({ data: [] }),
            single: async () => ({ data: null, error: { code: 'PGRST116' } })
        }),
        insert: () => ({ execute: async () => ({ data: [] }) }),
        update: () => ({ eq: () => ({ execute: async () => ({ data: [] }) }) }),
        upsert: () => ({ execute: async () => ({ data: [] }) })
    }),
    storage: {
        from: () => ({
            upload: async () => { },
            getPublicUrl: () => ({ data: { publicUrl: "https://via.placeholder.com/150" } })
        })
    }
};

export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : mockSupabase;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("⚠️  Running with MOCK Supabase Client (Demo Mode)");
}
