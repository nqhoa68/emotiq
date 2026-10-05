import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, LayoutDashboard, Settings } from 'lucide-react';
import SettingsModal from '../components/SettingsModal';
import ftuLogo from '../assets/FTU-logo.png';
import ThemeToggle from '../components/ThemeToggle';

export default function GlobalLayout() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-[#0B1120] border-r border-slate-200 dark:border-none flex flex-col hidden md:flex">
        {/* Logo/Brand */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-full shadow-lg overflow-hidden bg-slate-900 dark:bg-white/5">
              <img src={ftuLogo} alt="FTU Logo" className="w-full h-full object-cover scale-110" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-linear-to-r from-indigo-500 to-purple-500 dark:from-indigo-200 dark:to-purple-200 bg-clip-text text-transparent tracking-wide">Emotiq</h1>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavLink
            to="/chat"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
              }`
            }
          >
            <MessageSquare size={20} />
            Chat Đơn Lẻ
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
              }`
            }
          >
            <LayoutDashboard size={20} />
            Analytics Dashboard
          </NavLink>
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-slate-200 dark:border-white/5">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-white/5 transition-all w-full cursor-pointer"
          >
            <Settings size={20} />
            Cấu hình
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-linear-to-br dark:from-slate-950 dark:to-slate-900 relative overflow-hidden">
        {/* Mobile Header (hiển thị trên màn hình nhỏ) */}
        <div className="md:hidden h-16 border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-900 dark:bg-white/5">
              <img src={ftuLogo} alt="FTU Logo" className="w-full h-full object-cover scale-110" />
            </div>
            <h1 className="font-bold text-slate-800 dark:text-slate-200">Emotiq</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NavLink to="/chat" className={({ isActive }) => `p-2 rounded-lg ${isActive ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
              <MessageSquare size={20} />
            </NavLink>
            <NavLink to="/dashboard" className={({ isActive }) => `p-2 rounded-lg ${isActive ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
              <LayoutDashboard size={20} />
            </NavLink>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Modals */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
