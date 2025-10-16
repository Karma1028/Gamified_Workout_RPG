import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, User } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  };

  const createUserProfile = async (userId: string, email: string, name: string | null) => {
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        name,
        role: 'Assassin',
        level: 1,
        xp: 0,
        skill_points: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      return null;
    }

    await supabase.from('user_stats').insert({
      user_id: userId,
      sessions_this_week: 0,
      weekly_volume_kg: 0,
      current_streak: 0,
      longest_streak: 0,
      total_sessions: 0,
      total_xp_earned: 0,
    });

    return data;
  };

  const refreshUser = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user) {
      let profile = await fetchUserProfile(currentSession.user.id);
      if (!profile) {
        profile = await createUserProfile(
          currentSession.user.id,
          currentSession.user.email!,
          currentSession.user.user_metadata?.name || null
        );
      }
      setUser(profile);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user.id).then(async (profile) => {
          if (!profile) {
            profile = await createUserProfile(
              currentSession.user.id,
              currentSession.user.email!,
              currentSession.user.user_metadata?.name || null
            );
          }
          setUser(profile);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (currentSession?.user) {
        (async () => {
          let profile = await fetchUserProfile(currentSession.user.id);
          if (!profile) {
            profile = await createUserProfile(
              currentSession.user.id,
              currentSession.user.email!,
              currentSession.user.user_metadata?.name || null
            );
          }
          setUser(profile);
        })();
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) console.error('Error signing in:', error);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
