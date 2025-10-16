import { ArrowLeft, Lock, Star, Trophy } from 'lucide-react';

const DUNGEONS = [
  {
    id: 1,
    name: 'Hypertrophy Dungeon',
    difficulty: 'Intermediate',
    workouts: 3,
    xpReward: 1200,
    loot: 'Shadow Cloak',
    unlocked: true,
  },
  {
    id: 2,
    name: 'Strength Citadel',
    difficulty: 'Advanced',
    workouts: 4,
    xpReward: 1800,
    loot: 'Iron Aura',
    unlocked: true,
  },
  {
    id: 3,
    name: 'Conditioning Gauntlet',
    difficulty: 'Intermediate',
    workouts: 5,
    xpReward: 1500,
    loot: 'Assassin Badge',
    unlocked: false,
  },
  {
    id: 4,
    name: 'Power Arena',
    difficulty: 'Advanced',
    workouts: 3,
    xpReward: 2000,
    loot: 'Legendary Blade',
    unlocked: false,
  },
];

export function MapView({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-8">
          <button onClick={onBack} className="btn-secondary flex items-center">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2 text-gradient-ember">Dungeon Map</h1>
          <p className="text-[#9AA3AD]">Choose your quest and claim your rewards</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DUNGEONS.map((dungeon) => (
            <div
              key={dungeon.id}
              className={`panel-dark p-6 relative ${
                !dungeon.unlocked ? 'opacity-60' : 'hover:border-[#FF6B35] border border-transparent transition-all'
              }`}
            >
              {!dungeon.unlocked && (
                <div className="absolute top-4 right-4">
                  <Lock className="w-6 h-6 text-[#9AA3AD]" />
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-2xl font-semibold mb-2">{dungeon.name}</h3>
                <div className="flex items-center space-x-4 text-sm text-[#9AA3AD]">
                  <span className="px-3 py-1 bg-[#FF6B35]/10 rounded-full">{dungeon.difficulty}</span>
                  <span>{dungeon.workouts} workouts</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 bg-[#0F1113] rounded-lg">
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-[#FFB86B] mr-2" />
                    <span>XP Reward</span>
                  </div>
                  <span className="font-semibold text-[#FF6B35]">{dungeon.xpReward} XP</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#0F1113] rounded-lg">
                  <div className="flex items-center">
                    <Trophy className="w-5 h-5 text-[#D4AF37] mr-2" />
                    <span>Loot</span>
                  </div>
                  <span className="font-semibold text-[#D4AF37]">{dungeon.loot}</span>
                </div>
              </div>

              <button
                disabled={!dungeon.unlocked}
                className={`w-full ${dungeon.unlocked ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'}`}
              >
                {dungeon.unlocked ? 'Enter Dungeon' : 'Locked'}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 panel-dark p-8">
          <h2 className="text-2xl font-semibold mb-4">Weekly Progress</h2>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((week) => (
              <div key={week} className="flex items-center">
                <div className="w-24 text-[#9AA3AD]">Week {week}</div>
                <div className="flex-1 bg-[#0F1113] rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#FF6B35] to-[#FFB86B] h-4 rounded-full"
                    style={{ width: `${week === 1 ? 60 : week === 2 ? 80 : 0}%` }}
                  />
                </div>
                <div className="w-16 text-right text-sm text-[#9AA3AD]">
                  {week === 1 ? '60%' : week === 2 ? '80%' : '0%'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
