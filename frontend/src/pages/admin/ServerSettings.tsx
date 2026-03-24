import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Server, Cpu, Activity, ShieldAlert, Globe } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const ServerSettings = () => {
  const [settings, setSettings] = useState({
    serverName: '',
    transcodingEnabled: true,
    hardwareAcceleration: false,
    maintenanceMode: false,
    language: 'en-US'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await adminService.getSettings();
      setSettings(data);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const updated = await adminService.updateSettings(settings);
      setSettings(updated);
      setMessage({ type: 'success', text: 'Settings saved successfully' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-white">Loading configuration...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Server Settings</h1>
        <p className="text-gray-400">Configure core system preferences and performance options.</p>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl mb-6 ${message.type === 'success'
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
        >
          {message.text}
        </motion.div>
      )}

      <form onSubmit={handleSave} className="space-y-8">

        {/* General Settings */}
        <section className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
              <Server size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">General</h2>
              <p className="text-sm text-gray-400">Basic server identification.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Server Name</label>
              <Input
                value={settings.serverName}
                onChange={(e) => setSettings({ ...settings, serverName: e.target.value })}
                className="bg-black/30 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Language</label>
              <div className="relative">
                <Globe size={16} className="absolute left-3 top-3 text-gray-500" />
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:outline-none focus:border-apple-blue"
                >
                  <option value="en-US">English (United States)</option>
                  <option value="es-ES">Spanish (Spain)</option>
                  <option value="fr-FR">French (France)</option>
                  <option value="de-DE">German (Germany)</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Transcoding Settings */}
        <section className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
              <Cpu size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Transcoding</h2>
              <p className="text-sm text-gray-400">Manage media conversion performance.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3">
                <Activity size={20} className="text-gray-400" />
                <div>
                  <p className="text-white font-medium">Enable Transcoding</p>
                  <p className="text-xs text-gray-400">Allow server to convert media on the fly.</p>
                </div>
              </div>
              <Toggle
                checked={settings.transcodingEnabled}
                onChange={(v) => setSettings({ ...settings, transcodingEnabled: v })}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3">
                <Cpu size={20} className="text-gray-400" />
                <div>
                  <p className="text-white font-medium">Hardware Acceleration</p>
                  <p className="text-xs text-gray-400">Use GPU for transcoding (requires configuring).</p>
                </div>
              </div>
              <Toggle
                checked={settings.hardwareAcceleration}
                onChange={(v) => setSettings({ ...settings, hardwareAcceleration: v })}
              />
            </div>
          </div>
        </section>

        {/* Advanced / Maintenance */}
        <section className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-500/20 text-red-400 rounded-xl">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Maintenance</h2>
              <p className="text-sm text-gray-400">System availability control.</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
            <div className="flex items-center gap-3">
              <ShieldAlert size={20} className="text-red-400" />
              <div>
                <p className="text-red-200 font-medium">Maintenance Mode</p>
                <p className="text-xs text-red-400/70">Restrict access to admin users only.</p>
              </div>
            </div>
            <Toggle
              checked={settings.maintenanceMode}
              onChange={(v) => setSettings({ ...settings, maintenanceMode: v })}
              variant="danger"
            />
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={saving} className="bg-apple-blue hover:bg-blue-600 px-8">
            <Save size={18} className="mr-2" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

// Simple Toggle Component
const Toggle = ({ checked, onChange, variant = 'primary' }: { checked: boolean, onChange: (v: boolean) => void, variant?: 'primary' | 'danger' }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`w-12 h-6 rounded-full transition-colors relative ${checked
        ? (variant === 'danger' ? 'bg-red-500' : 'bg-apple-blue')
        : 'bg-white/20'
      }`}
  >
    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all transform ${checked ? 'left-7' : 'left-1'
      }`} />
  </button>
);

export default ServerSettings;
