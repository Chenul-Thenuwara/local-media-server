import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, MoreVertical, Shield, ShieldAlert, Mail } from 'lucide-react';
import { cn } from '../../lib/utils';
import { adminService } from '../../services/adminService';
import AddUserModal from '../../components/admin/AddUserModal';

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (data: any) => {
    try {
      await adminService.createUser(data);
      fetchUsers(); // Refresh list
    } catch (error) {
      console.error("Failed to create user", error);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 relative">
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddUser}
      />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 mt-1">Manage user access and permissions</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-xl">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search users..."
            className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-apple-blue/50 focus:ring-1 focus:ring-apple-blue/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <select className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-gray-300 focus:outline-none">
            <option>All Roles</option>
            <option>Admin</option>
            <option>User</option>
          </select>
          <select className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-gray-300 focus:outline-none">
            <option>Any Status</option>
            <option>Active</option>
            <option>Offline</option>
          </select>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Add User Card */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)}
          className="flex flex-col items-center justify-center gap-4 p-8 rounded-3xl border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all group h-[280px]"
        >
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-apple-blue/20 group-hover:text-apple-blue transition-colors">
            <Plus size={32} className="text-gray-400 group-hover:text-apple-blue" />
          </div>
          <span className="font-medium text-gray-400 group-hover:text-white">Add User</span>
        </motion.button>

        {loading ? (
          <div className="col-span-full text-center text-gray-400 py-12">Loading users...</div>
        ) : users.map((user) => (
          <UserCard key={user._id} user={user} />
        ))}
      </div>
    </div>
  );
};

const UserCard = ({ user }: { user: any }) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="group relative p-6 rounded-3xl bg-white/5 border border-white/10 overflow-hidden hover:border-white/20 transition-all h-[280px] flex flex-col items-center text-center"
  >
    {/* Background Glow */}
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />

    {/* Actions Menu (Absolute Top Right) */}
    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
      <button className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white">
        <MoreVertical size={16} />
      </button>
    </div>

    {/* Avatar */}
    <div className="relative mb-6">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-3xl font-bold text-white shadow-xl border-4 border-white/5 group-hover:border-apple-blue/30 transition-all">
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
        ) : (
          user.name.charAt(0).toUpperCase()
        )}
      </div>
      {user.role === 'admin' && (
        <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black p-1.5 rounded-full shadow-lg border-2 border-[#0D0D0D]" title="Admin">
          <ShieldAlert size={14} />
        </div>
      )}
      {user.managedBy && (
        <div className="absolute -bottom-1 -right-1 bg-purple-500 text-white p-1.5 rounded-full shadow-lg border-2 border-[#0D0D0D]" title="Managed User">
          <Shield size={14} />
        </div>
      )}
    </div>

    {/* User Info */}
    <div className="relative z-10 w-full space-y-1">
      <h3 className="text-lg font-bold text-white truncate px-4">{user.name}</h3>
      <p className="text-sm text-gray-500 truncate px-4">{user.email || 'Managed Profile'}</p>

      {/* Role Badge */}
      <div className="pt-4">
        <span className={cn(
          "px-3 py-1 rounded-full text-xs font-medium border",
          user.managedBy
            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
            : user.role === 'admin'
              ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
        )}>
          {user.managedBy ? 'Managed' : user.role === 'admin' ? 'Admin' : 'User'}
        </span>
      </div>
    </div>
  </motion.div>
);

export default AdminUsers;
