import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, User, Lock, Film, Tv, Music, Image, Check, AlertCircle } from 'lucide-react';
import { adminService } from '../../services/adminService';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => Promise<void>;
}

const libTypeIcon = (type: string) => {
  if (type === 'movies' || type === 'movie') return <Film size={14} className="text-blue-400" />;
  if (type === 'tv') return <Tv size={14} className="text-purple-400" />;
  if (type === 'music') return <Music size={14} className="text-green-400" />;
  return <Image size={14} className="text-pink-400" />;
};

const AddUserModal = ({ isOpen, onClose, onSubmit }: AddUserModalProps) => {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [libraries, setLibraries] = useState<any[]>([]);
  const [selectedLibraries, setSelectedLibraries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadLibraries();
      // Reset form
      setName('');
      setPin('');
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  const loadLibraries = async () => {
    try {
      const libs = await adminService.getLibraries();
      setLibraries(libs);
      // Select all by default
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSelectedLibraries(libs.map((l: any) => l._id));
    } catch (err) {
      console.error('Failed to load libraries', err);
    }
  };

  const toggleLibrary = (id: string) => {
    setSelectedLibraries(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter a display name.');
      return;
    }
    if (pin && pin.length !== 4) {
      setError('PIN must be exactly 4 digits.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        pin: pin || undefined,
        managed: true,
        permissions: { libraries: selectedLibraries },
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-apple-blue/15 rounded-xl flex items-center justify-center text-apple-blue">
              <Shield size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-none">Add Profile</h2>
              <p className="text-xs text-gray-500 mt-0.5">Managed user on this server</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:text-white hover:bg-white/8 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
              >
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Display Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                required
                autoFocus
                className="w-full bg-white/4 border border-white/10 hover:border-white/20 focus:border-apple-blue/50 focus:ring-1 focus:ring-apple-blue/20 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none transition-all text-sm"
                placeholder="e.g. John, Kids, Guest"
                value={name}
                onChange={e => { setName(e.target.value); setError(''); }}
              />
            </div>
          </div>

          {/* PIN */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Profile PIN <span className="text-gray-600 normal-case font-normal">(optional — 4 digits)</span>
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                className="w-full bg-white/4 border border-white/10 hover:border-white/20 focus:border-apple-blue/50 focus:ring-1 focus:ring-apple-blue/20 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none transition-all text-sm tracking-[0.5em]"
                placeholder="••••"
                value={pin}
                onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setError(''); }}
              />
              {pin.length > 0 && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex gap-1">
                  {[0, 1, 2, 3].map(i => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all ${i < pin.length ? 'bg-apple-blue' : 'bg-white/15'}`}
                    />
                  ))}
                </div>
              )}
            </div>
            <p className="text-[11px] text-gray-600 mt-1.5 ml-1">
              Leave blank if you don't want a PIN lock on this profile.
            </p>
          </div>

          {/* Library Access */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Library Access
            </label>
            {libraries.length === 0 ? (
              <p className="text-xs text-gray-500 italic px-1">No libraries found. Create libraries first.</p>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1" style={{ scrollbarWidth: 'none' }}>
                {libraries.map(lib => {
                  const isSelected = selectedLibraries.includes(lib._id);
                  return (
                    <div
                      key={lib._id}
                      onClick={() => toggleLibrary(lib._id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${
                        isSelected
                          ? 'bg-apple-blue/8 border-apple-blue/30'
                          : 'bg-white/3 border-white/5 hover:bg-white/6 hover:border-white/10'
                      }`}
                    >
                      {/* Checkbox */}
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                        isSelected ? 'bg-apple-blue border-apple-blue' : 'border-gray-600'
                      }`}>
                        {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
                      </div>
                      {/* Icon + Name */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {libTypeIcon(lib.type)}
                        <span className={`text-sm font-medium truncate transition-colors ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                          {lib.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-600 capitalize shrink-0">{lib.type}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/8 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg ${
                success
                  ? 'bg-green-600 text-white shadow-green-500/20'
                  : 'bg-apple-blue hover:bg-blue-600 text-white shadow-apple-blue/20 disabled:opacity-50'
              }`}
            >
              {success ? (
                <><Check size={15} /> Created!</>
              ) : loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</>
              ) : (
                <><Shield size={15} /> Create Profile</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddUserModal;
