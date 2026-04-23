import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, Film, Tv, Music, Plus, RefreshCw, Trash2, HardDrive, Image, X } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface Library {
  _id: string;
  name: string;
  path: string;
  type: 'movie' | 'tv' | 'music' | 'photo';
  items?: number;
}

const AdminLibraries = () => {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshingIds, setRefreshingIds] = useState<string[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    path: '',
    type: 'auto'
  });

  useEffect(() => {
    fetchLibraries();
  }, []);

  const fetchLibraries = async () => {
    try {
      const data = await adminService.getLibraries();
      setLibraries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.createLibrary(formData);
      setIsModalOpen(false);
      setFormData({ name: '', path: '', type: 'auto' });
      fetchLibraries();
    } catch (err) {
      console.error(err);
      alert('Failed to create library');
    }
  };

  const handleRefresh = async (id: string) => {
    setRefreshingIds(prev => [...prev, id]);
    try {
      await adminService.refreshLibrary(id);
      // Simulate scan time or wait for socket update (simulated for now)
      setTimeout(() => {
        setRefreshingIds(prev => prev.filter(libId => libId !== id));
      }, 2000);
    } catch (err) {
      console.error(err);
      setRefreshingIds(prev => prev.filter(libId => libId !== id));
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'movie': return <Film size={32} className="text-purple-400" />;
      case 'tv': return <Tv size={32} className="text-blue-400" />;
      case 'music': return <Music size={32} className="text-green-400" />;
      case 'photo': return <Image size={32} className="text-yellow-400" />;
      default: return <Folder size={32} className="text-gray-400" />;
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Libraries</h1>
          <p className="text-gray-400">Manage your media folders and content sources.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-apple-blue hover:bg-blue-600">
          <Plus size={20} className="mr-2" /> Add Library
        </Button>
      </div>

      {loading ? (
        <div className="text-white">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {libraries.map((lib) => (
            <motion.div
              key={lib._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 group hover:border-white/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/5 rounded-xl group-hover:bg-white/10 transition-colors">
                  {getIcon(lib.type)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRefresh(lib._id)}
                    disabled={refreshingIds.includes(lib._id)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:animate-spin"
                    title="Scan Library"
                  >
                    <RefreshCw size={18} />
                  </button>
                  {/* Delete placeholder - would need confirm modal */}
                  <button className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-1">{lib.name}</h3>
              <div className="flex items-center gap-2 text-gray-400 text-sm font-mono truncate bg-black/30 p-2 rounded-lg">
                <HardDrive size={14} />
                <span className="truncate">{lib.path}</span>
              </div>

              <div className="mt-4 flex gap-2">
                <span className="px-2 py-1 rounded-md bg-white/5 text-xs text-gray-400 uppercase tracking-wider font-semibold">
                  {lib.type}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Library Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Add Library</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Name</label>
                  <Input
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. My Media"
                    className="bg-black/30 border-white/10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Load from Folder</label>
                  <div className="relative">
                    <HardDrive size={16} className="absolute left-3 top-3 text-gray-500" />
                    <Input
                      required
                      value={formData.path}
                      onChange={e => setFormData({ ...formData, path: e.target.value })}
                      placeholder="C:\Media"
                      className="pl-10 bg-black/30 border-white/10"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Absolute path to media directory on server. Content will be auto-detected.</p>
                </div>

                <div className="flex gap-3 mt-8">
                  <Button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-apple-blue hover:bg-blue-600">
                    Add Library
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminLibraries;
