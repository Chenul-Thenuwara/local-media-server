import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Lock, User as UserIcon, Shield, ShieldAlert, ChevronRight } from 'lucide-react';
import api from '../../lib/api';

interface Profile {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  isManaged: boolean;
  hasPin: boolean;
}

const ProfileSelection = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const res = await api.get('/auth/profiles');
      setProfiles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileClick = (profile: Profile) => {
    if (profile.hasPin) {
      setSelectedProfile(profile);
      setPin('');
      setError('');
    } else {
      performSwitch(profile.id);
    }
  };

  const performSwitch = async (profileId: string, pinCode?: string) => {
    setSwitching(true);
    setError('');
    try {
      const res = await api.post('/auth/switch-profile', { profileId, pin: pinCode });

      // Update Auth Data
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      // Force reload or redirect to clear state/cache if needed, but navigate is faster
      // Navigate to Home
      navigate('/home');
      window.location.reload(); // Ensure global state/headers update
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to switch profile');
      setSwitching(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;
    performSwitch(selectedProfile.id, pin);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading profiles...</div>;

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-br from-apple-blue/10 via-transparent to-purple-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 text-center w-full max-w-4xl"
      >
        <h1 className="text-4xl font-bold text-white mb-2">Who's Watching?</h1>
        <p className="text-gray-400 mb-12">Select your profile to continue</p>

        <div className="flex flex-wrap items-center justify-center gap-8">
          {profiles.map((profile) => (
            <motion.button
              key={profile.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleProfileClick(profile)}
              className="group flex flex-col items-center gap-4"
            >
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border-4 border-transparent group-hover:border-apple-blue transition-all flex items-center justify-center overflow-hidden shadow-2xl relative">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold text-gray-400 group-hover:text-white transition-colors">
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  )}

                  {/* Lock Indicator */}
                  {profile.hasPin && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Lock className="text-white w-8 h-8" />
                    </div>
                  )}
                </div>

                {/* Badges */}
                {profile.role === 'admin' && !profile.isManaged && (
                  <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black p-1.5 rounded-full shadow-lg border-2 border-black">
                    <ShieldAlert size={16} />
                  </div>
                )}
              </div>

              <span className="text-lg font-medium text-gray-300 group-hover:text-white transition-colors">
                {profile.name}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* PIN Modal */}
      <AnimatePresence>
        {selectedProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl"
            >
              <div className="w-20 h-20 rounded-full mx-auto mb-6 bg-white/10 overflow-hidden">
                {selectedProfile.avatar ? (
                  <img src={selectedProfile.avatar} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white">
                    {selectedProfile.name.charAt(0)}
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold text-white mb-2">Enter PIN</h3>
              <p className="text-gray-400 text-sm mb-6">Enter the 4-digit PIN for {selectedProfile.name}</p>

              <form onSubmit={handlePinSubmit} className="space-y-6">
                <input
                  type="password"
                  autoFocus
                  maxLength={4}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-4 text-center text-3xl tracking-[1em] text-white focus:outline-none focus:border-apple-blue/50 transition-colors"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/\D/g, ''));
                    setError('');
                  }}
                />

                {error && (
                  <p className="text-red-500 text-sm">{error}</p>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setSelectedProfile(null); setPin(''); }}
                    className="flex-1 py-3 px-4 rounded-xl text-gray-400 hover:bg-white/5 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={switching || pin.length < 4}
                    className="flex-1 py-3 px-4 rounded-xl bg-apple-blue hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
                  >
                    {switching ? '...' : 'Enter'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileSelection;
