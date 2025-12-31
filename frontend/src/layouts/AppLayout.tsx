import { NavLink, Outlet } from 'react-router-dom';
import { Home, Library, Settings, LogOut, Play } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AppLayout() {
  return (
    <div className="h-screen bg-[#000] text-white font-sans selection:bg-apple-blue selection:text-white overflow-hidden relative">
      {/* Sidebar - Overlay style */}
      <aside className="absolute left-0 top-0 bottom-0 w-64 bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col p-6 z-50">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-8 h-8 bg-apple-blue rounded-lg text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Play size={16} fill="currentColor" />
          </div>
          <span className="font-semibold text-xl tracking-tight">LMS</span>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem to="/home" icon={Home}>Home</NavItem>
          <NavItem to="/library" icon={Library}>Library</NavItem>
        </nav>

        <div className="pt-6 border-t border-white/10 space-y-2">
          <NavItem to="/settings" icon={Settings}>Settings</NavItem>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium text-[15px]">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="w-full h-full relative overflow-y-auto pl-64">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, icon: Icon, children }: { to: string; icon: any; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
        isActive
          ? "bg-apple-blue text-white shadow-lg shadow-blue-500/20 font-medium"
          : "text-gray-400 hover:bg-white/10 hover:text-white"
      )}
    >
      <Icon size={20} />
      <span className="text-[15px]">{children}</span>
    </NavLink>
  );
}
