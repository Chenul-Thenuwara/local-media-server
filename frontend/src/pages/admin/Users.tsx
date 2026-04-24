import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Trash2, Shield, ShieldAlert, ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { adminService } from '../../services/adminService';
import AddUserModal from '../../components/admin/AddUserModal';

const ROLES = [
  { value: 'admin',  label: 'Admin',  color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  { value: 'viewer', label: 'Viewer', color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20'   },
  { value: 'guest',  label: 'Guest',  color: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-500/20'   },
];

const getRoleStyle = (role: string) =>
  ROLES.find(r => r.value === role) || ROLES[1];

const AdminUsers = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const fetchUsers = async () => {
    try {
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAddUser = async (data: any) => {
    await adminService.createUser(data);
    fetchUsers();
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminService.deleteUser(id);
        fetchUsers();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        alert(error.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleRoleChange = async (id: string, role: string) => {
    try {
      await adminService.updateUserRole(id, role);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, role } : u));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update role');
    }
  };

  const currentUserId = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}').id; } catch { return ''; }
  })();

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 relative">
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddUser}
      />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">User Management</h1>
        <p className="text-gray-400 mt-1">Manage user access and permissions</p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-xl">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-apple-blue/50 focus:ring-1 focus:ring-apple-blue/30 transition-all"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-apple-blue/50 transition-all"
        >
          <option value="all">All Roles</option>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Add User Card */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)}
          className="flex flex-col items-center justify-center gap-4 p-8 rounded-3xl border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-apple-blue/30 transition-all group h-[280px]"
        >
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-apple-blue/20 group-hover:text-apple-blue transition-colors">
            <Plus size={32} className="text-gray-400 group-hover:text-apple-blue" />
          </div>
          <span className="font-medium text-gray-400 group-hover:text-white">Add Profile</span>
        </motion.button>

        {loading ? (
          <div className="col-span-full text-center text-gray-400 py-12">Loading users...</div>
        ) : filtered.map((user) => (
          <UserCard
            key={user._id}
            user={user}
            isSelf={user._id === currentUserId}
            onDelete={() => handleDeleteUser(user._id)}
            onRoleChange={(role) => handleRoleChange(user._id, role)}
          />
        ))}
      </div>
    </div>
  );
};

// ── UserCard ──────────────────────────────────────────────────────────────────
const UserCard = ({
  user,
  isSelf,
  onDelete,
  onRoleChange,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
  isSelf: boolean;
  onDelete: () => void;
  onRoleChange: (role: string) => void;
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isManaged = !!user.managedBy;
  const roleStyle = getRoleStyle(isManaged ? 'guest' : user.role);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
      }
    };
    if (showRoleMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showRoleMenu]);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative p-6 rounded-3xl bg-white/5 border border-white/10 overflow-visible hover:border-white/20 transition-all h-[280px] flex flex-col items-center text-center"
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none" />

      {/* Delete button */}
      {!isSelf && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-500/20 rounded-full text-gray-400 hover:text-red-400 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )}

      {/* Avatar */}
      <div className="relative mb-4">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-3xl font-bold text-white shadow-xl border-4 border-white/5 group-hover:border-apple-blue/30 transition-all">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </div>
        {user.role === 'admin' && !isManaged && (
          <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black p-1.5 rounded-full shadow-lg border-2 border-[#111]">
            <ShieldAlert size={13} />
          </div>
        )}
        {isManaged && (
          <div className="absolute -bottom-1 -right-1 bg-purple-500 text-white p-1.5 rounded-full shadow-lg border-2 border-[#111]">
            <Shield size={13} />
          </div>
        )}
        {isSelf && (
          <div className="absolute -top-1 -left-1 bg-apple-blue text-white px-1.5 py-0.5 rounded-full text-[9px] font-bold shadow border border-blue-400/30">
            YOU
          </div>
        )}
      </div>

      {/* Info */}
      <div className="relative z-10 w-full flex-1 flex flex-col items-center">
        <h3 className="text-base font-bold text-white truncate w-full px-2">{user.name}</h3>
        <p className="text-xs text-gray-500 truncate w-full px-2 mb-3">
          {user.email || 'Managed Profile'}
        </p>

        {/* Role Badge — clickable unless managed or self */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => { if (!isManaged && !isSelf) setShowRoleMenu(v => !v); }}
            disabled={isManaged || isSelf}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
              roleStyle.color, roleStyle.bg, roleStyle.border,
              !isManaged && !isSelf && 'hover:brightness-125 cursor-pointer',
              (isManaged || isSelf) && 'cursor-default opacity-80'
            )}
          >
            {isManaged ? 'Managed' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            {!isManaged && !isSelf && <ChevronDown size={11} className={cn('transition-transform', showRoleMenu && 'rotate-180')} />}
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {showRoleMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-36 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
              >
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-3 pt-2.5 pb-1">
                  Change Role
                </p>
                {ROLES.map(r => (
                  <button
                    key={r.value}
                    onClick={() => { onRoleChange(r.value); setShowRoleMenu(false); }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors hover:bg-white/8',
                      r.color
                    )}
                  >
                    {r.label}
                    {user.role === r.value && <Check size={13} />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminUsers;
