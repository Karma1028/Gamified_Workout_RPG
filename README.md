# HunterAscend - Gamified Workout App

A Solo Leveling-inspired fitness tracking application with gamification elements including XP, levels, skill trees, and role-based progression.

## Features

- **Google Authentication**: Secure sign-in with Google OAuth
- **Role System**: Choose from 4 roles (Assassin, Warden, Arbiter, Shadowmancer)
- **XP & Leveling**: Earn XP from workouts and level up
- **Workout Runner**: Log exercises with sets, reps, weight, and RPE
- **Skill Tree**: Unlock abilities with skill points
- **Character Sheet**: View your stats and achievements
- **Map/Dungeons**: Weekly quest system with rewards
- **Nutrition Guide**: Macro targets and meal planning
- **Google Drive Integration**: Export and sync workout data
- **AI Integration**: OpenRouter-powered workout plan generation

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS (dark theme with ember accents)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Google OAuth)
- **AI**: OpenRouter API

## Database Schema

The app uses the following main tables:

- `users` - User profiles with role, level, XP, and skill points
- `exercises` - Exercise library (30+ seeded exercises)
- `workout_logs` - Historical workout data
- `skill_unlocks` - Unlocked skills per user
- `user_stats` - Aggregated KPIs (streak, sessions, volume)
- `onboarding_data` - User preferences and goals

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account (already configured)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. The environment variables are already configured in `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

4. Start the development server:

```bash
npm run dev
```

### Google OAuth Setup

To enable Google sign-in:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://ouxznheawjryawmygikq.supabase.co/auth/v1/callback`
6. Add the credentials to Supabase Dashboard:
   - Go to Authentication > Providers > Google
   - Enable Google provider
   - Add your Client ID and Client Secret

## XP Formula

The XP system uses the following formula:

```
exercise_volume_kg = sum(weight_kg * reps) for all sets
base_xp = floor(exercise_volume_kg * 0.02)
intensity_bonus = max(0, (rpe - 6)) * 5 per exercise
exercise_xp = base_xp + intensity_bonus
session_xp = sum(exercise_xp) + session_completion_bonus (25 XP)

Level threshold = ceil(100 * level^1.5)
```

## Skill System

Skills are unlocked based on deterministic criteria:

- **Blade Instinct** (Assassin): 10 high-intensity sessions in 30 days → +5% XP on HIIT
- **Iron Core** (Warden): 12 heavy compound sets in 6 weeks → Unlock heavy templates
- **Second Wind** (Arbiter): 90% adherence over 8 weeks → One-time streak revive
- **Echo of Shadows** (Shadowmancer): 10,000 XP → Unlock micro-program templates
- **Quick Recovery**: 25 total workouts → Reduce rest timers by 25%
- **XP Multiplier**: Reach Level 10 → +10% XP on all exercises

## OpenRouter AI Integration

The app is pre-configured to use OpenRouter for AI-powered features.

### Setup

The API key is already configured: `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`

### Available Models

The app supports 40+ free models including:
- DeepSeek V3.1
- Qwen3 235B
- Llama 3.3 70B
- Mistral Small 3.2

### Integration Points

To add AI functionality, implement these endpoints:

#### POST /api/ai/plan/generate

Generates workout plans based on user profile.

**Python Integration Example**:

```python
# backend/openrouter_integration.py
import os
import requests
import json

OPENROUTER_API_KEY = "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"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

def generate_workout_plan(profile_json, sessions_json):
    prompt = f"""
You are a Fitness Plan Generator.
Input Profile: {json.dumps(profile_json)}
Recent Sessions: {json.dumps(sessions_json)}

Return ONLY JSON with these keys:
- plan_summary: {{weekly_split, sessions: [{{day, exercises}}]}}
- adjustments: [{{exercise_id, action, reason}}]
- xp_estimate: integer
- skill_unlocks: [{{skill_id, criteria_met, message}}]
- nutrition_short: string (max 40 words)
"""

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "deepseek/deepseek-chat-v3.1:free",
        "messages": [
            {"role": "system", "content": "You are a concise fitness plan generator"},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 800,
        "temperature": 0.1
    }

    resp = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=30)
    resp.raise_for_status()

    content = resp.json()["choices"][0]["message"]["content"]
    return json.loads(content)
```

