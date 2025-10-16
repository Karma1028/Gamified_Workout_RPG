# OpenRouter AI Integration Guide

This document provides complete instructions for integrating OpenRouter AI into HunterAscend.

## API Configuration

**API Key (Already Configured)**:
```
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
```

**Base URL**:
```
https://openrouter.ai/api/v1/chat/completions
```

## Available Free Models

The app supports 40+ free models. Here are the recommended ones:

| Model ID | Name | Best For |
|----------|------|----------|
| `deepseek/deepseek-chat-v3.1:free` | DeepSeek V3.1 | General fitness planning |
| `qwen/qwen3-235b-a22b:free` | Qwen3 235B | Complex workout analysis |
| `meta-llama/llama-3.3-70b-instruct:free` | Llama 3.3 70B | Natural language responses |
| `mistralai/mistral-small-3.2-24b-instruct:free` | Mistral Small 3.2 | Fast responses |

## Python Integration Code

### 1. Backend Setup (FastAPI Example)

Create `backend/openrouter_integration.py`:

```python
import os
import requests
import json
import hashlib
from datetime import datetime, timedelta

OPENROUTER_API_KEY = "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"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Simple in-memory cache (use Redis in production)
response_cache = {}

def hash_request(profile, sessions):
    """Create hash of request for caching"""
    data = json.dumps({"profile": profile, "sessions": sessions}, sort_keys=True)
    return hashlib.md5(data.encode()).hexdigest()

def generate_workout_plan(profile_json, sessions_json, model_id="deepseek/deepseek-chat-v3.1:free"):
    """
    Generate AI workout plan using OpenRouter

    Args:
        profile_json: User profile dict (role, level, goals, equipment, etc.)
        sessions_json: Recent workout sessions array
        model_id: OpenRouter model to use

    Returns:
        dict with keys: plan_summary, adjustments, xp_estimate, skill_unlocks, nutrition_short
    """

    # Check cache
    cache_key = hash_request(profile_json, sessions_json)
    if cache_key in response_cache:
        cached = response_cache[cache_key]
        if cached['timestamp'] > datetime.now() - timedelta(hours=24):
            return cached['data']

    # Compress profile for token efficiency
    compact_profile = {
        "role": profile_json.get("role"),
        "level": profile_json.get("level"),
        "xp": profile_json.get("xp"),
        "goals": profile_json.get("goals", []),
        "equipment": profile_json.get("equipment", []),
        "experience": profile_json.get("experience_level"),
        "time": profile_json.get("time_per_session"),
        "injuries": profile_json.get("injuries", [])
    }

    # Compress recent sessions
    compact_sessions = []
    for session in sessions_json[-5:]:  # Last 5 sessions only
        compact_sessions.append({
            "date": session.get("date"),
            "xp": session.get("xp_gained"),
            "exercises": len(session.get("exercises", []))
        })

    prompt = f"""You are a Fitness Plan Generator for HunterAscend.

Input Profile: {json.dumps(compact_profile)}
Recent Sessions: {json.dumps(compact_sessions)}

Generate a workout plan. Return ONLY valid JSON with these exact keys:
{{
  "plan_summary": {{
    "weekly_split": "Upper/Lower 2x",
    "sessions": [
      {{
        "day": "Monday",
        "exercises": [
          {{"exercise_id": "e_barbell_back_squat", "sets": 3, "reps": "6-8"}},
          {{"exercise_id": "e_leg_press", "sets": 3, "reps": "10-12"}}
        ]
      }}
    ]
  }},
  "adjustments": [
    {{
      "exercise_id": "e_deadlift",
      "action": "reduce_volume",
      "reason": "User reported lower back concern"
    }}
  ],
  "xp_estimate": 1200,
  "skill_unlocks": [
    {{
      "skill_id": "blade_instinct",
      "criteria_met": false,
      "message": "Need 2 more HIIT sessions in 14 days"
    }}
  ],
  "nutrition_short": "Target 2600 kcal, 180g protein, 280g carbs, 70g fats. Eat 4 meals daily."
}}

Rules:
- Match exercises to available equipment: {compact_profile['equipment']}
- Respect injuries: {compact_profile['injuries']}
- Align with role: {compact_profile['role']}
- Session length: {compact_profile['time']} minutes
- Use only exercise_ids from the database
"""

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://hunter-ascend.app",  # Optional: for usage tracking
        "X-Title": "HunterAscend"  # Optional: for usage tracking
    }

    payload = {
        "model": model_id,
        "messages": [
            {
                "role": "system",
                "content": "You are a concise fitness plan generator. Output only valid JSON."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "max_tokens": 1000,
        "temperature": 0.2,
        "top_p": 0.9
    }

    try:
        resp = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=30)
        resp.raise_for_status()

        content = resp.json()["choices"][0]["message"]["content"]

        # Extract JSON from markdown code blocks if present
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        result = json.loads(content)

        # Cache the response
        response_cache[cache_key] = {
            'data': result,
            'timestamp': datetime.now()
        }

        return result

    except requests.exceptions.RequestException as e:
        print(f"OpenRouter API error: {e}")
        # Return fallback response
        return generate_fallback_plan(profile_json)
    except (json.JSONDecodeError, KeyError) as e:
        print(f"JSON parsing error: {e}")
        return generate_fallback_plan(profile_json)

def generate_fallback_plan(profile_json):
    """Generate rule-based plan if AI fails"""
    role = profile_json.get("role", "Assassin")

    # Simple rule-based plan
    if role == "Warden":
        split = "Upper/Lower 2x"
        exercises = ["e_barbell_back_squat", "e_deadlift", "e_barbell_bench"]
    elif role == "Assassin":
        split = "HIIT + Strength 3x"
        exercises = ["e_box_jump", "e_kettlebell_swing", "e_battle_rope"]
    elif role == "Shadowmancer":
        split = "Push/Pull/Legs"
        exercises = ["e_barbell_bench", "e_pullup", "e_leg_press"]
    else:  # Arbiter
        split = "Full Body 3x"
        exercises = ["e_squat_bodyweight", "e_pushup", "e_plank"]

    return {
        "plan_summary": {
            "weekly_split": split,
            "sessions": [
                {
                    "day": "Monday",
                    "exercises": [
                        {"exercise_id": ex, "sets": 3, "reps": "8-12"}
                        for ex in exercises
                    ]
                }
            ]
        },
        "adjustments": [],
        "xp_estimate": 800,
        "skill_unlocks": [],
        "nutrition_short": "Aim for balanced macros: 40% carbs, 30% protein, 30% fats"
    }

def generate_nutrition_plan(profile_json, dietary_constraints, model_id="deepseek/deepseek-chat-v3.1:free"):
    """
    Generate personalized nutrition plan

    Args:
        profile_json: User profile dict
        dietary_constraints: List of constraints (vegetarian, etc.)
        model_id: OpenRouter model to use

    Returns:
        dict with meal plan and macro breakdown
    """

    prompt = f"""Generate a nutrition plan for a {profile_json['role']} role user.

Goals: {profile_json.get('goals', [])}
Constraints: {dietary_constraints}
Time per session: {profile_json.get('time_per_session')} min

Return ONLY valid JSON:
{{
  "daily_macros": {{
    "calories": 2600,
    "protein": 180,
    "carbs": 280,
    "fats": 70
  }},
  "meals": [
    {{
      "name": "Breakfast",
      "items": ["3 eggs", "oatmeal", "berries"],
      "macros": {{"p": 40, "c": 60, "f": 20}}
    }}
  ],
  "tips": ["Tip 1", "Tip 2"]
}}
"""

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": model_id,
        "messages": [
            {"role": "system", "content": "You are a nutrition expert. Output only valid JSON."},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 800,
        "temperature": 0.3
    }

    try:
        resp = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=30)
        resp.raise_for_status()

        content = resp.json()["choices"][0]["message"]["content"]

        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()

        return json.loads(content)

    except Exception as e:
        print(f"Nutrition plan error: {e}")
        return {
            "daily_macros": {"calories": 2600, "protein": 180, "carbs": 280, "fats": 70},
            "meals": [],
            "tips": ["Eat whole foods", "Stay hydrated"]
        }

# Example usage
if __name__ == "__main__":
    # Test the integration
    test_profile = {
        "role": "Assassin",
        "level": 3,
        "xp": 450,
        "goals": ["conditioning", "explosive"],
        "equipment": ["bodyweight", "dumbbells", "kettlebells"],
        "experience_level": "Intermediate",
        "time_per_session": 45,
        "injuries": []
    }

    test_sessions = [
        {
            "date": "2025-10-15",
            "xp_gained": 150,
            "exercises": [
                {"exercise_id": "e_kettlebell_swing", "sets": [{"reps": 15, "weight": 20}]},
                {"exercise_id": "e_box_jump", "sets": [{"reps": 10, "weight": 0}]}
            ]
        }
    ]

    result = generate_workout_plan(test_profile, test_sessions)
    print(json.dumps(result, indent=2))
```

