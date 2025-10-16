import { ArrowLeft, TrendingUp, Target, Zap, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function CharacterSheet({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    const { data } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user?.id)
      .maybeSingle();
    setStats(data);
  };

  const getRoleIcon = (role: string) => {
    const icons: Record<string, string> = {
      Assassin: '⚡',
      Warden: '🛡️',
      Arbiter: '⚖️',
      Shadowmancer: '💪',
    };
    return icons[role] || '⭐';
  };

  const getRoleDescription = (role: string) => {
    const descriptions: Record<string, string> = {
      Assassin: 'Masters of speed and explosive power. High-intensity training with focus on conditioning and athleticism.',
      Warden: 'Titans of raw strength. Heavy compound movements and progressive overload for maximum power.',
      Arbiter: 'Balanced warriors seeking longevity. Sustainable training with emphasis on consistency and health.',
      Shadowmancer: 'Sculptors of aesthetics. High-volume hypertrophy work for maximum muscle development.',
    };
    return descriptions[role] || 'A dedicated hunter on the path to greatness.';
  };

  const characterStats = [
    {
      name: 'Strength',
      value: Math.min(100, (stats?.total_sessions || 0) * 5),
      icon: Shield,
      color: '#FF6B35',
    },
    {
      name: 'Endurance',
      value: Math.min(100, (stats?.current_streak || 0) * 10),
      icon: Zap,
      color: '#FFB86B',
    },
    {
      name: 'Consistency',
      value: Math.min(100, (stats?.sessions_this_week || 0) * 20),
      icon: Target,
      color: '#D4AF37',
    },
    {
      name: 'Growth',
      value: Math.min(100, ((user?.xp || 0) / 100) * 10),
      icon: TrendingUp,
      color: '#FF6B35',
    },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <button onClick={onBack} className="btn-secondary flex items-center">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
        </div>

        <div className="panel-dark p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            <div className="text-center md:text-left">
              <div className="w-32 h-32 bg-gradient-to-br from-[#FF6B35] to-[#FFB86B] rounded-full flex items-center justify-center text-6xl mb-4 mx-auto md:mx-0">
                {getRoleIcon(user?.role || '')}
              </div>
              <div className="text-3xl font-bold mb-1">{user?.name || 'Hunter'}</div>
              <div className="text-[#9AA3AD] mb-2">{user?.email}</div>
              <div className="inline-block px-4 py-2 bg-[#FF6B35]/10 rounded-full text-[#FF6B35] font-semibold">
                {user?.role}
              </div>
            </div>

            <div className="flex-1">
              <div className="mb-6">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm text-[#9AA3AD]">Level</span>
                  <span className="text-3xl font-bold text-gradient-ember">{user?.level}</span>
                </div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm text-[#9AA3AD]">Total XP</span>
                  <span className="text-xl font-semibold">{user?.xp}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-sm text-[#9AA3AD]">Skill Points</span>
                  <span className="text-xl font-semibold text-[#D4AF37]">{user?.skill_points}</span>
                </div>
              </div>

              <p className="text-[#9AA3AD] text-sm leading-relaxed">
                {getRoleDescription(user?.role || '')}
              </p>
            </div>
          </div>
        </div>

        <div className="panel-dark p-8 mb-6">
          <h2 className="text-2xl font-semibold mb-6">Character Stats</h2>
          <div className="space-y-6">
            {characterStats.map((stat) => (
              <div key={stat.name}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <stat.icon className="w-5 h-5 mr-2" style={{ color: stat.color }} />
                    <span className="font-semibold">{stat.name}</span>
                  </div>
                  <span className="text-[#9AA3AD]">{stat.value}/100</span>
                </div>
                <div className="w-full bg-[#0F1113] rounded-full h-3 overflow-hidden">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${stat.value}%`,
                      backgroundColor: stat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-dark p-8">
          <h2 className="text-2xl font-semibold mb-6">Achievements</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'First Workout', icon: '🎯', unlocked: (stats?.total_sessions || 0) >= 1 },
              { name: '7 Day Streak', icon: '🔥', unlocked: (stats?.current_streak || 0) >= 7 },
              { name: 'Level 5', icon: '⭐', unlocked: (user?.level || 0) >= 5 },
              { name: '50 Sessions', icon: '💪', unlocked: (stats?.total_sessions || 0) >= 50 },
            ].map((achievement) => (
              <div
                key={achievement.name}
                className={`p-4 rounded-lg text-center ${
                  achievement.unlocked ? 'bg-[#FF6B35]/10 border border-[#FF6B35]' : 'bg-[#0F1113] opacity-50'
                }`}
              >
                <div className="text-4xl mb-2">{achievement.icon}</div>
                <div className="text-sm font-semibold">{achievement.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
