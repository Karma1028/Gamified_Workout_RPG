import { ArrowLeft, Download, Upload, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useState } from 'react';

export function Settings({ onBack }: { onBack: () => void }) {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const syncToDrive = async () => {
    setLoading(true);
    setMessage('');

    try {
      const { data: logs } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false });

      if (!logs || logs.length === 0) {
        setMessage('No workout data to sync');
        setLoading(false);
        return;
      }

      const csvData = logs.map((log) => {
        const exercises = (log.exercises as any[]) || [];
        return exercises.map((ex) => ({
          date: log.date,
          exercise_id: ex.exercise_id,
          exercise_name: ex.exercise_name || ex.exercise_id,
          sets: JSON.stringify(ex.sets),
          xp_gained: log.xp_gained,
        }));
      }).flat();

      setMessage(`Ready to sync ${csvData.length} exercise records. Google Drive integration requires OAuth configuration.`);
    } catch (error) {
      setMessage('Error preparing data for sync');
    }

    setLoading(false);
  };

  const exportCSV = async () => {
    setLoading(true);

    try {
      const { data: logs } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false });

      if (!logs || logs.length === 0) {
        setMessage('No workout data to export');
        setLoading(false);
        return;
      }

      const csvRows = ['Date,Exercise,Sets,Reps,Weight,RPE,XP'];

      logs.forEach((log) => {
        const exercises = (log.exercises as any[]) || [];
        exercises.forEach((ex) => {
          ex.sets.forEach((set: any, idx: number) => {
            csvRows.push(
              `${log.date},${ex.exercise_name || ex.exercise_id},${idx + 1},${set.reps},${set.weight},${set.rpe || ''},${log.xp_gained}`
            );
          });
        });
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hunter_ascend_workouts_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      setMessage('CSV exported successfully');
    } catch (error) {
      setMessage('Error exporting CSV');
    }

    setLoading(false);
  };

  const revokeDriveAccess = async () => {
    if (!confirm('Are you sure you want to revoke Drive access?')) return;

    setLoading(true);
    await supabase
      .from('users')
      .update({ drive_file_id: null })
      .eq('id', user?.id);

    await refreshUser();
    setMessage('Drive access revoked');
    setLoading(false);
  };

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
          <h1 className="text-4xl font-bold mb-2 text-gradient-ember">Settings</h1>
          <p className="text-[#9AA3AD]">Manage your preferences and data</p>
        </div>

        {message && (
          <div className="panel-dark p-4 mb-6 border border-[#FF6B35]">
            <p className="text-center">{message}</p>
          </div>
        )}

        <div className="panel-dark p-8 mb-6">
          <h2 className="text-2xl font-semibold mb-6">Data Export & Sync</h2>

          <div className="space-y-4">
            <button
              onClick={exportCSV}
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center"
            >
              <Download className="w-5 h-5 mr-2" />
              {loading ? 'Exporting...' : 'Export CSV'}
            </button>

            <button
              onClick={syncToDrive}
              disabled={loading}
              className="w-full btn-secondary flex items-center justify-center"
            >
              <Upload className="w-5 h-5 mr-2" />
              {loading ? 'Syncing...' : 'Sync to Drive'}
            </button>

            {user?.drive_file_id && (
              <button
                onClick={revokeDriveAccess}
                disabled={loading}
                className="w-full btn-secondary flex items-center justify-center hover:border-red-500 hover:text-red-500"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Revoke Drive Access
              </button>
            )}
          </div>

          <div className="mt-6 p-4 bg-[#0F1113] rounded-lg">
            <p className="text-sm text-[#9AA3AD]">
              {user?.drive_file_id
                ? `Google Drive linked. File ID: ${user.drive_file_id.substring(0, 20)}...`
                : 'Google Drive not linked. Complete onboarding to enable Drive sync.'}
            </p>
          </div>
        </div>

        <div className="panel-dark p-8 mb-6">
          <h2 className="text-2xl font-semibold mb-6">Preferences</h2>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-[#0F1113] rounded-lg cursor-pointer">
              <div>
                <div className="font-semibold">Auto Sync to Drive</div>
                <div className="text-sm text-[#9AA3AD]">Automatically sync after each workout</div>
              </div>
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-[#2a2d33] text-[#FF6B35] focus:ring-[#FF6B35]"
                defaultChecked={false}
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-[#0F1113] rounded-lg cursor-pointer">
              <div>
                <div className="font-semibold">Reduce Motion</div>
                <div className="text-sm text-[#9AA3AD]">Disable non-essential animations</div>
              </div>
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-[#2a2d33] text-[#FF6B35] focus:ring-[#FF6B35]"
                defaultChecked={false}
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-[#0F1113] rounded-lg cursor-pointer">
              <div>
                <div className="font-semibold">AI Coach</div>
                <div className="text-sm text-[#9AA3AD]">Enable AI-generated workout adjustments</div>
              </div>
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-[#2a2d33] text-[#FF6B35] focus:ring-[#FF6B35]"
                defaultChecked={true}
              />
            </label>
          </div>
        </div>

        <div className="panel-dark p-8">
          <h2 className="text-2xl font-semibold mb-4">About</h2>
          <div className="space-y-2 text-[#9AA3AD]">
            <p><strong className="text-[#E6EEF3]">Version:</strong> 1.0.0</p>
            <p><strong className="text-[#E6EEF3]">Database:</strong> Supabase PostgreSQL</p>
            <p><strong className="text-[#E6EEF3]">AI Integration:</strong> OpenRouter</p>
            <p><strong className="text-[#E6EEF3]">User ID:</strong> {user?.id.substring(0, 20)}...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
