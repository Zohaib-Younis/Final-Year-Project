import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, LayoutDashboard, Settings, Vote as VoteIcon, ShieldCheck, Sun, Moon } from 'lucide-react';

import WinnerNotification from './WinnerNotification';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  
  const isHomePage = location.pathname === '/';

  return (
    <nav className="bg-card border-b border-border-color shadow-sm sticky top-0 z-50 backdrop-blur-md bg-card/80">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-superior rounded-full flex items-center justify-center text-white overflow-hidden shadow-sm group-hover:scale-110 transition-transform">
                {settings?.appLogo ? (
                  <img src={settings.appLogo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <ShieldCheck size={24} />
                )}
              </div>
              <span className="text-xl font-bold text-superior tracking-tight uppercase">
                {settings?.appName || 'SuperiorVote'}
              </span>
            </Link>

            {/* Desktop Center Navigation - Only visible on Landing Page */}
            {isHomePage && (
              <div className="hidden lg:flex items-center gap-6">
                <Link to="/" className="text-sm font-bold text-text-muted hover:text-superior transition-colors">
                  Home
                </Link>
                <Link to="/privacy" className="text-sm font-bold text-text-muted hover:text-superior transition-colors">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="text-sm font-bold text-text-muted hover:text-superior transition-colors">
                  Terms & Conditions
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {(user && !isHomePage) ? (
              <div className="flex items-center gap-4">
                <Link to="/dashboard" className="flex items-center gap-1 text-text-muted hover:text-superior transition-colors font-bold text-sm">
                  <LayoutDashboard size={18} />
                  <span className="hidden md:inline">Dashboard</span>
                </Link>

                <Link to="/settings" className="flex items-center gap-1 text-text-muted hover:text-superior transition-colors font-bold text-sm">
                  <Settings size={18} />
                  <span className="hidden md:inline">Settings</span>
                </Link>

                {user?.role === 'admin' && (
                  <Link to="/admin" className="flex items-center gap-1 text-text-muted hover:text-superior transition-colors font-bold text-sm">
                    <ShieldCheck size={18} />
                    <span className="hidden md:inline">Admin Panel</span>
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4 mr-2">
                <Link to="/login" className="text-sm font-bold text-text-muted hover:text-superior transition-colors hidden sm:inline">
                  Login
                </Link>
                <Link to="/register" className="text-sm font-bold bg-superior text-white px-5 py-2.5 rounded-xl hover:bg-superior-dark transition-all shadow-md shadow-superior/10">
                  {user ? 'Enter Dashboard' : 'Get Started'}
                </Link>
              </div>
            )}

            <div className="h-6 w-px bg-border-color mx-1 hidden sm:block"></div>

            {user && <WinnerNotification />}

            <button
              onClick={toggleTheme}
              className="p-2 text-text-muted hover:text-superior hover:bg-bg-hover rounded-full transition-all"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {user && (
              <div className="flex items-center gap-3 ml-2 border-l border-border-color pl-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-text-main">{user?.username}</p>
                  <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">{user?.role}</p>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-all"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            )}
            
            {!user && (
              <div className="sm:hidden">
                 <Link to="/login" className="p-2 text-text-muted hover:text-superior block">
                    <LogOut className="rotate-180" size={20} />
                 </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
