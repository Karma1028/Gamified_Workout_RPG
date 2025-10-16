import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Exercise } from '../lib/supabase';
import { ArrowLeft, Plus, Check, Timer, TrendingUp } from 'lucide-react';

type WorkoutSet = {
  reps: number;
  weight: number;
  rpe?: number;
  completed: boolean;
};

type WorkoutExercise = {
  exercise: Exercise;
  sets: WorkoutSet[];
  targetSets: number;
  targetReps: string;
};

export function WorkoutRunner({ onComplete }: { onComplete: () => void }) {
  const { user, refreshUser } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workout, setWorkout] = useState<WorkoutExercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [xpPopups, setXpPopups] = useState<{ id: number; xp: number; x: number; y: number }[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExercises();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isResting, restTimer]);

  const loadExercises = async () => {
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .limit(6);

    if (data) {
      setExercises(data);
      const workoutPlan: WorkoutExercise[] = data.slice(0, 4).map((ex) => ({
        exercise: ex,
        sets: [],
        targetSets: 3,
        targetReps: '8-12',
      }));
      setWorkout(workoutPlan);
    }
    setLoading(false);
  };

  const addSet = (exerciseIndex: number, reps: number, weight: number, rpe?: number) => {
    const newWorkout = [...workout];
    newWorkout[exerciseIndex].sets.push({ reps, weight, rpe, completed: true });
    setWorkout(newWorkout);

    const setXp = Math.floor(weight * reps * 0.02) + (rpe ? Math.max(0, (rpe - 6)) * 5 : 0);
    const popupId = Date.now();
    setXpPopups((prev) => [...prev, { id: popupId, xp: setXp, x: Math.random() * 200, y: 0 }]);

    setTimeout(() => {
      setXpPopups((prev) => prev.filter((p) => p.id !== popupId));
    }, 1500);

    setRestTimer(90);
    setIsResting(true);
  };

  const finishWorkout = async () => {
    if (!user) return;
    setLoading(true);

    let totalXp = 0;
    const exercisesData = workout.map((we) => {
      const exerciseVolume = we.sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
      const baseXp = Math.floor(exerciseVolume * 0.02);
      const avgRpe = we.sets.reduce((sum, set) => sum + (set.rpe || 0), 0) / we.sets.length;
      const intensityBonus = Math.max(0, (avgRpe - 6)) * 5 * we.sets.length;
      const exerciseXp = baseXp + intensityBonus;
      totalXp += exerciseXp;

      return {
        exercise_id: we.exercise.id,
        exercise_name: we.exercise.name,
        sets: we.sets.map((s) => ({ reps: s.reps, weight: s.weight, rpe: s.rpe })),
      };
    });

    const sessionBonus = 25;
    totalXp += sessionBonus;

    const { data: logData } = await supabase
      .from('workout_logs')
      .insert({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        exercises: exercisesData,
        xp_gained: totalXp,
      })
      .select()
      .single();

    const currentLevelThreshold = Math.ceil(100 * Math.pow(user.level, 1.5));
    const nextLevelThreshold = Math.ceil(100 * Math.pow(user.level + 1, 1.5));
    const newXp = user.xp + totalXp;
    let newLevel = user.level;
    let newSkillPoints = user.skill_points;

    if (newXp >= nextLevelThreshold) {
      newLevel += 1;
      newSkillPoints += 1;
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }

    await supabase
      .from('users')
      .update({
        xp: newXp,
        level: newLevel,
        skill_points: newSkillPoints,
      })
      .eq('id', user.id);

    const { data: stats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (stats) {
      await supabase
        .from('user_stats')
        .update({
          sessions_this_week: stats.sessions_this_week + 1,
          total_sessions: stats.total_sessions + 1,
          total_xp_earned: stats.total_xp_earned + totalXp,
          last_workout_date: new Date().toISOString().split('T')[0],
        })
        .eq('user_id', user.id);
    }

    await refreshUser();
    setLoading(false);

    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  const currentExercise = workout[currentExerciseIndex];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-2">Loading workout...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onComplete} className="btn-secondary flex items-center">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <div className="text-center">
            <div className="text-sm text-[#9AA3AD]">Exercise {currentExerciseIndex + 1} of {workout.length}</div>
            <div className="text-xl font-semibold">{currentExercise?.exercise.name}</div>
          </div>
          <button onClick={finishWorkout} className="btn-primary">
            Finish
          </button>
        </div>

        {showLevelUp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-level-up">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <div className="text-5xl font-bold text-gradient-ember mb-2">LEVEL UP!</div>
              <div className="text-2xl">You're now Level {user!.level + 1}</div>
              <div className="text-[#D4AF37] mt-2">+1 Skill Point Earned</div>
            </div>
          </div>
        )}

        <div className="relative">
          {xpPopups.map((popup) => (
            <div
              key={popup.id}
              className="absolute animate-xp-float text-2xl font-bold text-[#FFB86B] pointer-events-none z-10"
              style={{ left: `${popup.x}px`, top: `${popup.y}px` }}
            >
              +{popup.xp} XP
            </div>
          ))}
        </div>

        {currentExercise && (
          <div className="panel-dark p-8 mb-6">
            <div className="mb-6">
              {currentExercise.exercise.gif_url && (
                <div className="bg-[#0F1113] rounded-lg p-4 mb-4">
                  <img
                    src={currentExercise.exercise.gif_url}
                    alt={currentExercise.exercise.name}
                    className="w-full max-w-md mx-auto rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Exercise+Demo';
                    }}
                  />
                </div>
              )}
              <div className="mb-4">
                <div className="text-sm text-[#9AA3AD] mb-2">Target</div>
                <div className="text-lg">
                  {currentExercise.targetSets} sets × {currentExercise.targetReps} reps
                </div>
              </div>
              {currentExercise.exercise.instructions && (
                <div className="text-sm text-[#9AA3AD]">
                  <strong>Instructions:</strong> {currentExercise.exercise.instructions}
                </div>
              )}
            </div>

            {isResting && (
              <div className="bg-[#FF6B35]/10 border border-[#FF6B35] rounded-lg p-4 mb-6 text-center">
                <Timer className="w-8 h-8 mx-auto mb-2 text-[#FF6B35]" />
                <div className="text-2xl font-bold">{restTimer}s</div>
                <div className="text-sm text-[#9AA3AD]">Rest time remaining</div>
              </div>
            )}

            <div className="space-y-3 mb-6">
              {currentExercise.sets.map((set, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-[#0F1113] rounded-lg">
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-[#00ff00] mr-3" />
                    <span className="font-semibold">Set {idx + 1}</span>
                  </div>
                  <div className="text-[#9AA3AD]">
                    {set.reps} reps × {set.weight}kg
                    {set.rpe && ` @ RPE ${set.rpe}`}
                  </div>
                </div>
              ))}
            </div>

            <SetLogger onAddSet={(reps, weight, rpe) => addSet(currentExerciseIndex, reps, weight, rpe)} />

            {currentExercise.sets.length >= currentExercise.targetSets && (
              <button
                onClick={() => {
                  if (currentExerciseIndex < workout.length - 1) {
                    setCurrentExerciseIndex(currentExerciseIndex + 1);
                  } else {
                    finishWorkout();
                  }
                }}
                className="btn-primary w-full mt-4"
              >
                Next Exercise
              </button>
            )}
          </div>
        )}

        <div className="panel-dark p-6">
          <h3 className="font-semibold mb-4">Exercise List</h3>
          <div className="space-y-2">
            {workout.map((we, idx) => (
              <button
                key={we.exercise.id}
                onClick={() => setCurrentExerciseIndex(idx)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  idx === currentExerciseIndex
                    ? 'bg-[#FF6B35]/10 border border-[#FF6B35]'
                    : 'bg-[#0F1113] hover:bg-[#1a1d21]'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>{we.exercise.name}</span>
                  <span className="text-sm text-[#9AA3AD]">
                    {we.sets.length}/{we.targetSets} sets
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SetLogger({ onAddSet }: { onAddSet: (reps: number, weight: number, rpe?: number) => void }) {
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(20);
  const [rpe, setRpe] = useState<number | undefined>(7);

  const handleSubmit = () => {
    onAddSet(reps, weight, rpe);
  };

  return (
    <div className="bg-[#0F1113] rounded-lg p-6">
      <h4 className="font-semibold mb-4">Log Set</h4>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="text-sm text-[#9AA3AD] mb-2 block">Reps</label>
          <input
            type="number"
            value={reps}
            onChange={(e) => setReps(parseInt(e.target.value) || 0)}
            className="w-full bg-[#15171A] border border-[#2a2d33] rounded-lg p-3 text-[#E6EEF3] focus:border-[#FF6B35] focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm text-[#9AA3AD] mb-2 block">Weight (kg)</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(parseInt(e.target.value) || 0)}
            className="w-full bg-[#15171A] border border-[#2a2d33] rounded-lg p-3 text-[#E6EEF3] focus:border-[#FF6B35] focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm text-[#9AA3AD] mb-2 block">RPE</label>
          <input
            type="number"
            min="1"
            max="10"
            value={rpe}
            onChange={(e) => setRpe(parseInt(e.target.value) || undefined)}
            className="w-full bg-[#15171A] border border-[#2a2d33] rounded-lg p-3 text-[#E6EEF3] focus:border-[#FF6B35] focus:outline-none"
          />
        </div>
      </div>
      <button onClick={handleSubmit} className="btn-primary w-full flex items-center justify-center">
        <Plus className="w-5 h-5 mr-2" />
        Add Set
      </button>
    </div>
  );
}
