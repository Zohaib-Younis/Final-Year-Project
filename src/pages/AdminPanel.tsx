import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Plus, 
  Users, 
  Vote, 
  Info, 
  Trash2, 
  UserPlus, 
  ArrowRight, 
  TrendingUp,
  Download,
  Upload,
  Calendar,
  Lock,
  Mail,
  ShieldAlert,
  AlertCircle,
  Clock,
  ExternalLink,
  Award,
  CheckCircle2,
  XCircle,
  Filter,
  Eye,
  FileText,
  FileJson,
  Database,
  Bell,
  User,
  History,
  Search,
  Pencil,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminLayout from '../components/AdminLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { io } from 'socket.io-client';
import { useSettings } from '../context/SettingsContext';
import CandidateRequests from './CandidateRequests';

// --- Types ---
interface Stats {
  elections: number;
  users: number;
  votes: number;
}

interface Student {
  id: string;
  username: string;
  email: string;
  department: string;
  isEligible: boolean;
  registration_number: string;
}

interface AuditLog {
  id: string;
  user_id: { username: string; role: string };
  action: string;
  details: string;
  ip_address: string;
  timestamp: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  studentCount: number;
}

interface Announcement {
  id: string;
  _id?: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  author: { username: string };
}

interface AccountRequest {
  id: string;
  username: string;
  email: string;
  registration_number: string;
  department: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// --- Admin Panel Component ---
export default function AdminPanel() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="elections" element={<AdminElections />} />
        <Route path="elections/new" element={<CreateElection />} />
        <Route path="elections/:id/candidates" element={<ManageCandidates />} />
        <Route path="elections/:id/voters" element={<AdminVotersList />} />
        <Route path="users" element={<StudentManagement />} />
        <Route path="monitoring" element={<LiveMonitoring />} />
        <Route path="notifications" element={<NotificationSystem />} />
        <Route path="logs" element={<AuditLogs />} />
        <Route path="requests" element={<AccountRequestManagement />} />
        <Route path="candidate-requests" element={<CandidateRequests />} />
        <Route path="settings" element={<SystemSettings />} />
      </Routes>
    </AdminLayout>
  );
}

// --- Sub-Components ---

