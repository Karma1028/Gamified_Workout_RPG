import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  level: number;
  xp: number;
  skill_points: number;
  drive_file_id: string | null;
  avatar_url: string | null;
};

export type Exercise = {
  id: string;
  name: string;
  aliases: string[];
  primary_muscles: string[];
  secondary_muscles: string[];
  equipment: string[];
  category: string | null;
  instructions: string | null;
  gif_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  tags: string[];
  tempo: string | null;
  recommended_sets: string | null;
  recommended_reps: string | null;
};

export type WorkoutLog = {
  id: string;
  user_id: string;
  date: string;
  exercises: {
    exercise_id: string;
    exercise_name?: string;
    sets: { reps: number; weight: number; rpe?: number }[];
  }[];
  xp_gained: number;
  duration_minutes?: number;
  notes?: string;
  created_at: string;
};

export type OnboardingData = {
  goals: string[];
  experience_level: string;
  equipment: string[];
  time_per_session: number;
  preferred_duration_months: number;
  injuries: string[];
  food_constraints: string[];
  create_drive_sheet: boolean;
};