### 2. FastAPI Endpoint Example

Create `backend/main.py`:

```python
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import openrouter_integration as ai

app = FastAPI(title="HunterAscend API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProfileRequest(BaseModel):
    role: str
    level: int
    xp: int
    goals: List[str]
    equipment: List[str]
    experience_level: str
    time_per_session: int
    injuries: List[str]

class SessionData(BaseModel):
    date: str
    xp_gained: int
    exercises: List[dict]

class PlanRequest(BaseModel):
    profile: ProfileRequest
    recent_sessions: List[SessionData]
    model_id: Optional[str] = "deepseek/deepseek-chat-v3.1:free"

@app.post("/api/ai/plan/generate")
async def generate_plan(request: PlanRequest):
    """Generate AI workout plan"""
    try:
        result = ai.generate_workout_plan(
            request.profile.dict(),
            [s.dict() for s in request.recent_sessions],
            request.model_id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/nutrition/generate")
async def generate_nutrition(profile: ProfileRequest, constraints: List[str]):
    """Generate AI nutrition plan"""
    try:
        result = ai.generate_nutrition_plan(
            profile.dict(),
            constraints
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/models")
async def list_models():
    """List available AI models"""
    return {
        "models": [
            {"id": "deepseek/deepseek-chat-v3.1:free", "name": "DeepSeek V3.1"},
            {"id": "qwen/qwen3-235b-a22b:free", "name": "Qwen3 235B"},
            {"id": "meta-llama/llama-3.3-70b-instruct:free", "name": "Llama 3.3 70B"},
            {"id": "mistralai/mistral-small-3.2-24b-instruct:free", "name": "Mistral Small 3.2"}
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 3. Frontend Integration

Update `NutritionCard.tsx` to call the API:

```typescript
const generateMealPlan = async () => {
  setLoading(true);

  try {
    const response = await fetch('http://localhost:8000/api/ai/nutrition/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: {
          role: user?.role,
          level: user?.level,
          xp: user?.xp,
          goals: ['muscle building'],
          equipment: ['full gym'],
          experience_level: 'Intermediate',
          time_per_session: 60,
          injuries: []
        },
        constraints: ['vegetarian']
      })
    });

    const data = await response.json();
    setMealPlan(data);
  } catch (error) {
    console.error('Error generating meal plan:', error);
  }

  setLoading(false);
};
```

## Deployment

### Option 1: Deploy with Docker

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Create `backend/requirements.txt`:

```
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0
requests==2.31.0
```

### Option 2: Deploy to Vercel (Serverless)

Create `api/plan.py`:

```python
from http.server import BaseHTTPRequestHandler
import json
import sys
sys.path.append('..')
from backend import openrouter_integration as ai

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)

        result = ai.generate_workout_plan(
            data['profile'],
            data['recent_sessions'],
            data.get('model_id', 'deepseek/deepseek-chat-v3.1:free')
        )

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(result).encode())
```

## Rate Limiting & Cost Management

OpenRouter free tier has limits. To manage usage:

1. **Cache aggressively**: Cache responses for 24 hours
2. **Compress prompts**: Use compact JSON to reduce tokens
3. **Fallback to rules**: Use rule-based system when quota is exceeded
4. **Batch requests**: Don't call AI on every page load

## Testing

Test the integration:

```bash
cd backend
python openrouter_integration.py
```

Expected output:
```json
{
  "plan_summary": {...},
  "adjustments": [...],
  "xp_estimate": 1200,
  "skill_unlocks": [...],
  "nutrition_short": "..."
}
```

## Troubleshooting

### API Key Issues
- Verify the key is correct and active
- Check OpenRouter dashboard for usage limits

### JSON Parsing Errors
- The code handles markdown code blocks
- Fallback to rule-based system if parsing fails

### Network Timeouts
- Increase timeout to 60s for large models
- Use smaller models for faster responses

## Next Steps

1. Deploy the FastAPI backend
2. Update frontend API URLs
3. Add error handling and loading states
4. Implement caching with Redis
5. Monitor API usage on OpenRouter dashboard