function Overview() {
  const [stats, setStats] = useState<Stats & { pendingAccountRequests: number }>({ elections: 0, users: 0, votes: 0, pendingAccountRequests: 0 });
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, logsRes] = await Promise.all([
          axios.get('/api/admin/stats'),
          axios.get('/api/admin/logs')
        ]);
        setStats(statsRes.data || { elections: 0, users: 0, votes: 0 });
        setRecentLogs(Array.isArray(logsRes.data) ? logsRes.data.slice(0, 5) : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const socket = io();
    socket.on('election:activity', (activity: any) => {
      setActivityFeed(prev => [activity, ...prev].slice(0, 10));
      setStats(prev => ({ ...prev, votes: prev.votes + 1 }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleExportReport = () => {
    const doc = new jsPDF();
    const now = new Date().toLocaleString();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(123, 92, 126); // Superior Purple
    doc.text('Secure Student Voting System', 105, 20, { align: 'center' });
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('System Analytics Report', 105, 30, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated on: ${now}`, 105, 40, { align: 'center' });

    // Summary Stats
    doc.setFontSize(14);
    doc.text('System Summary Statistics', 20, 60);
    
    const statsData = [
      ['Total Elections', stats.elections.toString()],
      ['Registered Students', stats.users.toString()],
      ['Votes Recorded', stats.votes.toString()],
      ['Pending Account Requests', stats.pendingAccountRequests.toString()],
      ['Voter Turnout Rate', `${stats.users > 0 ? ((stats.votes / stats.users) * 100).toFixed(1) : 0}%`]
    ];

    (doc as any).autoTable({
      startY: 70,
      head: [['Metric', 'Value']],
      body: statsData,
      theme: 'striped',
      headStyles: { fillColor: [123, 92, 126] }
    });

    // Recent Activity
    if (recentLogs.length > 0) {
      const finalY = (doc as any).lastAutoTable.cursor.y;
      doc.setFontSize(14);
      doc.text('Recent Administrative Activity', 20, finalY + 20);
      
      const logData = recentLogs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.user_id?.username || 'System',
        log.action,
        log.details
      ]);

      (doc as any).autoTable({
        startY: finalY + 30,
        head: [['Timestamp', 'Admin', 'Action', 'Details']],
        body: logData,
        theme: 'striped',
        headStyles: { fillColor: [123, 92, 126] },
        styles: { fontSize: 8 }
      });
    }

    doc.save(`Superior_Voting_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const chartData = [
    { name: 'Elections', value: stats.elections },
    { name: 'Students', value: stats.users },
    { name: 'Votes', value: stats.votes },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-main">System Overview</h1>
          <p className="text-text-muted">Real-time health and participation metrics.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-card px-4 py-2 rounded-xl border border-border-color font-bold text-sm hover:bg-bg-hover transition-colors shadow-sm">
            <Calendar size={18} className="text-superior" />
            May 2026
          </button>
          <button 
            onClick={handleExportReport}
            className="flex items-center gap-2 bg-superior text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-superior/20 hover:bg-superior-dark transition-all"
          >
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Total Elections" 
          value={stats.elections} 
          icon={<Vote className="text-indigo-500" />} 
          trend="+2 this week"
          color="indigo"
        />
        <StatCard 
          label="Registered Students" 
          value={stats.users} 
          icon={<Users className="text-cyan-500" />} 
          trend="+15% vs last month"
          color="cyan"
        />
        <StatCard 
          label="Votes Recorded" 
          value={stats.votes} 
          icon={<Award className="text-emerald-500" />} 
          trend="Real-time"
          color="emerald"
        />
        <StatCard 
          label="Pending Requests" 
          value={stats.pendingAccountRequests || 0} 
          icon={<UserPlus className="text-amber-500" />} 
          trend="Action required"
          color="amber"
          onClick={() => navigate('/admin/requests')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-card p-8 rounded-3xl border border-border-color shadow-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-superior" />
              Participation Growth
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: 'var(--bg-hover)' }} 
                    contentStyle={{ 
                      backgroundColor: 'var(--bg-card)', 
                      borderRadius: '12px', 
                      border: '1px solid var(--border-color)', 
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      color: 'var(--text-primary)'
                    }} 
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 2 ? '#10B981' : '#4F46E5'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card p-8 rounded-3xl border border-border-color shadow-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <History size={20} className="text-superior" />
              Recent Audit Logs
            </h3>
            <div className="space-y-4">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-4 p-3 hover:bg-bg-hover rounded-2xl transition-colors">
                  <div className="w-10 h-10 bg-bg-hover rounded-xl flex items-center justify-center text-text-muted shrink-0">
                    <Clock size={18} />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-bold text-text-main truncate">{log.action}</p>
                    <p className="text-xs text-text-muted truncate">{log.details}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-superior uppercase tracking-widest">{log.user_id?.username}</p>
                    <p className="text-[10px] text-text-muted mt-1">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/admin/logs" className="mt-6 block text-center text-sm font-bold text-superior hover:underline">
              View All Logs
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-superior text-white p-8 rounded-[2.5rem] shadow-xl shadow-superior/20 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-superior-light">Live Activity Feed</span>
              </div>
              <div className="space-y-4">
                {activityFeed.map((activity, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className="p-3 bg-card/10 rounded-2xl border border-white/10 backdrop-blur-sm"
                  >
                    <p className="text-xs font-bold">New vote cast!</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] text-superior-light">{activity.student_id} from {activity.department}</span>
                      <span className="text-[10px] opacity-50">{new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </motion.div>
                ))}
                {activityFeed.length === 0 && (
                  <p className="text-xs text-superior-light italic py-4">Waiting for incoming votes...</p>
                )}
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-card/5 rounded-full blur-3xl"></div>
          </div>

          <div className="bg-card p-8 rounded-3xl border border-border-color shadow-sm">
            <h4 className="text-sm font-black text-text-main uppercase tracking-widest mb-4">Quick Insights</h4>
            <div className="space-y-4 text-xs text-text-muted">
              <div className="flex justify-between">
                <span>Voter Turnout</span>
                <span className="font-bold text-text-main">{stats.users > 0 ? ((stats.votes / stats.users) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="w-full h-1.5 bg-bg-hover rounded-full overflow-hidden">
                <div 
                  className="h-full bg-superior" 
                  style={{ width: `${stats.users > 0 ? (stats.votes / stats.users) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-[10px] leading-relaxed">System is running in offline mode. All data is synchronized locally.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, trend, color, onClick }: { label: string, value: number, icon: React.ReactNode, trend: string, color: string, onClick?: () => void }) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-500',
    cyan: 'bg-cyan-50 text-cyan-500',
    emerald: 'bg-emerald-50 text-emerald-500',
    amber: 'bg-amber-50 text-amber-500'
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      onClick={onClick}
      className={`bg-card p-6 rounded-3xl border border-border-color shadow-sm hover:shadow-xl hover:shadow-superior/10 transition-all ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${colors[color]}`}>{icon}</div>
        <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-widest">
          {trend}
        </span>
      </div>
      <div>
        <p className="text-sm text-text-muted font-medium mb-1 uppercase tracking-wider">{label}</p>
        <p className="text-4xl font-black text-text-main">{value.toLocaleString()}</p>
      </div>
    </motion.div>
  );
}

function AdminElections() {
  const [elections, setElections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      const res = await axios.get('/api/elections');
      setElections(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnnounce = async (id: string) => {
    try {
      const res = await axios.post(`/api/elections/${id}/announce`);
      alert(res.data.message);
      fetchElections();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to announce results');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this election? All data will be lost permanently.')) {
      try {
        await axios.delete(`/api/elections/${id}`);
        fetchElections();
      } catch (err) {
        alert('Failed to delete election');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-text-main">Election Management</h2>
          <p className="text-text-muted text-sm">Create and schedule university-wide voting sessions.</p>
        </div>
        <Link to="/admin/elections/new" className="bg-superior text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-superior/20 hover:bg-superior-dark transition-all">
          <Plus size={18} /> New Election
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {elections.map((election) => (
          <div key={election.id} className="bg-card p-6 rounded-3xl border border-border-color shadow-sm hover:border-superior/30 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group">
            <div className="flex-grow">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-bold text-xl text-text-main group-hover:text-superior transition-colors">{election.title}</h3>
                <span className={`text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-widest ${
                  election.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 
                  election.status === 'scheduled' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {election.status}
                </span>
                <span className="text-[10px] px-2 py-1 bg-superior/5 text-superior rounded-full font-black uppercase tracking-widest">
                  {election.vote_count || 0} votes
                </span>
              </div>
              <p className="text-sm text-text-muted line-clamp-1 max-w-2xl">{election.description}</p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium">
                  <Clock size={14} className="text-superior" />
                  Ends {new Date(election.end_date).toLocaleDateString()}
                </div>
                {election.allowed_email_pattern && (
                  <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium">
                    <ShieldAlert size={14} className="text-amber-500" />
                    Restricted
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex bg-bg-hover p-1.5 rounded-2xl border border-border-color gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link to={`/admin/elections/${election.id}/voters`} className="p-2 text-text-muted hover:text-superior hover:bg-card hover:shadow-sm rounded-xl transition-all" title="View Voters">
                  <Users size={18} />
                </Link>
                <Link to={`/admin/elections/${election.id}/candidates`} className="p-2 text-text-muted hover:text-superior hover:bg-card hover:shadow-sm rounded-xl transition-all" title="Manage Candidates">
                  <UserPlus size={18} />
                </Link>
                <button onClick={() => handleDelete(election.id)} className="p-2 text-text-muted hover:text-red-500 hover:bg-card hover:shadow-sm rounded-xl transition-all" title="Delete">
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="h-8 w-px bg-gray-100 mx-2"></div>
              <div className="flex flex-col gap-2">
                <Link 
                  to={`/results/${election.id}`} 
                  className="bg-superior/10 text-superior px-4 py-2 rounded-xl text-sm font-black hover:bg-superior hover:text-white transition-all text-center"
                >
                  View Results
                </Link>
                <button
                  onClick={() => handleAnnounce(election.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                    election.results_announced 
                      ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600' 
                      : 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600'
                  }`}
                >
                  {election.results_announced ? 'Retract Results' : 'Announce Results'}
                </button>
              </div>
            </div>
          </div>
        ))}

        {elections.length === 0 && !loading && (
          <div className="bg-card p-16 rounded-[2.5rem] border-2 border-dashed border-border-color text-center space-y-4">
            <div className="w-20 h-20 bg-bg-hover rounded-full flex items-center justify-center mx-auto text-gray-300">
              <Vote size={40} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text-main">No Elections Found</h3>
              <p className="text-text-muted text-sm max-w-xs mx-auto">Start by creating your first election to begin the voting process.</p>
            </div>
            <Link to="/admin/elections/new" className="inline-flex items-center gap-2 text-superior font-bold hover:underline">
              Create New Election <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function StudentManagement() {
  const [view, setView] = useState<'departments' | 'details'>('departments');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);
  const [isEditDeptModalOpen, setIsEditDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  const [newDept, setNewDept] = useState({ name: '', code: '', description: '' });
  const [manualStudent, setManualStudent] = useState({
    username: '',
    email: '',
    password: '',
    department: '',
    registration_number: ''
  });

  useEffect(() => {
    fetchDepartments();
    fetchStudents();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await axios.get('/api/admin/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get('/api/admin/users');
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/departments', newDept);
      setNewDept({ name: '', code: '', description: '' });
      setIsAddDeptModalOpen(false);
      fetchDepartments();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to add department');
    }
  };

  const handleDeleteDept = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('WARNING: Deleting this department will also PERMANENTLY delete all students registered in it. Proceed?')) return;
    try {
      await axios.delete(`/api/admin/departments/${id}`);
      fetchDepartments();
    } catch (err) {
      alert('Failed to delete department');
    }
  };

  const handleEditDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    try {
      await axios.put(`/api/admin/departments/${editingDept.id}`, {
        name: editingDept.name,
        code: editingDept.code,
        description: editingDept.description,
      });
      setIsEditDeptModalOpen(false);
      setEditingDept(null);
      fetchDepartments();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update department');
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const studentData = { ...manualStudent, department: selectedDept?.name };
      await axios.post('/api/admin/users', studentData);
      setIsAddModalOpen(false);
      setManualStudent({ username: '', email: '', password: '', department: '', registration_number: '' });
      fetchStudents();
      fetchDepartments(); // Refresh counts
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to add student');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-uploaded
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // Use defval:'' so empty cells appear as empty strings, not undefined
        const rawData: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (rawData.length === 0) {
          alert('File appears to be empty or has no data rows.');
          return;
        }

        // Helper: find a value from a row by trying multiple key names (case-insensitive)
        const pick = (row: any, keys: string[]): string => {
          for (const k of keys) {
            const match = Object.keys(row).find(rk => rk.trim().toLowerCase() === k.toLowerCase());
            if (match && String(row[match]).trim() !== '') return String(row[match]).trim();
          }
          return '';
        };

        const formattedData = rawData
          .filter(row => {
            // Skip rows where email doesn't look like an email (filters out junk/empty rows)
            const email = pick(row, ['email', 'email_address', 'student_email']);
            return email.includes('@');
          })
          .map(row => ({
            username: pick(row, ['username', 'name', 'full_name', 'fullname', 'student_name']),
            email: pick(row, ['email', 'email_address', 'student_email']),
            registration_number: pick(row, ['registration_number', 'reg_number', 'reg_no', 'regno', 'roll_no', 'rollno']),
            department: selectedDept?.name || pick(row, ['department', 'dept', 'faculty', 'program']),
          }));

        if (formattedData.length === 0) {
          alert('No valid rows found. Make sure your file has an "email" column with valid email addresses.');
          return;
        }

        const res = await axios.post('/api/admin/users/import', { students: formattedData });
        const { success, failed, errors } = res.data;

        let msg = `Import Complete!\n✅ Success: ${success}\n❌ Failed: ${failed}`;
        if (errors && errors.length > 0) {
          msg += `\n\nFailed rows:\n` + errors.slice(0, 10).join('\n');
          if (errors.length > 10) msg += `\n...and ${errors.length - 10} more`;
        }
        alert(msg);
        fetchStudents();
        fetchDepartments();
        setIsImportModalOpen(false);
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'Failed to upload file';
        alert(`Import Error: ${msg}`);
      }
    };
    reader.readAsBinaryString(file);
  };
  
  const handleBulkDelete = async () => {
    if (selectedStudents.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedStudents.length} students? This action cannot be undone.`)) return;

    try {
      await axios.delete('/api/admin/users/bulk', { data: { studentIds: selectedStudents } });
      fetchStudents();
      fetchDepartments();
      setSelectedStudents([]);
      alert('Students deleted successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete students');
    }
  };

  const toggleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredStudents = students.filter(s => 
    s.department === selectedDept?.name && (
      s.username.toLowerCase().includes(search.toLowerCase()) || 
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.registration_number && s.registration_number.toLowerCase().includes(search.toLowerCase()))
    )
  );

  if (view === 'departments') {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-text-main">Student Departments</h2>
            <p className="text-text-muted text-sm">Organize and manage students by their academic departments.</p>
          </div>
          <button 
            onClick={() => setIsAddDeptModalOpen(true)}
            className="bg-superior text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-superior/20 hover:bg-superior-dark transition-all"
          >
            <Plus size={20} /> Add Department
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <div 
              key={dept.id}
              onClick={() => { setSelectedDept(dept); setView('details'); }}
              className="bg-card p-8 rounded-[2.5rem] border border-border-color shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative"
            >
              <div className="w-14 h-14 bg-bg-hover rounded-2xl flex items-center justify-center text-superior mb-6 group-hover:scale-110 transition-transform">
                <Users size={28} />
              </div>
              <h3 className="text-xl font-black text-text-main mb-1">{dept.name}</h3>
              <p className="text-text-muted text-xs font-bold uppercase tracking-widest">{dept.code}</p>
              
              <div className="mt-8 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-text-main">{dept.studentCount}</p>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Total Students</p>
                </div>
                <div className="w-10 h-10 bg-superior/10 text-superior rounded-full flex items-center justify-center">
                  <ArrowRight size={20} />
                </div>
              </div>

              <button 
                onClick={(e) => { e.stopPropagation(); setEditingDept(dept); setIsEditDeptModalOpen(true); }}
                className="absolute top-6 right-16 p-2 text-text-muted hover:text-superior opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Pencil size={16} />
              </button>
              <button 
                onClick={(e) => handleDeleteDept(dept.id, e)}
                className="absolute top-6 right-6 p-2 text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          {departments.length === 0 && !loading && (
            <div className="col-span-full py-32 bg-bg-hover rounded-[2.5rem] border-2 border-dashed border-border-color text-center">
              <Users size={48} className="mx-auto mb-4 opacity-10" />
              <p className="text-text-muted">No departments created yet. Start by adding one!</p>
            </div>
          )}
        </div>

        {/* Add Dept Modal */}
        <AnimatePresence>
          {isAddDeptModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddDeptModalOpen(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card w-full max-w-md rounded-[2.5rem] border border-border-color shadow-2xl relative z-10 p-8">
                <h3 className="text-2xl font-black mb-6">New Department</h3>
                <form onSubmit={handleAddDept} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Department Name</label>
                    <input 
                      required
                      type="text" 
                      value={newDept.name}
                      onChange={e => setNewDept({...newDept, name: e.target.value})}
                      placeholder="e.g. Faculty of Computing" 
                      className="w-full p-4 bg-bg-hover border-none rounded-2xl text-sm outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Department Code</label>
                    <input 
                      required
                      type="text" 
                      value={newDept.code}
                      onChange={e => setNewDept({...newDept, code: e.target.value})}
                      placeholder="e.g. FCS" 
                      className="w-full p-4 bg-bg-hover border-none rounded-2xl text-sm outline-none uppercase" 
                    />
                  </div>
                  <button className="w-full bg-superior text-white py-4 rounded-2xl font-black shadow-lg shadow-superior/20 hover:bg-superior-dark transition-all">
                    Create Department
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit Dept Modal */}
        <AnimatePresence>
          {isEditDeptModalOpen && editingDept && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsEditDeptModalOpen(false); setEditingDept(null); }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card w-full max-w-md rounded-[2.5rem] border border-border-color shadow-2xl relative z-10 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-superior/10 text-superior rounded-xl flex items-center justify-center">
                    <Pencil size={18} />
                  </div>
                  <h3 className="text-2xl font-black">Edit Department</h3>
                </div>
                <form onSubmit={handleEditDept} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Department Name</label>
                    <input 
                      required
                      type="text" 
                      value={editingDept.name}
                      onChange={e => setEditingDept({...editingDept, name: e.target.value})}
                      className="w-full p-4 bg-bg-hover border-none rounded-2xl text-sm outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Department Code</label>
                    <input 
                      required
                      type="text" 
                      value={editingDept.code}
                      onChange={e => setEditingDept({...editingDept, code: e.target.value})}
                      className="w-full p-4 bg-bg-hover border-none rounded-2xl text-sm outline-none uppercase" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Description (optional)</label>
                    <input 
                      type="text" 
                      value={editingDept.description || ''}
                      onChange={e => setEditingDept({...editingDept, description: e.target.value})}
                      placeholder="Brief description of this department"
                      className="w-full p-4 bg-bg-hover border-none rounded-2xl text-sm outline-none" 
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" className="flex-1 bg-superior text-white py-4 rounded-2xl font-black shadow-lg shadow-superior/20 hover:bg-superior-dark transition-all">
                      Save Changes
                    </button>
                    <button type="button" onClick={() => { setIsEditDeptModalOpen(false); setEditingDept(null); }} className="px-6 py-4 bg-bg-hover text-text-muted rounded-2xl font-bold hover:bg-border-color transition-all">
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('departments')}
            className="w-12 h-12 bg-bg-hover rounded-2xl flex items-center justify-center text-text-muted hover:text-superior hover:bg-superior/10 transition-all"
          >
            <ArrowRight size={20} className="rotate-180" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-text-main">{selectedDept?.name}</h2>
            <p className="text-text-muted text-sm">Managing students in {selectedDept?.code} department.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-card border border-border-color rounded-2xl text-sm font-bold hover:bg-bg-hover transition-all"
          >
            <Upload size={18} /> Import CSV
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-superior text-white rounded-2xl text-sm font-bold hover:bg-superior-dark transition-all shadow-lg shadow-superior/20"
          >
            <UserPlus size={18} /> Add Student
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedStudents.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-100 p-4 rounded-2xl flex justify-between items-center"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-black">
              {selectedStudents.length}
            </div>
            <p className="text-sm font-bold text-red-700">Students selected for bulk action</p>
          </div>
          <button 
            onClick={handleBulkDelete}
            className="flex items-center gap-2 px-6 py-2 bg-red-500 text-white rounded-xl text-sm font-black hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
          >
            <Trash2 size={16} /> Delete Selected
          </button>
        </motion.div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-6 rounded-3xl border border-border-color">
          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Total Students</p>
          <p className="text-2xl font-black text-text-main">{filteredStudents.length}</p>
        </div>
        <div className="bg-card p-6 rounded-3xl border border-border-color">
          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Eligible</p>
          <p className="text-2xl font-black text-emerald-500">{filteredStudents.filter(s => s.isEligible).length}</p>
        </div>
        <div className="bg-card p-6 rounded-3xl border border-border-color">
          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Ineligible</p>
          <p className="text-2xl font-black text-red-500">{filteredStudents.filter(s => !s.isEligible).length}</p>
        </div>
        <div className="bg-bg-hover p-4 rounded-3xl border border-border-color flex items-center gap-4">
          <Search size={20} className="text-text-muted shrink-0" />
          <input 
            type="text" 
            placeholder="Search within department..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full"
          />
        </div>
      </div>

      <div className="bg-card rounded-[2.5rem] border border-border-color shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-[0.15em] text-text-muted border-b border-border-color bg-bg-hover/30">
                <th className="px-8 py-5 w-10">
                  <input 
                    type="checkbox" 
                    checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-superior focus:ring-superior cursor-pointer"
                  />
                </th>
                <th className="px-4 py-5">Student Information</th>
                <th className="px-6 py-5">Registration No.</th>
                <th className="px-6 py-5">Eligibility</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color/30">
              {filteredStudents.map((s) => (
                <tr key={s.id} className={`hover:bg-bg-hover/30 transition-colors group ${selectedStudents.includes(s.id) ? 'bg-superior/5' : ''}`}>
                  <td className="px-8 py-5">
                    <input 
                      type="checkbox" 
                      checked={selectedStudents.includes(s.id)}
                      onChange={() => toggleSelectStudent(s.id)}
                      className="w-4 h-4 rounded border-gray-300 text-superior focus:ring-superior cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-superior/10 text-superior rounded-xl flex items-center justify-center font-black text-sm">
                        {s.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-black text-text-main">{s.username}</p>
                        <p className="text-[10px] text-text-muted font-bold">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-mono text-xs font-bold text-text-main">
                    {s.registration_number || '---'}
                  </td>
                  <td className="px-6 py-5">
                    <button 
                      onClick={async () => {
                        await axios.put(`/api/admin/users/${s.id}/eligibility`);
                        fetchStudents();
                      }}
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                        s.isEligible ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                      }`}
                    >
                      {s.isEligible ? 'Eligible' : 'Ineligible'}
                    </button>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={async () => {
                        if (window.confirm('Delete student?')) {
                          await axios.delete(`/api/admin/users/${s.id}`);
                          fetchStudents();
                          fetchDepartments();
                        }
                      }}
                      className="p-2 text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredStudents.length === 0 && (
            <div className="p-16 text-center text-text-muted italic">
              No students found in this department.
            </div>
          )}
        </div>
      </div>

      {/* Manual Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card w-full max-w-md rounded-[2.5rem] border border-border-color shadow-2xl relative z-10 p-8 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-black mb-6">Add to {selectedDept?.name}</h3>
              <form onSubmit={handleManualAdd} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Full Name</label>
                  <input required type="text" value={manualStudent.username} onChange={e => setManualStudent({...manualStudent, username: e.target.value})} className="w-full p-4 bg-bg-hover border-none rounded-2xl text-sm outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Email Address</label>
                  <input required type="email" value={manualStudent.email} onChange={e => setManualStudent({...manualStudent, email: e.target.value})} className="w-full p-4 bg-bg-hover border-none rounded-2xl text-sm outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Registration Number</label>
                  <input required type="text" value={manualStudent.registration_number} onChange={e => setManualStudent({...manualStudent, registration_number: e.target.value})} className="w-full p-4 bg-bg-hover border-none rounded-2xl text-sm outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Initial Password</label>
                  <input required type="password" value={manualStudent.password} onChange={e => setManualStudent({...manualStudent, password: e.target.value})} className="w-full p-4 bg-bg-hover border-none rounded-2xl text-sm outline-none" />
                </div>
                <button className="w-full bg-superior text-white py-4 rounded-2xl font-black shadow-lg shadow-superior/20 hover:bg-superior-dark transition-all">
                  Register Student
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsImportModalOpen(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card w-full max-w-md rounded-[2.5rem] border border-border-color shadow-2xl relative z-10 p-10 text-center">
              <div className="w-20 h-20 bg-superior/10 text-superior rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload size={40} />
              </div>
              <h3 className="text-2xl font-black mb-2">Bulk Import</h3>
              <p className="text-text-muted text-sm mb-8">Upload CSV/Excel for {selectedDept?.code}. Required columns: username, email, registration_number</p>
              
              <label className="block w-full py-4 bg-superior text-white rounded-2xl font-black cursor-pointer hover:bg-superior-dark transition-all shadow-lg shadow-superior/20">
                Select File
                <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
              </label>
              <button onClick={() => setIsImportModalOpen(false)} className="mt-4 text-text-muted font-bold text-sm hover:underline">Cancel</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


function LiveMonitoring() {
  const [activeElections, setActiveElections] = useState<any[]>([]);
  const [selectedElection, setSelectedElection] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any[]>([]);

  useEffect(() => {
    axios.get('/api/elections').then(res => {
      const active = Array.isArray(res.data) ? res.data.filter((e: any) => e.status === 'active') : [];
      setActiveElections(active);
      if (active.length > 0) setSelectedElection(active[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedElection) {
      axios.get(`/api/vote/results/${selectedElection}`).then(res => {
        // results is the array of candidates with votes
        setAnalytics(res.data.results || []);
      });

      // Listen for real-time updates
      const socket = io();
      socket.on(`election:${selectedElection}:results`, (data: any) => {
        // data here is already the array of candidates
        setAnalytics(data);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [selectedElection]);

  const totalVotes = Array.isArray(analytics) ? analytics.reduce((s, a) => s + a.votes, 0) : 0;
  const sortedAnalytics = Array.isArray(analytics) ? [...analytics].sort((a, b) => b.votes - a.votes) : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-text-main">Live Monitoring</h2>
          <p className="text-text-muted text-sm">Real-time voting analytics and participation war room.</p>
        </div>
        <div className="flex bg-card p-1 rounded-xl border border-border-color shadow-sm">
          {activeElections.map(e => (
            <button
              key={e.id}
              onClick={() => setSelectedElection(e.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedElection === e.id ? 'bg-superior text-white shadow-md shadow-superior/20' : 'text-text-muted hover:text-text-main'
              }`}
            >
              {e.title}
            </button>
          ))}
          {activeElections.length === 0 && (
            <div className="px-4 py-2 text-xs font-bold text-text-muted italic">No Active Elections</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card p-8 rounded-[2.5rem] border border-border-color shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold">Turnout Statistics</h3>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              LIVE DATA
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedAnalytics}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: 'var(--bg-hover)' }} 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)'
                  }} 
                />
                <Bar dataKey="votes" fill="#4F46E5" radius={[10, 10, 0, 0]} barSize={50}>
                  {sortedAnalytics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4F46E5' : '#06B6D4'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card p-8 rounded-[2.5rem] border border-border-color shadow-sm flex flex-col items-center justify-center text-center">
            <h4 className="text-sm font-black text-text-muted uppercase tracking-[0.2em] mb-6">Total Participation</h4>
            <div className="relative w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sortedAnalytics}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="votes"
                  >
                    {sortedAnalytics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4F46E5' : '#06B6D4'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-text-main">{totalVotes}</span>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Votes</span>
              </div>
            </div>
            <div className="mt-8 space-y-3 w-full">
              {sortedAnalytics.map((a, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${i % 2 === 0 ? 'bg-superior' : 'bg-secondary'}`}></div>
                    <span className="font-bold text-text-main truncate max-w-[120px]">{a.name}</span>
                  </div>
                  <span className="text-text-muted">{a.votes} votes</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-superior text-white p-6 rounded-[2.5rem] shadow-xl shadow-superior/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-card/10 rounded-xl flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-superior-light uppercase tracking-widest leading-none mb-1">Peak Performance</p>
                <p className="text-sm font-black">Top Representative</p>
              </div>
            </div>
            {sortedAnalytics.length > 0 && sortedAnalytics[0].votes > 0 ? (
              <div className="space-y-4">
                <div className="p-4 bg-card/10 rounded-2xl border border-white/20">
                  <p className="text-2xl font-black">{sortedAnalytics[0].name}</p>
                  <div className="flex justify-between items-center mt-2 text-xs">
                    <span className="text-superior-light">Leading by</span>
                    <span className="font-bold">+{sortedAnalytics[0].votes - (sortedAnalytics[1]?.votes || 0)} votes</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-superior-light italic">Waiting for more data...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationSystem() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('low');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get('/api/admin/announcements');
      setAnnouncements(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/admin/announcements', { title, content, priority });
      setTitle('');
      setContent('');
      fetchAnnouncements();
    } catch (err) {
      alert('Failed to post announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (ann: Announcement) => {
    // Try multiple ID fields just in case
    const id = ann.id || (ann as any)._id || (ann as any).id;
    
    if (!id) {
      alert('Error: Could not identify announcement ID');
      return;
    }

    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        const response = await axios.delete(`/api/admin/announcements/${id}`);
        if (response.data) {
          fetchAnnouncements();
        }
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Failed to delete announcement. Please check your connection or permissions.';
        alert(msg);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <div className="bg-card p-8 rounded-[2.5rem] border border-border-color shadow-sm sticky top-28">
          <h3 className="text-xl font-black mb-6">Create Broadcast</h3>
          <form onSubmit={handlePost} className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Announcement Title</label>
              <input 
                type="text" 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Voting Deadline Extended"
                className="w-full p-4 bg-bg-hover border-none rounded-2xl text-sm focus:ring-2 focus:ring-superior/20 transition-all outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Priority Level</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-grow py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                      priority === p 
                        ? p === 'high' ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-200' :
                          p === 'medium' ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-200' :
                          'bg-superior text-white border-superior shadow-md shadow-superior-200'
                        : 'bg-card text-text-muted border-border-color hover:bg-bg-hover'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Content Body</label>
              <textarea 
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your message here..."
                className="w-full p-4 bg-bg-hover border-none rounded-2xl text-sm focus:ring-2 focus:ring-superior/20 transition-all outline-none h-40 resize-none"
              ></textarea>
            </div>
            <button 
              disabled={loading}
              className="w-full bg-superior text-white py-4 rounded-2xl font-black shadow-lg shadow-superior/20 hover:bg-superior-dark transition-all flex items-center justify-center gap-2"
            >
              <Bell size={20} /> {loading ? 'Broadcasting...' : 'Post Announcement'}
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <h3 className="text-xl font-black flex items-center gap-2">
          <Bell size={20} className="text-superior" />
          Recent Broadcasts
        </h3>
        {announcements.map((ann) => (
          <div key={ann.id || ann._id} className="bg-card p-8 rounded-[2.5rem] border border-border-color shadow-sm relative group">
            <div className="absolute top-8 right-8 flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                ann.priority === 'high' ? 'bg-red-50 text-red-500' :
                ann.priority === 'medium' ? 'bg-amber-50 text-amber-500' :
                'bg-superior/10 text-superior'
              }`}>
                {ann.priority} Priority
              </div>
              <button 
                onClick={() => handleDelete(ann)}
                className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                title="Delete Announcement"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="mb-4">
              <h4 className="text-xl font-black text-text-main mb-2">{ann.title}</h4>
              <p className="text-text-muted leading-relaxed">{ann.content}</p>
            </div>
            <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-text-muted">
                  <User size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-main leading-none">{ann.author?.username}</p>
                  <p className="text-[10px] text-text-muted mt-1 uppercase tracking-widest">Election Officer</p>
                </div>
              </div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                {new Date(ann.createdAt).toLocaleDateString()} at {new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {announcements.length === 0 && (
          <div className="text-center py-32 bg-bg-hover rounded-[2.5rem] border-2 border-dashed border-gray-200 text-text-muted">
            <Bell size={48} className="mx-auto mb-4 opacity-10" />
            <p>No announcements have been broadcasted yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await axios.get('/api/admin/logs');
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDeleteLog = async (id: string) => {
    if (window.confirm('Delete this log entry?')) {
      try {
        await axios.delete(`/api/admin/logs/${id}`);
        fetchLogs();
      } catch (err) {
        alert('Failed to delete log');
      }
    }
  };

  const handleClearLogs = async () => {
    if (window.confirm('WARNING: This will permanently delete ALL audit logs. This action is recorded. Proceed?')) {
      try {
        await axios.delete('/api/admin/logs/all');
        fetchLogs();
      } catch (err) {
        alert('Failed to clear logs');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-text-main">Audit Trail</h2>
          <p className="text-text-muted text-sm">Security logs tracking every administrative action.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleClearLogs}
            className="bg-red-50 text-red-500 border border-red-100 px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-red-100 flex items-center gap-2 transition-all"
          >
            <Trash2 size={18} /> Clear All
          </button>
          <button className="bg-card border border-border-color px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-bg-hover flex items-center gap-2 transition-all">
            <Download size={18} /> Download Logs
          </button>
        </div>
      </div>

      <div className="bg-card rounded-[2.5rem] border border-border-color shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-[0.15em] text-text-muted border-b border-border-color">
                <th className="px-8 py-5">Timestamp</th>
                <th className="px-6 py-5">Admin/Officer</th>
                <th className="px-6 py-5">Action</th>
                <th className="px-6 py-5">Context/Details</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color/30">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-bg-hover/50 transition-colors group">
                  <td className="px-8 py-5 whitespace-nowrap">
                    <p className="text-xs font-bold text-text-main">{new Date(log.timestamp).toLocaleDateString()}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">{new Date(log.timestamp).toLocaleTimeString()}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-superior/10 text-superior rounded flex items-center justify-center font-bold text-[10px]">
                        {log.user_id?.username?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-text-main">{log.user_id?.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[10px] px-2 py-0.5 bg-bg-hover text-text-main rounded font-black uppercase tracking-widest border border-border-color">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs text-text-muted italic max-w-xs truncate" title={log.details}>{log.details}</p>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => handleDeleteLog(log.id)}
                      className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && !loading && (
            <div className="p-12 text-center text-text-muted italic border-t border-border-color">
              No audit logs found in the system.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SystemSettings() {
  const [settings, setSettings] = useState({ 
    maintenanceMode: false, 
    officerRestricted: false,
    institutionName: 'Superior University',
    appName: 'SuperiorVote',
    appLogo: null as string | null,
    timezone: 'Pakistan Standard Time (GMT+5)'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { refreshSettings } = useSettings();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/admin/settings');
      setSettings(res.data);
    } catch (err) {
      console.error('Failed to fetch settings', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = async (key: 'maintenanceMode' | 'officerRestricted') => {
    try {
      const newValue = !settings[key];
      const res = await axios.put('/api/admin/settings', { [key]: newValue });
      setSettings(res.data);
    } catch (err) {
      alert('Failed to update setting. You may not have permission.');
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const res = await axios.put('/api/admin/settings', { 
        institutionName: settings.institutionName,
        appName: settings.appName,
        appLogo: settings.appLogo,
        timezone: settings.timezone
      });
      setSettings(res.data);
      await refreshSettings();
      alert('Settings saved successfully!');
    } catch (err) {
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      const res = await axios.get('/api/admin/backup', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `superior_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to generate backup. Make sure you are an administrator.');
    }
  };

  if (loading) return <div className="p-12 text-center text-text-muted">Loading settings...</div>;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-black text-text-main">System Settings</h2>
        <p className="text-text-muted text-sm">Configure global platform behavior and security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card p-8 rounded-[2.5rem] border border-border-color shadow-sm space-y-6">
          <h3 className="text-lg font-black flex items-center gap-2">
            <ShieldAlert size={20} className="text-superior" />
            Security & Access
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-bg-hover rounded-2xl">
              <div>
                <p className="text-sm font-bold text-text-main">Maintenance Mode</p>
                <p className="text-[10px] text-text-muted">Disable voting for all students</p>
              </div>
              <button 
                onClick={() => toggleSetting('maintenanceMode')}
                className={`w-12 h-6 rounded-full relative transition-all duration-300 ${settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-card rounded-full transition-all duration-300 ${settings.maintenanceMode ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-bg-hover rounded-2xl">
              <div>
                <p className="text-sm font-bold text-text-main">Officer Restricted</p>
                <p className="text-[10px] text-text-muted">Limit officer capabilities</p>
              </div>
              <button 
                onClick={() => toggleSetting('officerRestricted')}
                className={`w-12 h-6 rounded-full relative transition-all duration-300 ${settings.officerRestricted ? 'bg-superior' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-card rounded-full transition-all duration-300 ${settings.officerRestricted ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-card p-8 rounded-[2.5rem] border border-border-color shadow-sm space-y-6">
          <h3 className="text-lg font-black flex items-center gap-2">
            <Database size={20} className="text-secondary" />
            Data Management
          </h3>
          <div className="space-y-3">
            <button 
              onClick={handleBackup}
              className="w-full text-left p-4 bg-bg-hover hover:bg-gray-100 rounded-2xl transition-colors flex items-center justify-between group"
            >
              <div>
                <p className="text-sm font-bold text-text-main">Backup Database</p>
                <p className="text-[10px] text-text-muted">Export all data to JSON</p>
              </div>
              <Download size={18} className="text-text-muted group-hover:text-superior transition-colors" />
            </button>
            <button className="w-full text-left p-4 bg-bg-hover hover:bg-gray-100 rounded-2xl transition-colors flex items-center justify-between group">
              <div>
                <p className="text-sm font-bold text-text-main">Archive Old Elections</p>
                <p className="text-[10px] text-text-muted">Move to cold storage</p>
              </div>
              <ArrowRight size={18} className="text-text-muted group-hover:text-superior transition-colors" />
            </button>
            <button className="w-full text-left p-4 bg-red-50 hover:bg-red-100 rounded-2xl transition-colors flex items-center justify-between group">
              <div>
                <p className="text-sm font-bold text-red-600">Purge Audit Logs</p>
                <p className="text-[10px] text-red-400">Irreversible action</p>
              </div>
              <Trash2 size={18} className="text-red-400 group-hover:text-red-600 transition-colors" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-card p-8 rounded-[2.5rem] border border-border-color shadow-sm">
        <h3 className="text-lg font-black mb-6">General Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Institution Name</label>
            <input 
              type="text" 
              value={settings.institutionName} 
              onChange={(e) => setSettings({...settings, institutionName: e.target.value})}
              className="w-full p-4 bg-bg-hover border-none rounded-2xl text-sm outline-none text-text-main" 
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">System Timezone</label>
            <select 
              value={settings.timezone}
              onChange={(e) => setSettings({...settings, timezone: e.target.value})}
              className="w-full p-4 bg-bg-hover border-none rounded-2xl text-sm outline-none text-text-main"
            >
              <option>Pakistan Standard Time (GMT+5)</option>
              <option>UTC (GMT+0)</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">App Name</label>
            <input 
              type="text" 
              value={settings.appName} 
              onChange={(e) => setSettings({...settings, appName: e.target.value})}
              className="w-full p-4 bg-bg-hover border-none rounded-2xl text-sm outline-none text-text-main" 
              placeholder="e.g. MyVote"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">App Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-bg-hover border border-border-color flex items-center justify-center overflow-hidden shrink-0">
                {settings.appLogo ? (
                  <img src={settings.appLogo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Plus className="text-gray-300" />
                )}
              </div>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setSettings({...settings, appLogo: reader.result as string});
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="text-[10px] text-text-muted file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-superior/10 file:text-superior hover:file:bg-superior/20"
              />
              {settings.appLogo && (
                <button 
                  onClick={() => setSettings({...settings, appLogo: null})}
                  className="text-xs font-bold text-red-500 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleSaveAll}
            disabled={saving}
            className="bg-superior text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-superior/20 hover:bg-superior-dark transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Placeholder sub-sub-components used in routes ---

function CreateElection() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [allowedEmailPattern, setAllowedEmailPattern] = useState('');
  const [allowAdminVote, setAllowAdminVote] = useState(false);
  const [targetDepartment, setTargetDepartment] = useState('All');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isManualDept, setIsManualDept] = useState(false);
  const [manualDeptName, setManualDeptName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await axios.get('/api/admin/departments');
        setDepartments(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to fetch departments', err);
      }
    };
    fetchDepts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await axios.post('/api/elections', {
      title,
      description,
      password: password || null,
      allowed_email_pattern: allowedEmailPattern || null,
      allow_admin_vote: allowAdminVote,
      target_department: isManualDept ? manualDeptName : targetDepartment,
      start_date: startDate,
      end_date: endDate
    });
    navigate('/admin/elections');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/admin/elections" className="inline-flex items-center gap-2 text-text-muted hover:text-superior mb-6 transition-colors group">
        <ArrowRight className="rotate-180 group-hover:-translate-x-1 transition-transform" size={18} />
        Back to Elections
      </Link>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card p-10 rounded-[2.5rem] border border-border-color shadow-sm">
        <h2 className="text-3xl font-black text-text-main mb-8">Create New Election</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Election Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-4 bg-bg-hover border-none rounded-2xl text-sm focus:ring-2 focus:ring-superior/20 transition-all outline-none"
                placeholder="e.g. Student Council 2026"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Target Department Restriction</label>
              <div className="space-y-3">
                <div className="relative">
                  <select
                    disabled={isManualDept}
                    value={targetDepartment}
                    onChange={(e) => setTargetDepartment(e.target.value)}
                    className="w-full p-4 bg-bg-hover border-none rounded-2xl text-sm focus:ring-2 focus:ring-superior/20 transition-all outline-none appearance-none disabled:opacity-50"
                  >
                    <option value="All">All University (Open for everyone)</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name} ({dept.code})</option>
                    ))}
                  </select>
                  {!isManualDept && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                      <Filter size={16} />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsManualDept(!isManualDept);
                      if (isManualDept) setManualDeptName('');
                    }}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      isManualDept ? 'bg-superior text-white shadow-lg shadow-superior/20' : 'bg-bg-hover text-text-muted border border-border-color'
                    }`}
                  >
                    {isManualDept ? 'Using Manual Entry' : 'Manual Entry'}
                  </button>
                  {isManualDept && (
                    <input
                      required
                      type="text"
                      value={manualDeptName}
                      onChange={(e) => setManualDeptName(e.target.value)}
                      placeholder="Enter custom department name..."
                      className="flex-grow p-3 bg-bg-hover border-none rounded-xl text-sm focus:ring-2 focus:ring-superior/20 transition-all outline-none"
                    />
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Description</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-4 bg-bg-hover border-none rounded-2xl text-sm focus:ring-2 focus:ring-superior/20 transition-all outline-none h-32"
                placeholder="Provide context and rules for this election..."
              ></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Start Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-4 bg-bg-hover border-none rounded-2xl text-sm focus:ring-2 focus:ring-superior/20 transition-all outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">End Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-4 bg-bg-hover border-none rounded-2xl text-sm focus:ring-2 focus:ring-superior/20 transition-all outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-bg-hover rounded-2xl">
              <label className="flex-grow">
                <p className="text-sm font-bold text-text-main">Allow Admin Participation</p>
                <p className="text-[10px] text-text-muted">If enabled, administrators can also cast votes.</p>
              </label>
              <button 
                type="button"
                onClick={() => setAllowAdminVote(!allowAdminVote)}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${allowAdminVote ? 'bg-superior' : 'bg-gray-200'}`}
              >
                <div className={`w-4 h-4 bg-card rounded-full transition-transform ${allowAdminVote ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Email Restriction Pattern</label>
              <input
                type="text"
                value={allowedEmailPattern}
                onChange={(e) => setAllowedEmailPattern(e.target.value)}
                className="w-full p-4 bg-bg-hover border-none rounded-2xl text-sm font-mono focus:ring-2 focus:ring-superior/20 outline-none transition-all"
                placeholder="e.g. su92-bsitm-f22-{rollno}@gmail.com"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Secure Password (Optional)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-bg-hover border-none rounded-2xl text-sm focus:ring-2 focus:ring-superior/20 transition-all outline-none"
                placeholder="Leave blank for public access"
              />
            </div>
          </div>
          <div className="pt-6 flex gap-4">
            <button type="submit" className="flex-grow bg-superior text-white py-4 rounded-2xl font-black shadow-lg shadow-superior/20 hover:bg-superior-dark transition-all">Launch Election</button>
            <button type="button" onClick={() => navigate('/admin/elections')} className="px-8 py-4 bg-gray-100 text-text-muted rounded-2xl font-bold hover:bg-gray-200 transition-all">Cancel</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ManageCandidates() {
  const { id } = useParams();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [manifesto, setManifesto] = useState('');
  const [department, setDepartment] = useState('General');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, [id]);

  const fetchCandidates = async () => {
    const res = await axios.get(`/api/elections/${id}`);
    setCandidates(res.data.candidates);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`/api/elections/${id}/candidates`, { name, bio, manifesto, image_url: imageUrl, department });
      setName('');
      setBio('');
      setManifesto('');
      setDepartment('General');
      setImageUrl('');
      fetchCandidates();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <div className="bg-card p-8 rounded-[2.5rem] border border-border-color shadow-sm sticky top-28">
          <h2 className="text-xl font-black mb-6">Add Candidate</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <input
              type="text"
              required
              placeholder="Candidate Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-4 bg-bg-hover border-none rounded-2xl text-sm focus:ring-2 focus:ring-superior/20 outline-none"
            />
            <input
              type="text"
              required
              placeholder="Department (e.g. BSCS)"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full p-4 bg-bg-hover border-none rounded-2xl text-sm focus:ring-2 focus:ring-superior/20 outline-none"
            />
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">Candidate Photo</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-bg-hover border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                  {imageUrl ? <img src={imageUrl} className="w-full h-full object-cover" /> : <Plus className="text-gray-300" />}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="text-[10px] text-text-muted file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-superior/10 file:text-superior hover:file:bg-superior/20"
                />
              </div>
            </div>
            <textarea
              required
              placeholder="Candidate Short Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-4 bg-bg-hover border-none rounded-2xl text-sm focus:ring-2 focus:ring-superior/20 outline-none h-24 resize-none"
            ></textarea>
            <textarea
              placeholder="Full Manifesto / Platform (Markdown supported)"
              value={manifesto}
              onChange={(e) => setManifesto(e.target.value)}
              className="w-full p-4 bg-bg-hover border-none rounded-2xl text-sm focus:ring-2 focus:ring-superior/20 outline-none h-32 resize-none"
            ></textarea>
            <button type="submit" disabled={loading} className="w-full bg-superior text-white py-3 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-superior-dark shadow-lg shadow-superior/20 transition-all">
              <UserPlus size={18} /> {loading ? 'Adding...' : 'Add Candidate'}
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <h2 className="text-xl font-black flex items-center gap-2">
          <Award size={20} className="text-superior" />
          Nominated Candidates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {candidates.map((candidate) => (
            <div key={candidate.id} className="p-6 bg-card rounded-3xl border border-border-color shadow-sm flex items-start gap-4 group">
              {candidate.image_url ? (
                <img src={candidate.image_url} alt={candidate.name} className="w-14 h-14 rounded-2xl object-cover border border-border-color shadow-sm" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-300">
                  <User size={24} />
                </div>
              )}
              <div className="flex-grow">
                <h4 className="font-black text-text-main group-hover:text-superior transition-colors">{candidate.name}</h4>
                <p className="text-xs text-text-muted mt-1 leading-relaxed line-clamp-2">{candidate.bio}</p>
              </div>
            </div>
          ))}
          {candidates.length === 0 && <p className="text-center text-text-muted py-20 bg-bg-hover rounded-[2.5rem] border-2 border-dashed border-border-color md:col-span-2">No candidates added yet.</p>}
        </div>
      </div>
    </div>
  );
}

function AdminVotersList() {
  const { id } = useParams();
  const [voters, setVoters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/admin/voters/${id}`).then(res => {
      setVoters(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    });
  }, [id]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Participation Log", 14, 15);
    (doc as any).autoTable({
      head: [['Student', 'Email', 'Department', 'Timestamp']],
      body: voters.map(v => [v.username, v.email, v.department || 'N/A', new Date(v.timestamp).toLocaleString()]),
      startY: 20,
    });
    doc.save(`Voters_Log_Election_${id}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-text-main">Participation Log</h2>
          <p className="text-text-muted text-sm">Detailed list of students who have cast their votes.</p>
        </div>
        <button 
          onClick={handleExportPDF}
          className="bg-card border border-border-color px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-bg-hover flex items-center gap-2"
        >
          <FileText size={18} className="text-red-500" /> Export PDF
        </button>
      </div>
      
      <div className="bg-card rounded-[2.5rem] border border-border-color shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-20 italic text-text-muted animate-pulse font-black uppercase tracking-widest text-xs">Decrypting Participation Data...</div>
        ) : voters.length === 0 ? (
          <div className="text-center py-32 text-text-muted">
            <Lock size={48} className="mx-auto mb-4 opacity-10" />
            <p>No votes recorded for this election yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-[0.15em] text-text-muted border-b border-gray-50">
                  <th className="px-8 py-5">Student</th>
                  <th className="px-6 py-5">Department</th>
                  <th className="px-6 py-5">Candidate</th>
                  <th className="px-8 py-5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {voters.map((voter, idx) => (
                  <tr key={idx} className="hover:bg-bg-hover transition-colors">
                    <td className="px-8 py-5">
                      <p className="font-bold text-sm text-text-main">{voter.username}</p>
                      <p className="text-[10px] text-text-muted">{voter.email}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] px-2 py-1 bg-gray-100 rounded font-black text-text-muted uppercase">
                        {voter.department || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <span className="text-xs font-bold text-text-main">{voter.candidate_name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right text-[10px] font-bold text-text-muted uppercase tabular-nums">
                      {new Date(voter.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function AccountRequestManagement() {
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchRequests = async () => {
    try {
      const res = await axios.get('/api/admin/account-requests');
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch account requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    if (!window.confirm(`Are you sure you want to ${action} this request?`)) return;
    
    setActionLoading(id);
    try {
      await axios.post(`/api/admin/account-requests/${id}/${action}`);
      await fetchRequests();
      alert(`Account request ${action}d successfully!`);
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${action} account request`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-text-main">Account Requests</h2>
          <p className="text-text-muted text-sm">Review and manage pending student account registration requests.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="text-center py-20 animate-pulse font-black uppercase tracking-widest text-xs text-text-muted">Loading Requests...</div>
        ) : requests.length === 0 ? (
          <div className="bg-card p-20 rounded-[2.5rem] border-2 border-dashed border-border-color text-center">
            <UserCheck size={48} className="mx-auto mb-4 opacity-10" />
            <p className="text-text-muted">No pending account requests found.</p>
          </div>
        ) : (
          requests.map((req) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={req.id} 
              className="bg-card p-8 rounded-[2.5rem] border border-border-color shadow-sm hover:shadow-xl hover:shadow-superior/5 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-8 group"
            >
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-superior/10 text-superior rounded-[1.5rem] flex items-center justify-center font-black text-xl shrink-0 group-hover:scale-110 transition-transform">
                  {req.username.charAt(0).toUpperCase()}
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-text-main">{req.username}</h3>
                  <div className="flex flex-wrap gap-y-2 gap-x-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-text-muted">
                      <Mail size={14} className="text-superior" />
                      {req.email}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-text-muted">
                      <Database size={14} className="text-secondary" />
                      {req.registration_number}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-text-muted">
                      <Users size={14} className="text-indigo-500" />
                      {req.department}
                    </div>
                  </div>
                  <p className="text-[10px] text-text-muted font-black uppercase tracking-widest pt-2 flex items-center gap-2">
                    <Clock size={12} />
                    Requested on {new Date(req.createdAt).toLocaleDateString()} at {new Date(req.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-gray-50">
                <button
                  disabled={actionLoading === req.id}
                  onClick={() => handleAction(req.id, 'reject')}
                  className="flex-1 md:flex-none px-6 py-3 bg-red-50 text-red-500 rounded-2xl text-sm font-black hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                >
                  <XCircle size={18} /> Reject
                </button>
                <button
                  disabled={actionLoading === req.id}
                  onClick={() => handleAction(req.id, 'approve')}
                  className="flex-1 md:flex-none px-8 py-3 bg-superior text-white rounded-2xl text-sm font-black shadow-lg shadow-superior/20 hover:bg-superior-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 size={18} /> {actionLoading === req.id ? 'Processing...' : 'Approve'}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

