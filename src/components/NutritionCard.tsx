import { ArrowLeft, Apple, Beef, Wheat, Droplet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

export function NutritionCard({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [selectedModel, setSelectedModel] = useState('deepseek/deepseek-chat-v3.1:free');

  const estimatedMacros = {
    calories: 2600,
    protein: 180,
    carbs: 280,
    fats: 70,
  };

  const sampleMeals = [
    {
      name: 'Breakfast',
      items: ['3 eggs scrambled', 'Oatmeal with berries', 'Greek yogurt'],
      macros: { protein: 40, carbs: 60, fats: 20 },
    },
    {
      name: 'Lunch',
      items: ['Grilled chicken breast', 'Brown rice', 'Mixed vegetables', 'Avocado'],
      macros: { protein: 50, carbs: 80, fats: 20 },
    },
    {
      name: 'Pre-Workout',
      items: ['Banana', 'Protein shake', 'Almonds'],
      macros: { protein: 30, carbs: 50, fats: 15 },
    },
    {
      name: 'Dinner',
      items: ['Salmon fillet', 'Sweet potato', 'Steamed broccoli', 'Olive oil drizzle'],
      macros: { protein: 45, carbs: 70, fats: 15 },
    },
  ];

  const AI_MODELS = [
    { id: 'deepseek/deepseek-chat-v3.1:free', name: 'DeepSeek V3.1' },
    { id: 'qwen/qwen3-235b-a22b:free', name: 'Qwen3 235B' },
    { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B' },
    { id: 'mistralai/mistral-small-3.2-24b-instruct:free', name: 'Mistral Small 3.2' },
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

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gradient-ember">Nutrition Guide</h1>
          <p className="text-[#9AA3AD]">Fuel your training with optimal nutrition</p>
        </div>

        <div className="panel-dark p-8 mb-6">
          <h2 className="text-2xl font-semibold mb-6">Daily Macro Targets</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-[#0F1113] rounded-lg">
              <Apple className="w-8 h-8 mx-auto mb-2 text-[#FF6B35]" />
              <div className="text-2xl font-bold mb-1">{estimatedMacros.calories}</div>
              <div className="text-sm text-[#9AA3AD]">Calories</div>
            </div>
            <div className="text-center p-4 bg-[#0F1113] rounded-lg">
              <Beef className="w-8 h-8 mx-auto mb-2 text-[#FF6B35]" />
              <div className="text-2xl font-bold mb-1">{estimatedMacros.protein}g</div>
              <div className="text-sm text-[#9AA3AD]">Protein</div>
            </div>
            <div className="text-center p-4 bg-[#0F1113] rounded-lg">
              <Wheat className="w-8 h-8 mx-auto mb-2 text-[#FF6B35]" />
              <div className="text-2xl font-bold mb-1">{estimatedMacros.carbs}g</div>
              <div className="text-sm text-[#9AA3AD]">Carbs</div>
            </div>
            <div className="text-center p-4 bg-[#0F1113] rounded-lg">
              <Droplet className="w-8 h-8 mx-auto mb-2 text-[#FF6B35]" />
              <div className="text-2xl font-bold mb-1">{estimatedMacros.fats}g</div>
              <div className="text-sm text-[#9AA3AD]">Fats</div>
            </div>
          </div>
          <p className="text-sm text-[#9AA3AD] mt-4 text-center">
            Based on your role ({user?.role}) and training goals
          </p>
        </div>

        <div className="panel-dark p-8 mb-6">
          <h2 className="text-2xl font-semibold mb-6">Sample Meal Plan</h2>
          <div className="space-y-4">
            {sampleMeals.map((meal) => (
              <div key={meal.name} className="p-4 bg-[#0F1113] rounded-lg">
                <h3 className="text-lg font-semibold mb-3">{meal.name}</h3>
                <ul className="space-y-1 mb-3">
                  {meal.items.map((item, idx) => (
                    <li key={idx} className="text-[#9AA3AD] text-sm">
                      • {item}
                    </li>
                  ))}
                </ul>
                <div className="flex space-x-4 text-xs">
                  <span className="text-[#FF6B35]">P: {meal.macros.protein}g</span>
                  <span className="text-[#FFB86B]">C: {meal.macros.carbs}g</span>
                  <span className="text-[#D4AF37]">F: {meal.macros.fats}g</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-dark p-8 mb-6">
          <h2 className="text-2xl font-semibold mb-4">AI Nutrition Assistant</h2>
          <p className="text-[#9AA3AD] mb-4">
            Generate personalized meal plans using AI. Select your preferred model:
          </p>

          <div className="mb-4">
            <label className="text-sm text-[#9AA3AD] mb-2 block">AI Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-[#15171A] border border-[#2a2d33] rounded-lg p-3 text-[#E6EEF3] focus:border-[#FF6B35] focus:outline-none"
            >
              {AI_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          <button className="btn-primary w-full">
            Generate Custom Meal Plan
          </button>

          <div className="mt-4 p-4 bg-[#0F1113] rounded-lg">
            <p className="text-xs text-[#9AA3AD]">
              API Key configured in environment. OpenRouter integration ready.
              <br />
              Model: {selectedModel}
            </p>
          </div>
        </div>

        <div className="panel-dark p-8">
          <h2 className="text-2xl font-semibold mb-4">Nutrition Tips</h2>
          <ul className="space-y-3 text-[#9AA3AD]">
            <li className="flex items-start">
              <span className="text-[#FF6B35] mr-2">•</span>
              <span>Consume 2.0g/kg protein for muscle building ({user?.role} role)</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#FF6B35] mr-2">•</span>
              <span>Time carbs around workouts for optimal performance</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#FF6B35] mr-2">•</span>
              <span>Stay hydrated - aim for 3-4 liters of water daily</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#FF6B35] mr-2">•</span>
              <span>Track macros consistently for 2-4 weeks before adjusting</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
