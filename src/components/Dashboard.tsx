import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Play, TrendingUp, Flame, Calendar, Dumbbell, Map, User, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { WorkoutRunner } from './WorkoutRunner';
import { MapView } from './MapView';
import { CharacterSheet } from './CharacterSheet';
import { SkillTree } from './SkillTree';
import { NutritionCard } from './NutritionCard';
import { Settings } from './Settings';

type View = 'dashboard' | 'workout' | 'map' | 'character' | 'skills' | 'nutrition' | 'settings';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [view, setView] = useState<View>('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [levelProgress, setLevelProgress] = useState(0);

  useEffect(() => {
    if (user) {
      loadStats();
      loadRecentLogs();
      calculateLevelProgress();
    }
  }, [user]);

  const loadStats = async () => {
    const { data } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user?.id)
      .maybeSingle();
    setStats(data);
  };

  const loadRecentLogs = async () => {
    const { data } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', user?.id)
      .order('date', { ascending: false })
      .limit(5);
    setRecentLogs(data || []);
  };

  const calculateLevelProgress = () => {
    if (!user) return;
    const currentLevelThreshold = Math.ceil(100 * Math.pow(user.level, 1.5));
    const nextLevelThreshold = Math.ceil(100 * Math.pow(user.level + 1, 1.5));
    const xpInCurrentLevel = user.xp - currentLevelThreshold;
    const xpNeededForNextLevel = nextLevelThreshold - currentLevelThreshold;
    const progress = (xpInCurrentLevel / xpNeededForNextLevel) * 100;
    setLevelProgress(Math.max(0, Math.min(100, progress)));
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, string> = {
      Assassin: '⚡',
      Warden: '🛡️',
      Arbiter: '⚖️',
      Shadowmancer: '💪',
    };
    return badges[role] || '⭐';
  };

  if (view === 'workout') {
    return <WorkoutRunner onComplete={() => setView('dashboard')} />;
  }

  if (view === 'map') {
    return <MapView onBack={() => setView('dashboard')} />;
  }

  if (view === 'character') {
    return <CharacterSheet onBack={() => setView('dashboard')} />;
  }

  if (view === 'skills') {
    return <SkillTree onBack={() => setView('dashboard')} />;
  }

  if (view === 'nutrition') {
    return <NutritionCard onBack={() => setView('dashboard')} />;
  }

  if (view === 'settings') {
    return <Settings onBack={() => setView('dashboard')} />;
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Welcome back, <span className="text-gradient-ember">{user?.name || 'Hunter'}</span>
            </h1>
            <p className="text-[#9AA3AD]">Ready to level up?</p>
          </div>
          <button onClick={signOut} className="btn-secondary flex items-center">
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="panel-dark p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-[#9AA3AD] mb-1">{user?.role}</div>
                <div className="text-3xl font-bold flex items-center">
                  <span className="mr-2">{getRoleBadge(user?.role || '')}</span>
                  Level {user?.level}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-[#9AA3AD]">XP</div>
                <div className="text-2xl font-semibold text-[#FF6B35]">{user?.xp}</div>
              </div>
            </div>
            <div className="w-full bg-[#0F1113] rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#FF6B35] to-[#FFB86B] h-3 rounded-full transition-all duration-500 animate-pulse-glow"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            <div className="text-xs text-[#9AA3AD] mt-2 text-right">{Math.round(levelProgress)}% to next level</div>
          </div>

          <div className="panel-dark p-6">
            <div className="flex items-center mb-2">
              <Dumbbell className="w-5 h-5 text-[#FF6B35] mr-2" />
              <span className="text-sm text-[#9AA3AD]">Sessions This Week</span>
            </div>
            <div className="text-3xl font-bold">{stats?.sessions_this_week || 0}</div>
          </div>

          <div className="panel-dark p-6">
            <div className="flex items-center mb-2">
              <Flame className="w-5 h-5 text-[#FF6B35] mr-2" />
              <span className="text-sm text-[#9AA3AD]">Current Streak</span>
            </div>
            <div className="text-3xl font-bold">{stats?.current_streak || 0} days</div>
          </div>
        </div>

        <div className="panel-dark p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Today's Quest</h2>
          <p className="text-[#9AA3AD] mb-6">Complete your workout to earn XP and unlock rewards</p>
          <button onClick={() => setView('workout')} className="btn-primary flex items-center">
            <Play className="w-5 h-5 mr-2" />
            Start Workout
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <button onClick={() => setView('map')} className="panel-dark p-6 hover:border-[#FF6B35] border border-transparent transition-all">
            <Map className="w-8 h-8 text-[#FF6B35] mb-2" />
            <div className="font-semibold">Map & Dungeons</div>
            <div className="text-xs text-[#9AA3AD] mt-1">Explore weekly quests</div>
          </button>

          <button onClick={() => setView('character')} className="panel-dark p-6 hover:border-[#FF6B35] border border-transparent transition-all">
            <User className="w-8 h-8 text-[#FF6B35] mb-2" />
            <div className="font-semibold">Character</div>
            <div className="text-xs text-[#9AA3AD] mt-1">View stats & inventory</div>
          </button>

          <button onClick={() => setView('skills')} className="panel-dark p-6 hover:border-[#FF6B35] border border-transparent transition-all">
            <TrendingUp className="w-8 h-8 text-[#FF6B35] mb-2" />
            <div className="font-semibold">Skill Tree</div>
            <div className="text-xs text-[#9AA3AD] mt-1">
              {user?.skill_points || 0} points available
            </div>
          </button>

          <button onClick={() => setView('nutrition')} className="panel-dark p-6 hover:border-[#FF6B35] border border-transparent transition-all">
            <Calendar className="w-8 h-8 text-[#FF6B35] mb-2" />
            <div className="font-semibold">Nutrition</div>
            <div className="text-xs text-[#9AA3AD] mt-1">Macros & meal plan</div>
          </button>

          <button onClick={() => setView('settings')} className="panel-dark p-6 hover:border-[#FF6B35] border border-transparent transition-all">
            <SettingsIcon className="w-8 h-8 text-[#FF6B35] mb-2" />
            <div className="font-semibold">Settings</div>
            <div className="text-xs text-[#9AA3AD] mt-1">Preferences & sync</div>
          </button>
        </div>

        {recentLogs.length > 0 && (
          <div className="panel-dark p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex justify-between items-center p-3 bg-[#0F1113] rounded-lg">
                  <div>
                    <div className="font-semibold">{new Date(log.date).toLocaleDateString()}</div>
                    <div className="text-sm text-[#9AA3AD]">
                      {log.exercises?.length || 0} exercises
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#FF6B35] font-semibold">+{log.xp_gained} XP</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
