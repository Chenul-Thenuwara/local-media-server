import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, HardDrive, Activity, Shield,
  Settings, Film, Database, FileText,
  TrendingUp, AlertCircle, CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { adminService } from '../../services/adminService';

const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch admin stats. Check network tab.", error);
        // @ts-ignore
        setStats({ users: 0, libraries: 0, mediaItems: 0, storage: "Error", recentActivity: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();

    // Poll for real-time updates every 5 seconds
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="p-8 text-white">Loading dashboard...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-gray-400 mt-1">System overview and management</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-sm text-green-400">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {stats?.systemHealth || "System Optimal"}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Users"
          value={stats?.users || 0}
          trend="Active"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Storage Used"
          value={stats?.storage || "0 GB"}
          trend="Total"
          icon={HardDrive}
          color="purple"
        />
        <StatCard
          title="RAM Usage"
          value={`${stats?.ramUsage || 0} GB`}
          trend={`of ${stats?.ramTotal || 0} GB`}
          icon={Activity}
          color="orange"
        />
        <StatCard
          title="Media Items"
          value={stats?.mediaItems || 0}
          trend={`${stats?.movies || 0} Movies, ${stats?.tvShows || 0} TV`}
          icon={Film}
          color="pink"
        />
        <StatCard
          title="Libraries"
          value={stats?.libraries || 0}
          trend="Connected"
          icon={Database}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold text-white/90">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ActionCard
              to="/admin/users"
              title="User Management"
              description="Manage access, roles, and permissions"
              icon={Users}
              gradient="from-blue-500/20 to-cyan-500/20"
            />
            <ActionCard
              to="/admin/libraries"
              title="Media Libraries"
              description="Manage content, paths, and scans"
              icon={Film}
              gradient="from-purple-500/20 to-pink-500/20"
            />
            <ActionCard
              to="/admin/settings"
              title="Server Settings"
              description="Configure network, transcoding, and system"
              icon={Settings}
              gradient="from-emerald-500/20 to-green-500/20"
            />
            <ActionCard
              to="/admin/logs"
              title="System Logs"
              description="View error logs and activity history"
              icon={FileText}
              gradient="from-orange-500/20 to-red-500/20"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-white/90 mb-6">Active Libraries</h2>
          <div className="space-y-6">
            {stats?.recentActivity?.map((activity: any, i: number) => (
              <ActivityItem
                key={i}
                icon={activity.type === 'movies' ? Film : Database}
                color="text-green-400"
                title={activity.title}
                time={activity.time}
              />
            ))}
            {!stats?.recentActivity?.length && (
              <p className="text-gray-500 text-sm">No libraries found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, trend, icon: Icon, color }: any) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group"
  >
    <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${color}-500/10 rounded-full blur-2xl group-hover:bg-${color}-500/20 transition-all`} />
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className={`p-3 rounded-xl bg-${color}-500/20 text-${color}-400`}>
        <Icon size={20} />
      </div>
      <span className="flex items-center gap-1 text-xs font-medium text-green-400 bg-green-500/10 px-2 py-1 rounded-lg">
        {trend}
      </span>
    </div>
    <div className="relative z-10">
      <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  </motion.div>
);

const ActionCard = ({ to, title, description, icon: Icon, gradient }: any) => (
  <Link to={to}>
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden rounded-2xl border border-white/10 p-6 h-full transition-all duration-300 hover:border-white/20`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className="relative z-10 flex items-start gap-4">
        <div className="p-3 bg-white/10 rounded-xl text-white">
          <Icon size={24} />
        </div>
        <div>
          <h3 className="font-semibold text-white text-lg">{title}</h3>
          <p className="text-gray-400 text-sm mt-1">{description}</p>
        </div>
      </div>
    </motion.div>
  </Link>
);

const ActivityItem = ({ icon: Icon, color, title, time }: any) => (
  <div className="flex items-start gap-3">
    <div className={`mt-1 ${color}`}>
      <Icon size={16} />
    </div>
    <div>
      <p className="text-sm text-gray-200 font-medium">{title}</p>
      <p className="text-xs text-gray-500">{time}</p>
    </div>
  </div>
);

export default AdminDashboard;
