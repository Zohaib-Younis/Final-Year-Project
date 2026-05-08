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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const [pendingAccountCount, setPendingAccountCount] = useState(0);
  const [pendingCandidateCount, setPendingCandidateCount] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <div className="min-h-screen bg-background flex flex-col lg:flex-row overflow-hidden">
      {/* Mobile Header */}
      <header className="lg:hidden h-16 bg-card border-b border-border-color sticky top-0 z-[60] px-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-superior rounded-lg flex items-center justify-center text-white overflow-hidden shadow-sm">
            {settings?.appLogo ? <img src={settings.appLogo} className="w-full h-full object-cover" /> : <ShieldCheck size={18} />}
          </div>
          <span className="font-bold text-base text-text-main tracking-tight">{settings?.appName || 'SuperiorVote'}</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="p-2 text-text-main hover:bg-bg-hover rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar */}
      <AnimatePresence>
        {(isSidebarOpen || isMobileMenuOpen || window.innerWidth >= 1024) && (
          <motion.aside 
            initial={window.innerWidth < 1024 ? { x: -300 } : false}
            animate={{ 
              width: isSidebarOpen ? 280 : 80,
              x: isMobileMenuOpen && window.innerWidth < 1024 ? 0 : (window.innerWidth < 1024 && !isMobileMenuOpen ? -300 : 0),
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed lg:sticky left-0 top-0 h-screen bg-card border-r border-border-color z-50 flex flex-col ${isMobileMenuOpen ? 'w-[280px] shadow-2xl' : ''}`}
          >
            {/* Logo Area */}
            <div className="h-20 flex items-center px-6 gap-3 shrink-0">
              <div className="w-10 h-10 bg-superior rounded-xl flex items-center justify-center text-white shadow-lg shadow-superior/20 overflow-hidden shrink-0">
                {settings?.appLogo ? (
                  <img src={settings.appLogo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <ShieldCheck size={24} />
                )}
              </div>
              <AnimatePresence>
                {(isSidebarOpen || isMobileMenuOpen) && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="font-black text-xl tracking-tight text-text-main whitespace-nowrap overflow-hidden"
                  >
                    {settings?.appName || 'SuperiorVote'}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <nav className="flex-grow px-3 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
                return (
                  <div key={item.path} className="relative group">
                    <Link
                      to={item.path}
                      onMouseEnter={() => setHoveredItem(item.path)}
                      onMouseLeave={() => setHoveredItem(null)}
                      onClick={() => window.innerWidth < 1024 && setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden ${
                        isActive 
                          ? 'bg-superior text-white shadow-md shadow-superior/20' 
                          : 'text-text-muted hover:bg-bg-hover hover:text-text-main'
                      }`}
                    >
                      {/* Hover background effect */}
                      {!isActive && (
                        <div className="absolute inset-0 bg-superior/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
                      )}

                      <div className={`shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:text-superior'}`}>
                        {item.icon}
                      </div>

                      <AnimatePresence>
                        {(isSidebarOpen || isMobileMenuOpen) && (
                          <motion.span 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="whitespace-nowrap font-medium"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {item.badge > 0 && (
                        <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-black transition-all duration-300 ${
                          isActive ? 'bg-white text-superior' : 'bg-red-500 text-white'
                        }`}>
                          {item.badge}
                        </span>
                      )}

                      {/* Tooltip for collapsed state */}
                      {!isSidebarOpen && !isMobileMenuOpen && hoveredItem === item.path && (
                        <div className="fixed left-20 px-3 py-2 bg-text-main text-white text-xs rounded-lg shadow-xl z-[100] whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-200">
                          {item.label}
                          <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 border-8 border-transparent border-right-text-main" />
                        </div>
                      )}
                    </Link>
                  </div>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="p-3 shrink-0 border-t border-border-color/50">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-4 px-4 py-3 w-full rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all font-medium group"
              >
                <div className="group-hover:scale-110 transition-transform">
                  <LogOut size={20} />
                </div>
                {(isSidebarOpen || isMobileMenuOpen) && <span>Logout</span>}
              </button>
            </div>
            
            {/* Collapse Toggle */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden lg:flex absolute -right-3 top-10 w-6 h-6 bg-card border border-border-color rounded-full items-center justify-center text-text-muted hover:text-superior transition-all shadow-sm z-[60]"
            >
              {isSidebarOpen ? <ChevronRight size={14} className="rotate-180" /> : <ChevronRight size={14} />}
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-grow flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-background/80 backdrop-blur-md border-b border-border-color shrink-0 z-40 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4 bg-bg-hover px-4 py-2.5 rounded-2xl border border-border-color w-full max-w-md shadow-sm">
            <Search size={18} className="text-text-muted" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-transparent border-none outline-none text-sm w-full text-text-main placeholder:text-text-muted"
            />
          </div>
          
          <div className="flex items-center gap-2 sm:gap-6 ml-4">
            <div className="flex items-center gap-1 sm:gap-2">
              <button 
                onClick={toggleTheme}
                className="p-2.5 text-text-muted hover:text-superior hover:bg-bg-hover rounded-xl transition-all relative group"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-text-main text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Toggle Theme
                </span>
              </button>

              <button className="relative p-2.5 text-text-muted hover:text-superior hover:bg-bg-hover rounded-xl transition-all group">
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
                <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-text-main text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Notifications
                </span>
              </button>
            </div>
            
            <div className="h-8 w-px bg-border-color/50 hidden sm:block"></div>

            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-text-main leading-none group-hover:text-superior transition-colors">{user?.username}</p>
                <p className="text-[10px] text-superior font-bold uppercase tracking-widest mt-1">
                  {user?.role === 'admin' ? 'Super Admin' : 'Officer'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-superior/10 flex items-center justify-center text-superior border border-superior/20 overflow-hidden shadow-sm group-hover:border-superior transition-all">
                <User size={22} />
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-8 custom-scrollbar bg-bg-main/30">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
