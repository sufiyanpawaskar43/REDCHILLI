
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Profile load error:', error);
      return null;
    }
    return data;
  }, []);

  const initSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setProfile(await loadProfile(session.user.id));
      }
    } catch (error) {
      console.error('Session init error:', error);
    } finally {
      setLoading(false);
    }
  }, [loadProfile]);

  useEffect(() => {
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
        setProfile(null);
        return;
      }

      setUser(session.user);
      // Avoid doing heavy profile work inside the auth callback synchronously.
      setTimeout(async () => {
        setProfile(await loadProfile(session.user.id));
      }, 0);
    });

    return () => subscription.unsubscribe();
  }, [initSession, loadProfile]);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const role = String(profile?.role || '').toUpperCase();
  const isAdmin = role === 'ADMIN';
  const isStaff = role === 'STAFF' || isAdmin;

  const value = {
    user,
    profile,
    loading,
    role,
    isAdmin,
    isStaff,
    signIn,
    signOut,
    reloadProfile: async () => setProfile(await loadProfile(user?.id)),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
