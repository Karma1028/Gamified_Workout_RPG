import { ArrowLeft, Lock, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type Skill = {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  criteria: string;
  criteriaMet: boolean;
  role?: string;
};

const SKILLS: Omit<Skill, 'unlocked' | 'criteriaMet'>[] = [
  {
    id: 'blade_instinct',
    name: 'Blade Instinct',
    description: '+5% XP on HIIT sessions. Unlocks Assassin Cloak cosmetic.',
    icon: '⚡',
    criteria: 'Complete 10 high-intensity sessions in 30 days',
    role: 'Assassin',
  },
  {
    id: 'iron_core',
    name: 'Iron Core',
    description: 'Unlock heavy program templates and Iron Aura cosmetic.',
    icon: '🛡️',
    criteria: 'Complete 12 heavy compound sets in 6 weeks',
    role: 'Warden',
  },
  {
    id: 'second_wind',
    name: 'Second Wind',
    description: 'One-time revive to preserve streak.',
    icon: '⚖️',
    criteria: 'Maintain 90% adherence over 8 weeks',
    role: 'Arbiter',
  },
  {
    id: 'echo_shadows',
    name: 'Echo of Shadows',
    description: 'Unlock micro-program templates with XP bonus.',
    icon: '💪',
    criteria: 'Accumulate 10,000 XP or complete 3 accessory dungeons',
    role: 'Shadowmancer',
  },
  {
    id: 'quick_recovery',
    name: 'Quick Recovery',
    description: 'Reduce rest timers by 25%.',
    icon: '⏱️',
    criteria: 'Complete 25 workouts',
  },
  {
    id: 'xp_boost',
    name: 'XP Multiplier',
    description: '+10% XP on all exercises.',
    icon: '✨',
    criteria: 'Reach Level 10',
  },
];

export function SkillTree({ onBack }: { onBack: () => void }) {
  const { user, refreshUser } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadSkills();
  }, [user]);

  const loadSkills = async () => {
    const { data: unlockedSkills } = await supabase
      .from('skill_unlocks')
      .select('*')
      .eq('user_id', user?.id);

    const { data: statsData } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user?.id)
      .maybeSingle();

    setStats(statsData);

    const skillsWithStatus = SKILLS.map((skill) => {
      const unlockRecord = unlockedSkills?.find((u) => u.skill_id === skill.id);
      const unlocked = unlockRecord?.unlocked || false;

      let criteriaMet = false;
      if (skill.id === 'quick_recovery') {
        criteriaMet = (statsData?.total_sessions || 0) >= 25;
      } else if (skill.id === 'xp_boost') {
        criteriaMet = (user?.level || 0) >= 10;
      } else if (skill.id === 'echo_shadows') {
        criteriaMet = (user?.xp || 0) >= 10000;
      } else if (skill.id === 'blade_instinct') {
        criteriaMet = (statsData?.total_sessions || 0) >= 10;
      } else if (skill.id === 'iron_core') {
        criteriaMet = (statsData?.total_sessions || 0) >= 8;
      } else if (skill.id === 'second_wind') {
        criteriaMet = (statsData?.total_sessions || 0) >= 15;
      }

      return {
        ...skill,
        unlocked,
        criteriaMet,
      };
    });

    setSkills(skillsWithStatus);
  };

  const unlockSkill = async (skillId: string) => {
    if (!user || user.skill_points <= 0) return;

    await supabase.from('skill_unlocks').upsert({
      user_id: user.id,
      skill_id: skillId,
      unlocked: true,
      unlocked_at: new Date().toISOString(),
    });

    await supabase
      .from('users')
      .update({ skill_points: user.skill_points - 1 })
      .eq('id', user.id);

    await refreshUser();
    loadSkills();
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="btn-secondary flex items-center">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <div className="text-right">
            <div className="text-sm text-[#9AA3AD]">Available Skill Points</div>
            <div className="text-3xl font-bold text-[#D4AF37]">{user?.skill_points || 0}</div>
          </div>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2 text-gradient-ember">Skill Tree</h1>
          <p className="text-[#9AA3AD]">Unlock powerful abilities to enhance your training</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className={`panel-dark p-6 relative ${
                skill.unlocked
                  ? 'border-[#00ff00] bg-[#00ff00]/5'
                  : skill.criteriaMet
                  ? 'border-[#FF6B35] hover:shadow-lg hover:shadow-[#FF6B35]/20'
                  : 'opacity-60'
              } border transition-all`}
            >
              <div className="absolute top-4 right-4">
                {skill.unlocked ? (
                  <Check className="w-6 h-6 text-[#00ff00]" />
                ) : !skill.criteriaMet ? (
                  <Lock className="w-6 h-6 text-[#9AA3AD]" />
                ) : null}
              </div>

              <div className="text-5xl mb-4">{skill.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{skill.name}</h3>
              {skill.role && (
                <div className="inline-block px-3 py-1 bg-[#FF6B35]/10 rounded-full text-xs text-[#FF6B35] mb-3">
                  {skill.role}
                </div>
              )}
              <p className="text-[#9AA3AD] text-sm mb-4">{skill.description}</p>

              <div className="mb-4 p-3 bg-[#0F1113] rounded-lg">
                <div className="text-xs text-[#9AA3AD] mb-1">Unlock Criteria:</div>
                <div className="text-sm">{skill.criteria}</div>
                {skill.criteriaMet && !skill.unlocked && (
                  <div className="text-xs text-[#00ff00] mt-2">Criteria Met!</div>
                )}
              </div>

              {!skill.unlocked && skill.criteriaMet && (
                <button
                  onClick={() => unlockSkill(skill.id)}
                  disabled={!user || user.skill_points <= 0}
                  className={`w-full ${
                    user && user.skill_points > 0 ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'
                  }`}
                >
                  {user && user.skill_points > 0 ? 'Unlock (1 SP)' : 'No Skill Points'}
                </button>
              )}

              {skill.unlocked && (
                <div className="text-center text-[#00ff00] font-semibold">Unlocked</div>
              )}

              {!skill.criteriaMet && !skill.unlocked && (
                <div className="text-center text-[#9AA3AD] text-sm">Locked</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
