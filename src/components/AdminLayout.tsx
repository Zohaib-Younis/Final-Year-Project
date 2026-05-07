import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

import { 
  LayoutDashboard, 
  Vote, 
  Users, 
  BarChart3, 
  Bell, 
  History, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  ShieldCheck,
  Search,
  User,
  Moon,
  Sun,
  ClipboardList,
  UserCheck,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const [pendingAccountCount, setPendingAccountCount] = useState(0);
  const [pendingCandidateCount, setPendingCandidateCount] = useState(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const res = await axios.get('/api/admin/stats');
        setPendingAccountCount(res.data.pendingAccountRequests || 0);
        setPendingCandidateCount(res.data.pendingCandidateRequests || 0);
      } catch (err) {
        console.error('Failed to fetch pending count', err);
      }
    };
    fetchPendingCount();
    
    // Refresh every minute
    const interval = setInterval(fetchPendingCount, 60000);
    return () => clearInterval(interval);
  }, []);


  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Overview', path: '/admin' },
    { icon: <Vote size={20} />, label: 'Elections', path: '/admin/elections' },
    { icon: <Users size={20} />, label: 'Students', path: '/admin/users' },
    { icon: <UserCheck size={20} />, label: 'Account Requests', path: '/admin/requests', badge: pendingAccountCount },
    { icon: <Award size={20} />, label: 'Candidate Requests', path: '/admin/candidate-requests', badge: pendingCandidateCount },
    { icon: <BarChart3 size={20} />, label: 'Live Monitoring', path: '/admin/monitoring' },
    { icon: <Bell size={20} />, label: 'Notifications', path: '/admin/notifications' },
    { icon: <History size={20} />, label: 'Audit Logs', path: '/admin/logs' },
    { icon: <Settings size={20} />, label: 'Settings', path: '/admin/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <header className="lg:hidden h-16 bg-card border-b border-border-color sticky top-0 z-[60] px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-superior rounded-lg flex items-center justify-center text-white overflow-hidden">
            {settings?.appLogo ? <img src={settings.appLogo} className="w-full h-full object-cover" /> : <ShieldCheck size={20} />}
          </div>
          <span className="font-black text-lg text-text-main">{settings?.appName || 'SuperiorVote'}</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-text-main">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar - Desktop & Mobile Drawer */}
      <AnimatePresence mode="wait">
        {(isSidebarOpen || isMobileMenuOpen) && (
          <motion.aside 
            initial={window.innerWidth < 1024 ? { x: -300 } : false}
            animate={{ 
              width: isSidebarOpen ? 280 : 80,
              x: isMobileMenuOpen && window.innerWidth < 1024 ? 0 : (window.innerWidth < 1024 && !isMobileMenuOpen ? -300 : 0)
            }}
            exit={window.innerWidth < 1024 ? { x: -300 } : undefined}
            className={`fixed left-0 top-0 h-full bg-card border-r border-border-color z-50 flex flex-col transition-all duration-300 ${isMobileMenuOpen ? 'w-[280px] shadow-2xl' : ''}`}
          >
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-superior rounded-xl flex items-center justify-center text-white shadow-lg shadow-superior/20 overflow-hidden">
            {settings?.appLogo ? (
              <img src={settings.appLogo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <ShieldCheck size={24} />
            )}
          </div>
          {isSidebarOpen && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-black text-xl tracking-tight text-text-main"
            >
              {settings?.appName || 'SuperiorVote'}
            </motion.span>
          )}
          {isMobileMenuOpen && (
             <span className="lg:hidden font-black text-xl tracking-tight text-text-main">
              {settings?.appName || 'SuperiorVote'}
             </span>
          )}
        </div>

        <nav className="flex-grow px-4 mt-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && setIsMobileMenuOpen(false)}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative ${
                  isActive 
                    ? 'bg-superior/5 text-superior font-bold' 
                    : 'text-text-muted hover:bg-bg-hover hover:text-text-main'
                }`}
              >
                <div className={`${isActive ? 'text-superior' : 'group-hover:text-superior'} transition-colors`}>
                  {item.icon}
                </div>
                {(isSidebarOpen || isMobileMenuOpen) && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
                {item.badge > 0 && (isSidebarOpen || isMobileMenuOpen) && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute right-2 w-1.5 h-1.5 rounded-full bg-superior"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-border-color/50">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 w-full rounded-xl text-red-500 hover:bg-red-50 transition-all font-medium"
          >
            <LogOut size={20} />
            {(isSidebarOpen || isMobileMenuOpen) && <span>Logout</span>}
          </button>
        </div>
        
        {/* Toggle - Hidden on mobile */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-100 rounded-full items-center justify-center text-text-muted hover:text-superior transition-colors shadow-sm"
        >
          {isSidebarOpen ? <X size={14} /> : <Menu size={14} />}
        </button>
      </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`flex-grow transition-all duration-300 min-w-0 ${isSidebarOpen ? 'lg:pl-[280px]' : 'lg:pl-[80px]'}`}>
        <header className="hidden lg:flex h-20 bg-background/80 backdrop-blur-md border-b border-border-color sticky top-0 z-40 px-8 items-center justify-between">
          <div className="flex items-center gap-4 bg-bg-hover px-4 py-2 rounded-xl border border-border-color w-96 max-w-full">
            <Search size={18} className="text-text-muted" />
            <input 
              type="text" 
              placeholder="Search data, students, elections..." 
              className="bg-transparent border-none outline-none text-sm w-full text-text-main placeholder:text-text-muted"
            />
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={toggleTheme}
              className="p-2 text-text-muted hover:text-superior hover:bg-bg-hover rounded-xl transition-all"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button className="relative p-2 text-text-muted hover:text-superior hover:bg-bg-hover rounded-xl transition-all">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="h-8 w-px bg-gray-100"></div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-text-main leading-none">{user?.username}</p>
                <p className="text-[10px] text-superior font-bold uppercase tracking-widest mt-1">
                  {user?.role === 'admin' ? 'Super Admin' : 'Officer'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-superior/10 flex items-center justify-center text-superior border border-superior/20 overflow-hidden shrink-0">
                <User size={24} />
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
