import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        (async () => {
            const { data } = await supabase.auth.getUser();
            if (mounted) setUser(data.user || null);
            setLoading(false);
        })();
        const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
            setUser(session?.user || null);
        });
        return () => sub.subscription.unsubscribe();
    }, []);

    const value = useMemo(() => ({ user, loading }), [user, loading]);
    return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthCtx);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}

export async function signInWithEmail(email) {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    if (error) throw error;
}

export async function signOut() { await supabase.auth.signOut(); }


