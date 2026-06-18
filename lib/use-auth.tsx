import { requireSupabase } from '@/lib/supabase';
import { type User } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isReady: boolean;
  isGuest: boolean;
  signUp: (email: string, password: string, username: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  loginAsGuest: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const supabase = requireSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        setUser(session?.user ?? null);
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (mounted) setUser(session?.user ?? null);
        });
        return () => { subscription.unsubscribe(); };
      } catch {
        setUser(null);
      } finally {
        if (mounted) { setLoading(false); setIsReady(true); }
      }
    }
    init();
    return () => { mounted = false; };
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    isReady,
    isGuest,
    loginAsGuest: () => { setIsGuest(true); },
    signUp: async (email: string, password: string, username: string) => {
      try {
        const supabase = requireSupabase();
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) return error.message;
        if (data.user) {
          await supabase.from('profiles').insert({ id: data.user.id, username });
        }
        return null;
      } catch (e: any) {
        return e?.message ?? 'Supabase not configured';
      }
    },
    signIn: async (email: string, password: string) => {
      try {
        const supabase = requireSupabase();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error?.message ?? null;
      } catch (e: any) {
        return e?.message ?? 'Supabase not configured';
      }
    },
    signOut: async () => {
      try {
        const supabase = requireSupabase();
        await supabase.auth.signOut();
      } catch {}
      router.replace('/(auth)/login');
    },
  }), [user, loading, isReady]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
