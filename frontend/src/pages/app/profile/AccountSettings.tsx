import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Mail, Save, KeyRound, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../../../lib/api';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
}

const AccountSettings = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI States
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/user/profile');
      setProfile(res.data);
      setName(res.data.name);
      setEmail(res.data.email);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await api.put('/user/profile', { name, email });
      setProfile(res.data);
      setName(res.data.name);
      setEmail(res.data.email);
      setMessage({ type: 'success', text: 'Profile updated successfully' });

      // Update local storage if needed (for header name display)
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.name = res.data.name;
        user.email = res.data.email;
        localStorage.setItem('user', JSON.stringify(user));
        window.dispatchEvent(new Event('storage'));
      }

    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setSaving(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      setSaving(false);
      return;
    }

    try {
      await api.put('/user/profile/password', { currentPassword, newPassword });
      setMessage({ type: 'success', text: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Account Settings
        </h1>
        <p className="text-gray-400 mt-2">Manage your profile and security preferences.</p>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
        >
          {message.type === 'error' ? <AlertCircle size={20} /> : <ShieldCheck size={20} />}
          {message.text}
        </motion.div>
      )}

      <div className="grid gap-8">
        {/* Profile Section */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Profile Information</h2>
              <p className="text-sm text-gray-400">Update your account details</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Display Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 bg-black/20 border-white/10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-black/20 border-white/10"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="text-sm text-gray-500">
                Joined: {new Date(profile?.joinedAt || '').toLocaleDateString()} • Role: <span className="capitalize">{profile?.role}</span>
              </div>
              <Button type="submit" disabled={saving} className="bg-apple-blue hover:bg-apple-blue/90">
                <Save size={16} className="mr-2" />
                Save Changes
              </Button>
            </div>
          </form>
        </section>

        {/* Security Section */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
              <Lock size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Security</h2>
              <p className="text-sm text-gray-400">Change your password</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Current Password</label>
              <div className="relative">
                <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pl-10 bg-black/20 border-white/10 max-w-md"
                  placeholder="Enter current password"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 bg-black/20 border-white/10"
                    placeholder="Min 6 characters"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Confirm New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 bg-black/20 border-white/10"
                    placeholder="Re-enter new password"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/10">
              <Button type="submit" disabled={saving} variant="ghost" className="border border-white/20 hover:bg-white/10 text-white">
                Update Password
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default AccountSettings;
