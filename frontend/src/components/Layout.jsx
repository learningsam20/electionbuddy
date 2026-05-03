import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Map, MessageSquare, CheckSquare, Award, LogOut } from 'lucide-react';
import useStore from '../store';
import ThemeToggle from './ThemeToggle';

export default function Layout({ children }) {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home, show: user?.role === 'officer' || user?.role === 'admin' },
    { name: 'Timelines', path: '/timeline', icon: Map, show: true },
    { name: 'Quizzes', path: '/quiz', icon: CheckSquare, show: true },
    { name: 'AI Chat', path: '/chat', icon: MessageSquare, show: true },
    { name: 'Leaderboard', path: '/leaderboard', icon: Award, show: true },
  ].filter(item => item.show);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <h1 className="text-2xl font-black text-teal-600 dark:text-teal-400">ElectionBuddy</h1>
          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700">
            <p className="font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">ID: {user?.voter_id || 'NOT_FOUND'}</p>
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600 space-y-1">
              <p className="text-[10px] uppercase font-bold text-slate-400">Constituency</p>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{user?.assembly_constituency || 'N/A'}</p>
              <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">District/State</p>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{user?.district || 'N/A'}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path} className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors font-medium ${active ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'}`}>
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button onClick={handleLogout} className="flex items-center space-x-3 px-4 py-3 w-full text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors font-medium">
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <ThemeToggle />
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}