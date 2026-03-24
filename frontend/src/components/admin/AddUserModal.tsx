import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Shield, User, Lock, Film, Tv, Music } from 'lucide-react';
import { adminService } from '../../services/adminService';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => Promise<void>;
}

const AddUserModal = ({ isOpen, onClose, onSubmit }: AddUserModalProps) => {
  const [activeTab, setActiveTab] = useState<'invite' | 'managed'>('invite');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    pin: '',
    managed: false
  });
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [libraries, setLibraries] = useState<any[]>([]);
  const [selectedLibraries, setSelectedLibraries] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadLibraries();
    }
  }, [isOpen]);

  const loadLibraries = async () => {
    try {
      const libs = await adminService.getLibraries();
      setLibraries(libs);
      // Default select all? Or none. Let's select all by default for convenience
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSelectedLibraries(libs.map((l: any) => l._id));
    } catch (err) {
      console.error('Failed to load libraries', err);
    }
  };

  if (!isOpen) return null;

  const toggleLibrary = (id: string) => {
    if (selectedLibraries.includes(id)) {
      setSelectedLibraries(prev => prev.filter(libId => libId !== id));
    } else {
      setSelectedLibraries(prev => [...prev, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        managed: activeTab === 'managed',
        permissions: {
          libraries: selectedLibraries
        }
      });
      onClose();
      setFormData({ name: '', email: '', password: '', pin: '', managed: false });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#1a1a1a] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#1a1a1a] sticky top-0 z-10">
          <h2 className="text-xl font-bold text-white">Add User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="p-2 grid grid-cols-2 gap-2 bg-black/20 m-6 mb-0 rounded-xl">
          <button
            onClick={() => setActiveTab('invite')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'invite' ? 'bg-apple-blue text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
          >
            <Mail size={16} />
            Invite Email
          </button>
          <button
            onClick={() => setActiveTab('managed')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'managed' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
          >
            <Shield size={16} />
            Managed User
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-white/30 transition-colors"
                placeholder="Display Name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          {activeTab === 'invite' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-white/30 transition-colors"
                    placeholder="user@example.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Initial Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="password"
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-white/30 transition-colors"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Profile PIN (Optional)</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    maxLength={4}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-white/30 transition-colors"
                    placeholder="4-digit PIN"
                    value={formData.pin}
                    onChange={e => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                  />
                </div>
              </div>

              {/* Library Access Section */}
              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-400 mb-2">Library Access</label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {libraries.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No libraries found. Create libraries first.</p>
                  ) : (
                    libraries.map(lib => (
                      <div
                        key={lib._id}
                        onClick={() => toggleLibrary(lib._id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedLibraries.includes(lib._id)
                          ? 'bg-apple-blue/10 border-apple-blue/50'
                          : 'bg-black/20 border-white/5 hover:bg-white/5'
                          }`}
                      >
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selectedLibraries.includes(lib._id) ? 'bg-apple-blue border-apple-blue' : 'border-gray-600'
                          }`}>
                          {selectedLibraries.includes(lib._id) && <span className="text-white text-xs font-bold">✓</span>}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {lib.type === 'movie' && <Film size={14} className="text-purple-400" />}
                            {lib.type === 'tv' && <Tv size={14} className="text-blue-400" />}
                            {lib.type === 'music' && <Music size={14} className="text-green-400" />}
                            <span className={`text-sm font-medium ${selectedLibraries.includes(lib._id) ? 'text-white' : 'text-gray-400'}`}>
                              {lib.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-[#1a1a1a] pb-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 rounded-xl text-white font-medium transition-all shadow-lg ${activeTab === 'invite' ? 'bg-apple-blue hover:bg-blue-600' : 'bg-purple-600 hover:bg-purple-700'
                }`}
            >
              {loading ? 'Creating...' : activeTab === 'invite' ? 'Send Invite' : 'Create Profile'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddUserModal;
