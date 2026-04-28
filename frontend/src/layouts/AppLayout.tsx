import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Compass, Search, Bookmark, Bell,
  Film, Tv, Music, Image,
  Shield, User, LogOut, Play, PanelLeftClose, History, Users, MessageSquare, type LucideIcon
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);

  return (
    <div className="h-screen bg-[#000] text-white font-sans selection:bg-apple-blue selection:text-white overflow-hidden relative flex">
      {/* Mobile Top Bar */}
      <div className="lg:hidden absolute top-0 left-0 right-0 h-16 bg-black/50 backdrop-blur-xl border-b border-white/10 flex items-center px-4 z-40 justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-400 hover:text-white"
          >
            <PanelLeftClose size={24} className="rotate-180" />
          </button>
          <span className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-[#F37021] to-[#F0B066] tracking-wide">Cineora</span>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/80 z-40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarOpen ? 256 : 96
        }}
        variants={{
          mobile: {
            width: 256,
            x: sidebarOpen ? 0 : -256
          },
          desktop: {
            width: sidebarOpen ? 256 : 96,
            x: 0
          }
        }}
        // Use a media query hook or just CSS classes to switch behavior? 
        // Framer motion makes mixing CSS/JS tricky. 
        // Let's use standard classes for display toggling if possible, but we need animation.
        // Better approach: Always render aside, but control position via variants based on screen size?
        // Actually, easiest is: Mobile = fixed drawer. Desktop = relative/absolute layout.
        className={cn(
          "fixed inset-y-0 left-0 bg-black/90 lg:bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col z-50 overflow-hidden transition-all duration-300",
          "lg:translate-x-0", // Always visible on desktop (width controlled by animate)
          !sidebarOpen && "translate-x-[-100%] lg:translate-x-0"
          // On mobile: if !open, hide. On desktop: always show (collapsed or expanded)
          // WAIT: The previous logic relied on `width` animation for collapse.
          // On mobile, we want slide-in.
        )}
        style={{
          width: sidebarOpen ? 256 : 96 // Default fallback
        }}
      >
        <div className={cn("flex items-center mb-8 p-6", sidebarOpen ? "justify-between" : "justify-center flex-col gap-6")}>
          <div className="flex items-center gap-3">
            <motion.div layout className="w-8 h-8 rounded-lg overflow-hidden shadow-lg shadow-[#F37021]/20 shrink-0 flex items-center justify-center bg-[#3D2314]">
              <img src="/favicon.png" alt="Cineora Logo" className="w-full h-full object-cover scale-[1.15]" />
            </motion.div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-bold text-xl tracking-wide whitespace-nowrap overflow-hidden text-transparent bg-clip-text bg-gradient-to-r from-[#F37021] to-[#F0B066]"
                >
                  Cineora
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          {/* Close button: On mobile checks if open to show 'X'. On desktop toggles collapse */}
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
            <NavItem to="/ai-chat" icon={MessageSquare} collapsed={!sidebarOpen}>AI Chat</NavItem>
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
            onClick={() => window.location.href = '/profiles?force=true'}
            className={cn(
              "w-full flex items-center gap-3 py-3 rounded-xl text-gray-400 hover:bg-white/10 hover:text-white transition-all duration-200 group overflow-hidden",
              !sidebarOpen ? "justify-center px-0" : "px-4"
            )}
            title={!sidebarOpen ? "Switch User" : undefined}
          >
            <Users size={20} className="shrink-0" />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-medium text-[15px] whitespace-nowrap"
                >
                  Switch User
                </motion.span>
              )}
            </AnimatePresence>
          </button>
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
        className={cn(
          "flex-1 h-full relative overflow-y-auto w-full pt-16 lg:pt-0 transition-all duration-300",
          sidebarOpen ? "lg:pl-64" : "lg:pl-24" // Desktop padding
        )}
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
