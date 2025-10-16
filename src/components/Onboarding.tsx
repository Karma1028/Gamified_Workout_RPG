import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, OnboardingData } from '../lib/supabase';
import { ChevronRight, Target, Dumbbell, Clock, Calendar, AlertCircle, Utensils } from 'lucide-react';

const ROLES = [
  {
    id: 'Assassin',
    name: 'Assassin',
    description: 'Speed, agility, explosive power',
    icon: '⚡',
    goals: ['conditioning', 'explosive', 'athletic'],
  },
  {
    id: 'Warden',
    name: 'Warden',
    description: 'Raw strength, heavy compounds',
    icon: '🛡️',
    goals: ['strength', 'powerlifting'],
  },
  {
    id: 'Arbiter',
    name: 'Arbiter',
    description: 'Balance, consistency, longevity',
    icon: '⚖️',
    goals: ['health', 'longevity', 'balanced'],
  },
  {
    id: 'Shadowmancer',
    name: 'Shadowmancer',
    description: 'Hypertrophy, aesthetics, volume',
    icon: '💪',
    goals: ['muscle', 'bodybuilding', 'aesthetics'],
  },
];

const GOALS = ['Strength', 'Muscle Building', 'Conditioning', 'Athletic Performance', 'Weight Loss', 'General Health'];
const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const EQUIPMENT = ['Bodyweight', 'Dumbbells', 'Barbell', 'Machines', 'Cables', 'Kettlebells', 'Resistance Bands', 'Full Gym'];

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<OnboardingData>>({
    goals: [],
    experience_level: 'Beginner',
    equipment: [],
    time_per_session: 60,
    preferred_duration_months: 6,
    injuries: [],
    food_constraints: [],
    create_drive_sheet: false,
  });
  const [selectedRole, setSelectedRole] = useState('Assassin');
  const [loading, setLoading] = useState(false);

  const toggleArrayItem = (key: keyof OnboardingData, value: string) => {
    const currentArray = (formData[key] as string[]) || [];
    setFormData({
      ...formData,
      [key]: currentArray.includes(value)
        ? currentArray.filter((item) => item !== value)
        : [...currentArray, value],
    });
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);

    await supabase.from('onboarding_data').upsert({
      user_id: user.id,
      ...formData,
    });

    await supabase
      .from('users')
      .update({ role: selectedRole })
      .eq('id', user.id);

    await refreshUser();
    setLoading(false);
    onComplete();
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Target className="w-16 h-16 mx-auto mb-4 text-[#FF6B35]" />
              <h2 className="text-3xl font-semibold mb-2">What are your goals?</h2>
              <p className="text-[#9AA3AD]">Select all that apply</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {GOALS.map((goal) => (
                <button
                  key={goal}
                  onClick={() => toggleArrayItem('goals', goal)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.goals?.includes(goal)
                      ? 'border-[#FF6B35] bg-[#FF6B35]/10'
                      : 'border-[#2a2d33] hover:border-[#FF6B35]/50'
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Dumbbell className="w-16 h-16 mx-auto mb-4 text-[#FF6B35]" />
              <h2 className="text-3xl font-semibold mb-2">Experience Level</h2>
              <p className="text-[#9AA3AD]">How long have you been training?</p>
            </div>
            <div className="space-y-3">
              {EXPERIENCE_LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => setFormData({ ...formData, experience_level: level })}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    formData.experience_level === level
                      ? 'border-[#FF6B35] bg-[#FF6B35]/10'
                      : 'border-[#2a2d33] hover:border-[#FF6B35]/50'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Dumbbell className="w-16 h-16 mx-auto mb-4 text-[#FF6B35]" />
              <h2 className="text-3xl font-semibold mb-2">Available Equipment</h2>
              <p className="text-[#9AA3AD]">What do you have access to?</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {EQUIPMENT.map((item) => (
                <button
                  key={item}
                  onClick={() => toggleArrayItem('equipment', item)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.equipment?.includes(item)
                      ? 'border-[#FF6B35] bg-[#FF6B35]/10'
                      : 'border-[#2a2d33] hover:border-[#FF6B35]/50'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Clock className="w-16 h-16 mx-auto mb-4 text-[#FF6B35]" />
              <h2 className="text-3xl font-semibold mb-2">Time Per Session</h2>
              <p className="text-[#9AA3AD]">How long can you train?</p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg">{formData.time_per_session} minutes</span>
              </div>
              <input
                type="range"
                min="30"
                max="120"
                step="15"
                value={formData.time_per_session}
                onChange={(e) => setFormData({ ...formData, time_per_session: parseInt(e.target.value) })}
                className="w-full h-2 bg-[#2a2d33] rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-sm text-[#9AA3AD]">
                <span>30 min</span>
                <span>120 min</span>
              </div>
            </div>

            <div className="mt-8">
              <div className="text-center mb-4">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-[#FF6B35]" />
                <h3 className="text-xl font-semibold mb-2">Program Duration</h3>
                <p className="text-[#9AA3AD]">How long do you want to commit?</p>
              </div>
              <input
                type="range"
                min="1"
                max="24"
                value={formData.preferred_duration_months}
                onChange={(e) => setFormData({ ...formData, preferred_duration_months: parseInt(e.target.value) })}
                className="w-full h-2 bg-[#2a2d33] rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-sm text-[#9AA3AD] mt-2">
                <span>1 month</span>
                <span className="text-lg font-semibold text-[#E6EEF3]">{formData.preferred_duration_months} months</span>
                <span>24 months</span>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-[#FF6B35]" />
              <h2 className="text-3xl font-semibold mb-2">Any Injuries?</h2>
              <p className="text-[#9AA3AD]">Optional - helps us customize your plan</p>
            </div>
            <textarea
              placeholder="e.g., Lower back pain, shoulder mobility issues..."
              value={formData.injuries?.join(', ')}
              onChange={(e) => setFormData({ ...formData, injuries: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
              className="w-full h-32 bg-[#15171A] border border-[#2a2d33] rounded-lg p-4 text-[#E6EEF3] focus:border-[#FF6B35] focus:outline-none"
            />

            <div className="text-center mt-8">
              <Utensils className="w-12 h-12 mx-auto mb-2 text-[#FF6B35]" />
              <h3 className="text-xl font-semibold mb-2">Food Constraints</h3>
              <p className="text-[#9AA3AD]">Dietary restrictions or preferences</p>
            </div>
            <textarea
              placeholder="e.g., Vegetarian, lactose intolerant..."
              value={formData.food_constraints?.join(', ')}
              onChange={(e) => setFormData({ ...formData, food_constraints: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
              className="w-full h-32 bg-[#15171A] border border-[#2a2d33] rounded-lg p-4 text-[#E6EEF3] focus:border-[#FF6B35] focus:outline-none"
            />
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-semibold mb-2">Choose Your Role</h2>
              <p className="text-[#9AA3AD]">Based on your goals, we recommend a role</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ROLES.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    selectedRole === role.id
                      ? 'border-[#FF6B35] bg-[#FF6B35]/10'
                      : 'border-[#2a2d33] hover:border-[#FF6B35]/50'
                  }`}
                >
                  <div className="text-4xl mb-2">{role.icon}</div>
                  <h3 className="text-xl font-semibold mb-1">{role.name}</h3>
                  <p className="text-[#9AA3AD] text-sm">{role.description}</p>
                </button>
              ))}
            </div>

            <div className="mt-8 p-4 bg-[#15171A] rounded-lg border border-[#2a2d33]">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.create_drive_sheet}
                  onChange={(e) => setFormData({ ...formData, create_drive_sheet: e.target.checked })}
                  className="w-5 h-5 rounded border-[#2a2d33] text-[#FF6B35] focus:ring-[#FF6B35]"
                />
                <span className="text-[#E6EEF3]">Create Google Drive spreadsheet for workout tracking</span>
              </label>
              <p className="text-sm text-[#9AA3AD] mt-2 ml-8">
                One-time creation, sync manually when needed
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-[#9AA3AD]">Step {step} of 6</span>
            <span className="text-sm text-[#9AA3AD]">{Math.round((step / 6) * 100)}%</span>
          </div>
          <div className="w-full bg-[#15171A] rounded-full h-2">
            <div
              className="bg-gradient-to-r from-[#FF6B35] to-[#FFB86B] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
        </div>

        <div className="panel-dark p-8">
          {renderStep()}

          <div className="flex justify-between mt-8">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="btn-secondary">
                Back
              </button>
            )}
            {step < 6 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="btn-primary ml-auto flex items-center"
                disabled={
                  (step === 1 && (!formData.goals || formData.goals.length === 0)) ||
                  (step === 3 && (!formData.equipment || formData.equipment.length === 0))
                }
              >
                Next <ChevronRight className="ml-2 w-5 h-5" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="btn-primary ml-auto flex items-center">
                {loading ? 'Creating Profile...' : 'Complete Setup'} <ChevronRight className="ml-2 w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