### Caching Strategy

To minimize API calls:
1. Hash the input (profile + recent sessions)
2. Check if cached response exists in database
3. Return cached response if exists, otherwise call API
4. Cache new responses with 24-hour TTL

## Google Drive Integration

### Setup

The Drive integration creates a spreadsheet once during onboarding and syncs on-demand.

**Important**: Drive integration requires additional OAuth scopes:
- `https://www.googleapis.com/auth/drive.file`

### Flow

1. During onboarding, if user opts in:
   - Create new spreadsheet with headers
   - Store `fileId` in `users.drive_file_id`

2. User clicks "Sync to Drive" in Settings:
   - Generate CSV from workout logs
   - Append to existing spreadsheet

### Implementation Notes

The current implementation exports CSV locally. To enable actual Drive sync:

1. Add Drive scope to Supabase Auth configuration
2. Implement server-side Drive API calls using service account
3. Store Drive credentials securely

## Animation System

The app uses CSS animations and is ready for Lottie integration:

### Current Animations
- XP float animation (CSS keyframes)
- Level-up burst animation
- Pulse glow on level progress bar

### Lottie Integration (Placeholders)

To add Lottie animations:

1. Install lottie-react:
```bash
npm install lottie-react
```

2. Find animations on [LottieFiles](https://lottiefiles.com/):
   - XP float: Search "xp numeric floating"
   - Level up: Search "level up burst confetti"
   - Loot chest: Search "chest open treasure"
   - Rest timer: Search "circular countdown timer"

3. Replace CSS animations with Lottie components:

```tsx
import Lottie from 'lottie-react';
import levelUpAnimation from './animations/level-up.json';

<Lottie animationData={levelUpAnimation} loop={false} />
```

## Theme Colors

The app uses a dark theme with ember accents:

- Background: `#0F1113`
- Panels: `#15171A`
- Primary Accent: `#FF6B35` (ember)
- Secondary Accent: `#FFB86B` (soft glow)
- Gold: `#D4AF37` (loot/rewards)
- Text Muted: `#9AA3AD`
- Text Primary: `#E6EEF3`

## Deployment

### Build

```bash
npm run build
```

### Type Check

```bash
npm run typecheck
```

### Deploy

The app is deployed automatically by the hosting platform. Access the preview at the provided URL.

## Data Export

Users can export their workout data in CSV format from the Settings page. The export includes:
- Date
- Exercise name
- Sets, reps, weight, RPE
- XP earned

## API Endpoints (Backend Implementation Guide)

If implementing a separate backend, use these endpoints:

- `POST /auth/google` - Exchange token, create user
- `GET /user/me` - Get user profile
- `POST /onboard/answers` - Save onboarding data
- `POST /ai/plan/generate` - Generate AI workout plan
- `POST /workout_log` - Log workout session
- `GET /dashboard` - Get dashboard KPIs
- `POST /export/drive` - Sync to Google Drive
- `GET /exercises` - Get exercise library
- `GET /exercise/:id` - Get exercise details
- `POST /skill/spend` - Unlock skill

## Development Notes

### Current State
- ✅ Full frontend implementation
- ✅ Supabase database with RLS
- ✅ Authentication with Google OAuth
- ✅ XP/leveling system
- ✅ Workout logging with animations
- ✅ Skill tree system
- ✅ Character progression
- ✅ Data export
- ⏳ OpenRouter AI integration (ready for implementation)
- ⏳ Google Drive sync (CSV export working, Drive API pending OAuth config)

### Next Steps

1. Configure Google OAuth redirect URIs
2. Implement OpenRouter API calls using the Python integration
3. Add Drive API OAuth flow for spreadsheet sync
4. Replace CSS animations with Lottie files
5. Add more exercises to the library
6. Implement dungeon/quest system with actual workouts

## License

This project is for demonstration purposes. Solo Leveling is a trademark of its respective owners - this app uses original artwork and names.

## Support

For issues or questions, check the database logs in Supabase Dashboard or review browser console for frontend errors.
