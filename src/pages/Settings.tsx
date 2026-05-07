import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Mail, Shield, Save, Moon, Bell, Monitor, Info, Sun } from 'lucide-react';
import { motion } from 'motion/react';

export default function Settings() {
  const { user, login } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [regNumber, setRegNumber] = useState(user?.registration_number || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { isDarkMode, toggleTheme } = useTheme();

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.put('/api/auth/profile', {
        username,
        email,
        registration_number: regNumber
      });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      // In a real app, you'd refresh the user context here
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage({ type: '', text: '' });

    try {
      await axios.put('/api/auth/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-text-main tracking-tight">Account Settings</h1>
        <p className="text-text-muted mt-1">Manage your identity and profile details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-[2.5rem] p-8 shadow-sm border border-border-color">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-text-main">
              <User size={20} className="text-superior" />
              Profile Information
            </h2>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-2">Username</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 p-4 bg-bg-hover rounded-2xl border border-transparent focus:border-superior/30 focus:ring-4 focus:ring-superior/5 outline-none transition-all text-text-main text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-2">Email</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 p-4 bg-bg-hover rounded-2xl border border-transparent focus:border-superior/30 focus:ring-4 focus:ring-superior/5 outline-none transition-all text-text-main text-sm"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-text-muted italic">Format: su92-bsitm-f22-[roll]@gmail.com</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-2">Registration Number</label>
                <div className="relative">
                  <Shield size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    className="w-full pl-10 p-4 bg-bg-hover rounded-2xl border border-transparent focus:border-superior/30 focus:ring-4 focus:ring-superior/5 outline-none transition-all text-text-main text-sm"
                    placeholder="e.g. SU-2022-BSCS-123"
                  />
                </div>
              </div>

              {message.text && (
                <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-superior text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-superior/20 hover:bg-superior-dark transition-all disabled:opacity-50"
              >
                <Save size={18} />
                {loading ? 'Saving...' : 'Update Profile'}
              </button>
            </form>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-[2.5rem] p-8 shadow-sm border border-border-color">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-text-main">
              <Shield size={20} className="text-superior" />
              Security & Password
            </h2>

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-2">Current Password</label>
                <input
                  required
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="w-full p-4 bg-bg-hover rounded-2xl border border-transparent focus:border-superior/30 focus:ring-4 focus:ring-superior/5 outline-none transition-all text-text-main text-sm"
                  placeholder="••••••••"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-2">New Password</label>
                  <input
                    required
                    minLength={6}
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="w-full p-4 bg-bg-hover rounded-2xl border border-transparent focus:border-superior/30 focus:ring-4 focus:ring-superior/5 outline-none transition-all text-text-main text-sm"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-2">Confirm New Password</label>
                  <input
                    required
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="w-full p-4 bg-bg-hover rounded-2xl border border-transparent focus:border-superior/30 focus:ring-4 focus:ring-superior/5 outline-none transition-all text-text-main text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {passwordMessage.text && (
                <div className={`p-4 rounded-xl text-sm font-medium ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {passwordMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={passwordLoading}
                className="bg-text-main text-background px-8 py-4 rounded-2xl font-black hover:opacity-90 transition-all disabled:opacity-50"
              >
                {passwordLoading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </motion.div>

        </div>

        <div className="space-y-6">
          <div className="bg-superior text-white p-6 rounded-3xl shadow-lg shadow-superior/20">
            <Shield size={32} className="mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">Security ID</h3>
            <p className="text-superior-light text-sm mb-4">Your registration number is used to verify eligibility for campus elections.</p>
            <div className="p-3 bg-white/10 rounded-xl border border-white/20 font-mono text-center">
              {user?.registration_number || 'NOT SET'}
            </div>
          </div>

          <div className="bg-card p-6 rounded-[2rem] border border-border-color shadow-sm">
            <h4 className="font-black text-text-main mb-4 text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
              <Info size={14} className="text-superior" />
              System Info
            </h4>
            <p className="text-xs text-text-muted leading-relaxed mb-3">
              This system is maintained by the Superior IT Department. Access is restricted to verified campus residents and students.
            </p>
            <p className="text-[10px] text-text-muted/60 font-black tracking-widest uppercase">Version 1.4.2-SUPERIOR</p>
          </div>
        </div>
      </div>
    </div>
  );
}
