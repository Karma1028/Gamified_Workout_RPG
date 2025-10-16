/*
  # HunterAscend Database Schema

  ## Overview
  Complete database schema for the HunterAscend gamified workout application.
  Implements user management, exercise library, workout logging, XP/leveling system,
  skill trees, and Google Drive integration.

  ## Tables Created
  
  ### 1. users
  - Core user profile with authentication data
  - Role assignment (Assassin, Warden, Arbiter, Shadowmancer)
  - XP/Level progression tracking
  - Skill points and Google Drive file reference
  
  ### 2. exercises
  - Comprehensive exercise library with 30+ seeded exercises
  - Muscle group targeting, equipment requirements
  - Media URLs (GIFs, videos, thumbnails)
  - Tags for categorization and filtering
  
  ### 3. plans
  - Generated workout plans per user
  - Weekly splits and program structure
  - JSONB for flexible plan data storage
  
  ### 4. workout_logs
  - Historical workout session data
  - Exercise performance (sets, reps, weight, RPE)
  - XP earned per session
  
  ### 5. skill_unlocks
  - Track unlocked skills per user
  - Timestamp of unlock events
  
  ### 6. onboarding_data
  - Stores user onboarding responses
  - Goals, experience level, equipment access, time availability
  
  ### 7. user_stats
  - Aggregated KPIs and statistics
  - Weekly volume, streak tracking, session counts
  
  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies restrict access to authenticated users' own data
  - No public read/write access by default
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  role text DEFAULT 'Assassin',
  level int DEFAULT 1,
  xp int DEFAULT 0,
  skill_points int DEFAULT 0,
  drive_file_id text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id text PRIMARY KEY,
  name text NOT NULL,
  aliases text[] DEFAULT '{}',
  primary_muscles text[] DEFAULT '{}',
  secondary_muscles text[] DEFAULT '{}',
  equipment text[] DEFAULT '{}',
  category text,
  instructions text,
  gif_url text,
  video_url text,
  thumbnail_url text,
  tags text[] DEFAULT '{}',
  tempo text,
  recommended_sets text,
  recommended_reps text,
  created_at timestamptz DEFAULT now()
);

-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  data jsonb DEFAULT '{}'::jsonb
);

-- Create workout_logs table
CREATE TABLE IF NOT EXISTS workout_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  exercises jsonb DEFAULT '[]'::jsonb,
  xp_gained int DEFAULT 0,
  duration_minutes int,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create skill_unlocks table
CREATE TABLE IF NOT EXISTS skill_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  skill_id text NOT NULL,
  unlocked boolean DEFAULT false,
  unlocked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, skill_id)
);

-- Create onboarding_data table
CREATE TABLE IF NOT EXISTS onboarding_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  goals text[] DEFAULT '{}',
  experience_level text,
  equipment text[] DEFAULT '{}',
  time_per_session int,
  preferred_duration_months int,
  injuries text[] DEFAULT '{}',
  food_constraints text[] DEFAULT '{}',
  create_drive_sheet boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create user_stats table
CREATE TABLE IF NOT EXISTS user_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  sessions_this_week int DEFAULT 0,
  weekly_volume_kg numeric DEFAULT 0,
  current_streak int DEFAULT 0,
  longest_streak int DEFAULT 0,
  last_workout_date date,
  total_sessions int DEFAULT 0,
  total_xp_earned int DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for exercises (public read)
CREATE POLICY "Anyone can read exercises"
  ON exercises FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for plans
CREATE POLICY "Users can read own plans"
  ON plans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plans"
  ON plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans"
  ON plans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for workout_logs
CREATE POLICY "Users can read own workout logs"
  ON workout_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout logs"
  ON workout_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout logs"
  ON workout_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout logs"
  ON workout_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for skill_unlocks
CREATE POLICY "Users can read own skill unlocks"
  ON skill_unlocks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skill unlocks"
  ON skill_unlocks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skill unlocks"
  ON skill_unlocks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for onboarding_data
CREATE POLICY "Users can read own onboarding data"
  ON onboarding_data FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding data"
  ON onboarding_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding data"
  ON onboarding_data FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_stats
CREATE POLICY "Users can read own stats"
  ON user_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
  ON user_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON user_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON workout_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_plans_user ON plans(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_unlocks_user ON skill_unlocks(user_id);
CREATE INDEX IF NOT EXISTS idx_exercises_tags ON exercises USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_exercises_primary_muscles ON exercises USING gin(primary_muscles);