import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldAlert, KeyRound } from 'lucide-react';
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

  // Auth State
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [authMode, setAuthMode] = useState<'pin' | 'password'>('pin');
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const res = await api.get('/auth/profiles');
        setProfiles(res.data);

        // Auto-redirect if only one profile (Admin) and no PIN
        // But SKIP if the user explicitly clicked "Switch User" (force=true)
        const searchParams = new URLSearchParams(window.location.search);
        const isForce = searchParams.get('force') === 'true';

        if (!isForce && res.data.length === 1) {
          const singleProfile = res.data[0];
          if (!singleProfile.hasPin) {
            performSwitch(singleProfile.id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProfileClick = (profile: Profile) => {
    // Current User Check (If I am already this user, just go home)
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (currentUser.id === profile.id) {
        navigate('/home');
        return;
      }
    } catch {
      // Ignore error
    }

    // Determine Logic
    if (profile.hasPin) {
      setSelectedProfile(profile);
      setAuthMode('pin');
      setInputValue('');
      setError('');
    } else if (profile.role === 'admin' && profiles.length > 1) {
      // Admin with NO PIN, but other users exist -> Force Password
      setSelectedProfile(profile);
      setAuthMode('password');
      setInputValue('');
      setError('');
    } else {
      performSwitch(profile.id);
    }
  };

  const performSwitch = async (profileId: string, secret?: string) => {
    setSwitching(true);
    setError('');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = { profileId };
    if (authMode === 'pin') payload.pin = secret;
    if (authMode === 'password') payload.password = secret;

    try {
      const res = await api.post('/auth/switch-profile', payload);

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      navigate('/home');
      window.location.reload();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to switch profile';
      setError(msg);

      // Handle backend demands
      if (err.response?.data?.requirePassword) {
        setAuthMode('password');
        setInputValue('');
      }

      setSwitching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;
    performSwitch(selectedProfile.id, inputValue);
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

      {/* Auth Modal (PIN or Password) */}
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

              <h3 className="text-xl font-bold text-white mb-2">
                {authMode === 'pin' ? 'Enter PIN' : 'Enter Password'}
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                {authMode === 'pin'
                  ? `Enter the 4-digit PIN for ${selectedProfile.name}`
                  : `Please enter the password for ${selectedProfile.name} to continue.`}
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {authMode === 'pin' ? (
                  <input
                    type="password"
                    autoFocus
                    maxLength={4}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-4 text-center text-3xl tracking-[1em] text-white focus:outline-none focus:border-apple-blue/50 transition-colors"
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value.replace(/\D/g, ''));
                      setError('');
                    }}
                  />
                ) : (
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="password"
                      autoFocus
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-apple-blue/50 transition-colors"
                      placeholder="Account Password"
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        setError('');
                      }}
                    />
                  </div>
                )}

                {error && (
                  <p className="text-red-500 text-sm">{error}</p>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setSelectedProfile(null); setInputValue(''); }}
                    className="flex-1 py-3 px-4 rounded-xl text-gray-400 hover:bg-white/5 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={switching || (authMode === 'pin' && inputValue.length < 4) || (authMode === 'password' && inputValue.length < 1)}
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
