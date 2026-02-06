import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, MoreVertical, Shield, ShieldAlert, Mail } from 'lucide-react';
import { cn } from '../../lib/utils';
import { adminService } from '../../services/adminService';

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchUsers();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 mt-1">Manage user access and permissions</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2 bg-apple-blue hover:bg-blue-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20"
        >
          <Plus size={18} />
          Add User
        </motion.button>
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

      {/* Users Table */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-xl">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-left">
              <th className="px-6 py-4 text-sm font-semibold text-gray-400">User</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-400">Role</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-400">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-400">Created At</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">Loading users...</td></tr>
            ) : users.map((user) => (
              <tr key={user._id} className="group hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/10">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <span className="font-semibold text-sm">{user.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">{user.name}</p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Mail size={12} />
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 w-fit border border-white/5">
                    {user.role === 'admin' ? <ShieldAlert size={14} className="text-yellow-400" /> : <Shield size={14} className="text-blue-400" />}
                    <span className="text-sm text-gray-300 capitalize">{user.role}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium border",
                    "bg-green-500/10 text-green-400 border-green-500/20"
                  )}>
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
