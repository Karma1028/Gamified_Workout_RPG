import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { supabase } from './lib/supabase';

function AppContent() {
  const { user, loading, signIn } = useAuth();
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      checkOnboarding();
    }
  }, [user]);

  const checkOnboarding = async () => {
    const { data } = await supabase
      .from('onboarding_data')
      .select('*')
      .eq('user_id', user?.id)
      .maybeSingle();

    setHasOnboarded(!!data);
  };

  if (loading || (user && hasOnboarded === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚡</div>
          <div className="text-2xl font-semibold text-gradient-ember mb-2">HunterAscend</div>
          <div className="text-[#9AA3AD]">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <div className="text-6xl mb-4">⚡</div>
            <h1 className="text-5xl font-bold mb-4 text-gradient-ember">HunterAscend</h1>
            <p className="text-xl text-[#9AA3AD] mb-2">Gamified Workout System</p>
            <p className="text-[#9AA3AD]">Level up your training with XP, skill trees, and progression tracking</p>
          </div>

          <div className="panel-dark p-8 mb-6">
            <div className="space-y-4 text-left mb-6">
              <div className="flex items-start">
                <div className="text-2xl mr-3">💪</div>
                <div>
                  <div className="font-semibold mb-1">Track Your Progress</div>
                  <div className="text-sm text-[#9AA3AD]">Log workouts and earn XP for every set</div>
                </div>
              </div>
              <div className="flex items-start">
                <div className="text-2xl mr-3">🎯</div>
                <div>
                  <div className="font-semibold mb-1">Choose Your Role</div>
                  <div className="text-sm text-[#9AA3AD]">Assassin, Warden, Arbiter, or Shadowmancer</div>
                </div>
              </div>
              <div className="flex items-start">
                <div className="text-2xl mr-3">🌟</div>
                <div>
                  <div className="font-semibold mb-1">Unlock Skills</div>
                  <div className="text-sm text-[#9AA3AD]">Level up and spend skill points on powerful abilities</div>
                </div>
              </div>
            </div>

            <button onClick={signIn} className="btn-primary w-full">
              Sign in with Google
            </button>
          </div>

          <div className="text-xs text-[#9AA3AD]">
            Solo Leveling-inspired progression system with original design
          </div>
        </div>
      </div>
    );
  }

  if (!hasOnboarded) {
    return <Onboarding onComplete={() => setHasOnboarded(true)} />;
  }

  return <Dashboard />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
