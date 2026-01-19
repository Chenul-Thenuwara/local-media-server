import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Compass, Search, Bookmark, Bell,
  Film, Tv, Music, Image, Video,
  Shield, User, LogOut, Play, PanelLeftClose, History, type LucideIcon
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-screen bg-[#000] text-white font-sans selection:bg-apple-blue selection:text-white overflow-hidden relative flex">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 256 : 96 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute left-0 top-0 bottom-0 bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col z-50 overflow-hidden"
      >
        <div className={cn("flex items-center mb-8 p-6", sidebarOpen ? "justify-between" : "justify-center flex-col gap-6")}>
          <div className="flex items-center gap-3">
            <motion.div
              layout
              className="w-8 h-8 bg-apple-blue rounded-lg text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0"
            >
              <Play size={16} fill="currentColor" />
            </motion.div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-semibold text-xl tracking-tight whitespace-nowrap overflow-hidden"
                >
                  LMS
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <motion.button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.div
              initial={false}
              animate={{ rotate: sidebarOpen ? 0 : 180 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <PanelLeftClose size={20} />
            </motion.div>
          </motion.button>
        </div>

        <nav className="flex-1 space-y-6 px-4 overflow-y-auto scrollbar-hide">
          <div className="space-y-1">
            <AnimatePresence>
              {sidebarOpen && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 whitespace-nowrap"
                >
                  Menu
                </motion.p>
              )}
            </AnimatePresence>
            <NavItem to="/home" icon={Home} collapsed={!sidebarOpen}>Home</NavItem>
            <NavItem to="/discover" icon={Compass} collapsed={!sidebarOpen}>Discover</NavItem>
            <NavItem to="/search" icon={Search} collapsed={!sidebarOpen}>Search</NavItem>
            <NavItem to="/watchlist" icon={Bookmark} collapsed={!sidebarOpen}>Watchlist</NavItem>
            <NavItem to="/history" icon={History} collapsed={!sidebarOpen}>History</NavItem>
          </div>

          <div className="space-y-1">
            <AnimatePresence>
              {sidebarOpen && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 whitespace-nowrap"
                >
                  Libraries
                </motion.p>
              )}
            </AnimatePresence>
            <NavItem to="/libraries/movies" icon={Film} collapsed={!sidebarOpen}>Movies</NavItem>
            <NavItem to="/libraries/tv" icon={Tv} collapsed={!sidebarOpen}>TV Shows</NavItem>
            <NavItem to="/libraries/music" icon={Music} collapsed={!sidebarOpen}>Music</NavItem>
            <NavItem to="/libraries/photos" icon={Image} collapsed={!sidebarOpen}>Photos</NavItem>
            <NavItem to="/libraries/personal" icon={Video} collapsed={!sidebarOpen}>Personal</NavItem>
          </div>

          <div className="space-y-1">
            <AnimatePresence>
              {sidebarOpen && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 whitespace-nowrap"
                >
                  System
                </motion.p>
              )}
            </AnimatePresence>
            <NavItem to="/admin" icon={Shield} collapsed={!sidebarOpen}>Admin Panel</NavItem>
            <NavItem to="/notifications" icon={Bell} collapsed={!sidebarOpen}>Notifications</NavItem>
          </div>
        </nav>

        <div className="p-4 mt-2 border-t border-white/10 space-y-2">
          <NavItem to="/profile/account" icon={User} collapsed={!sidebarOpen}>My Profile</NavItem>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            className={cn(
              "w-full flex items-center gap-3 py-3 rounded-xl text-gray-400 hover:bg-white/10 hover:text-white transition-all duration-200 group overflow-hidden",
              !sidebarOpen ? "justify-center px-0" : "px-4"
            )}
            title={!sidebarOpen ? "Sign Out" : undefined}
          >
            <LogOut size={20} className="shrink-0" />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-medium text-[15px] whitespace-nowrap"
                >
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.main
        initial={false}
        animate={{ paddingLeft: sidebarOpen ? 256 : 96 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex-1 h-full relative overflow-y-auto w-full"
      >
        <Outlet />
      </motion.main>
    </div>
  );
}


function NavItem({ to, icon: Icon, children, collapsed }: { to: string; icon: LucideIcon; children: React.ReactNode, collapsed: boolean }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn(
        "flex items-center gap-3 py-3 rounded-xl transition-all duration-200 group overflow-hidden relative focus:outline-none",
        collapsed ? "justify-center px-0" : "px-4",
        isActive
          ? "bg-apple-blue text-white shadow-lg shadow-blue-500/20 font-medium"
          : "text-gray-400 hover:bg-white/10 hover:text-white"
      )}
      title={collapsed ? String(children) : undefined}
    >
      {({ isActive }) => (
        <>
          <div className="relative z-10 flex items-center justify-center shrink-0">
            {isActive ? (
              <motion.div
                layoutId="activeTabIcon"
                initial={{ scale: 1 }}
                animate={{ scale: 1.2 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Icon size={20} />
              </motion.div>
            ) : (
              <Icon size={20} />
            )}
          </div>

          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="text-[15px] whitespace-nowrap z-10"
              >
                {children}
              </motion.span>
            )}
          </AnimatePresence>
        </>
      )}
    </NavLink>
  );
}
