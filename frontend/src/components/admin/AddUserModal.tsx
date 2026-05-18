import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Lock, Shield, Check, AlertCircle, Users } from 'lucide-react';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => Promise<void>;
}

const AddUserModal = ({ isOpen, onClose, onSubmit }: AddUserModalProps) => {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState('viewer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setPin('');
      setRole('viewer');
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

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
        role,
        managed: true,
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 900);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create profile.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
          className="bg-[#0d0d0d] border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-apple-blue/15 flex items-center justify-center">
                <Shield size={18} className="text-apple-blue" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white leading-tight">Add Profile</h2>
                <p className="text-xs text-gray-500 leading-none mt-0.5">Managed user on this server</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:text-white hover:bg-white/8 transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2.5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm"
                >
                  <AlertCircle size={14} className="shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Name Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 tracking-wide">
                Display Name <span className="text-apple-blue">*</span>
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. John, Kids, Guest"
                  value={name}
                  onChange={e => { setName(e.target.value); setError(''); }}
                  className="w-full bg-gray-800/60 border border-white/10 hover:border-white/20 focus:border-apple-blue/60 focus:ring-1 focus:ring-apple-blue/20 rounded-2xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* PIN Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 tracking-wide">
                Profile PIN <span className="text-gray-600 font-normal">(optional · 4 digits)</span>
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="Leave blank for no lock"
                  value={pin}
                  onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setError(''); }}
                  className="w-full bg-gray-800/60 border border-white/10 hover:border-white/20 focus:border-apple-blue/60 focus:ring-1 focus:ring-apple-blue/20 rounded-2xl py-3 pl-10 pr-14 text-sm text-white placeholder-gray-600 focus:outline-none transition-all"
                />
                {/* PIN dot indicator */}
                {pin.length > 0 && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex gap-1 pointer-events-none">
                    {[0, 1, 2, 3].map(i => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-150 ${
                          i < pin.length ? 'bg-apple-blue scale-110' : 'bg-white/15'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              <p className="text-[11px] text-gray-600 ml-1">
                If set, this PIN will be required when switching to this profile.
              </p>
            </div>

            {/* Role Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 tracking-wide">
                Role <span className="text-apple-blue">*</span>
              </label>
              <div className="relative">
                <Users size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full bg-gray-800/60 border border-white/10 hover:border-white/20 focus:border-apple-blue/60 focus:ring-1 focus:ring-apple-blue/20 rounded-2xl py-3 pl-10 pr-4 text-sm text-white appearance-none focus:outline-none transition-all"
                >
                  <option value="viewer">Viewer (Default)</option>
                  <option value="guest">Guest</option>
                </select>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/6 pt-2" />

            {/* Footer */}
            <div className="flex items-center justify-end gap-2">
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
                className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-semibold transition-all shadow-lg ${
                  success
                    ? 'bg-green-600 text-white shadow-green-500/20'
                    : 'bg-apple-blue hover:bg-blue-600 active:scale-95 text-white shadow-apple-blue/25 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {success ? (
                  <><Check size={14} strokeWidth={3} /> Created!</>
                ) : loading ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating…</>
                ) : (
                  <><Shield size={14} /> Create Profile</>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddUserModal;
