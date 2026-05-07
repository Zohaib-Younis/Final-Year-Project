import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  Download, 
  User, 
  Mail, 
  GraduationCap, 
  FileText,
  MoreVertical,
  ChevronRight
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

// Add an ErrorBoundary to catch runtime crashes and display them
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 max-w-2xl mx-auto mt-20 bg-red-50 border-2 border-red-500 rounded-2xl text-red-900">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">Admin Page Error</h2>
          <p className="mb-4">Something went wrong while rendering the Candidate Requests page.</p>
          <pre className="bg-white p-4 rounded text-sm overflow-auto font-mono text-red-800">
            {this.state.error?.toString()}
            {"\n\n"}
            {this.state.error?.stack}
          </pre>
          <button onClick={() => window.location.reload()} className="mt-6 px-4 py-2 bg-red-600 text-white rounded font-bold">
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function CandidateRequestsContent() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const { user } = useAuth();
  const { settings } = useSettings();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await axios.get('/api/candidates/all');
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch requests', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await axios.put(`/api/candidates/${id}/status`, { 
        status, 
        admin_notes: adminNotes 
      });
      setSelectedRequest(null);
      setAdminNotes('');
      fetchRequests();
      alert(`Application ${status} successfully.`);
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const downloadPDF = (request: any) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(79, 70, 229); // Superior color
    doc.rect(0, 0, 210, 40, 'F');
    
    // Logo in header if available
    if (settings?.appLogo) {
      try {
        // Use a rounded rect instead of clip to be safer across jspdf versions
        doc.addImage(settings.appLogo, 14, 10, 20, 20);
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text(settings.appName || "Superior Voting System", 40, 25);
      } catch (e) {
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text(settings.appName || "Superior Voting System", 14, 25);
      }
    } else {
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text(settings.appName || "Superior Voting System", 14, 25);
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Candidate Application Form", 14, 35); // Moved down to 35 for better spacing
    
    // Status Badge
    const statusColor = request.status === 'approved' ? [16, 185, 129] : request.status === 'rejected' ? [239, 68, 68] : [245, 158, 11];
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.roundedRect(150, 15, 45, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(String(request.status || 'PENDING').toUpperCase(), 172.5, 21.5, { align: 'center' });

    // Candidate Photo
    if (request.picture_url) {
      try {
        // Auto-detect format from data URL
        doc.addImage(request.picture_url, 150, 55, 40, 40);
      } catch (e) {
        console.error("Failed to add image to PDF", e);
      }
    }

    // Details Table
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text("Personal Information", 14, 55);
    
    autoTable(doc, {
      startY: 60,
      head: [['Field', 'Information']],
      body: [
        ['Full Name', String(request.name || 'N/A')],
        ['Father\'s Name', String(request.father_name || 'N/A')],
        ['Email', String(request.email || 'N/A')],
        ['Registration No', String(request.registration_number || 'N/A')],
        ['CNIC Number', String(request.cnic_number || 'N/A')],
        ['Department', String(request.department?.name || 'N/A')],
        ['Department Code', String(request.department?.code || 'N/A')],
        ['Semester', String(request.semester || 'N/A')],
        ['CGPA', String(request.cgpa || '0')],
        ['GPA', String(request.gpa || '0')],
        ['Applied At', request.applied_at ? new Date(request.applied_at).toLocaleString() : 'N/A'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }, // Correct color format
      margin: { left: 14, right: 70 }
    });

    if (request.admin_notes) {
      const finalY = (doc as any).lastAutoTable?.finalY || 150;
      doc.setFontSize(14);
      doc.text("Admin Decision Notes", 14, finalY + 15);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(request.admin_notes, 14, finalY + 25, { maxWidth: 180 });
    }

    doc.save(`Candidate_${request.registration_number}.pdf`);
  };

  const filteredRequests = requests.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || 
                         r.registration_number.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || r.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-text-main">Candidate Requests</h2>
          <p className="text-text-muted">Review and process applications for election candidacy.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or reg no..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-12 pr-6 py-3 bg-card border border-border-color rounded-2xl text-sm outline-none focus:border-superior/50 w-full sm:w-64 transition-all"
            />
          </div>
          <select 
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="px-6 py-3 bg-card border border-border-color rounded-2xl text-sm font-bold outline-none w-full sm:w-auto"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-card rounded-[2.5rem] border border-border-color shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-[0.15em] text-text-muted border-b border-border-color">
                <th className="px-8 py-6">Candidate</th>
                <th className="px-6 py-6">Department</th>
                <th className="px-6 py-6">Academic Status</th>
                <th className="px-6 py-6">Submission</th>
                <th className="px-6 py-6">Status</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color/30">
              {filteredRequests.map((req) => (
                <tr key={req._id} className="hover:bg-bg-hover/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <img src={req.picture_url} className="w-12 h-12 rounded-2xl object-cover border border-border-color" />
                      <div>
                        <p className="text-sm font-black text-text-main">{req.name}</p>
                        <p className="text-[10px] font-bold text-superior uppercase tracking-widest">{req.registration_number}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-superior/10 text-superior rounded-lg flex items-center justify-center font-bold text-xs uppercase">
                        {req.department?.name?.charAt(0) || 'D'}
                      </div>
                      <span className="text-xs font-bold text-text-main">
                        {req.department?.name || 'N/A'} 
                        {req.department?.code ? ` (${req.department.code})` : ''}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-xs font-black text-emerald-500">{req.cgpa} CGPA</td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <p className="text-xs font-bold text-text-main">{new Date(req.applied_at).toLocaleDateString()}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">{new Date(req.applied_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      req.status === 'approved' ? 'bg-emerald-50 text-emerald-500' :
                      req.status === 'rejected' ? 'bg-red-50 text-red-500' :
                      'bg-amber-50 text-amber-500'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => downloadPDF(req)}
                        className="p-2 text-text-muted hover:text-superior hover:bg-bg-hover rounded-xl transition-all"
                        title="Download Data PDF"
                      >
                        <FileText size={18} />
                      </button>
                      <button 
                        onClick={() => setSelectedRequest(req)}
                        className="bg-superior text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-superior/20 hover:bg-superior-dark transition-all"
                      >
                        Review
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRequests.length === 0 && !loading && (
            <div className="p-20 text-center text-text-muted italic">
              No candidate requests found.
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div onClick={() => setSelectedRequest(null)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <div className="bg-card w-full max-w-4xl rounded-[2.5rem] border border-border-color shadow-2xl relative z-10 overflow-hidden flex flex-col md:flex-row">
            {/* Left Sidebar Info */}
            <div className="w-full md:w-80 bg-bg-hover/50 p-8 border-r border-border-color flex flex-col items-center text-center">
              <img src={selectedRequest.picture_url} className="w-48 h-48 rounded-[2rem] object-cover border-4 border-card shadow-xl mb-6" />
              <h3 className="text-2xl font-black text-text-main">{selectedRequest.name}</h3>
              <p className="text-superior font-black text-[10px] uppercase tracking-widest mt-1">{selectedRequest.registration_number}</p>
              <div className="mt-8 space-y-4 w-full">
                <div className="p-4 bg-card rounded-2xl border border-border-color text-left">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Father's Name</p>
                  <p className="text-sm font-black text-text-main">{selectedRequest.father_name}</p>
                </div>
                <div className="p-4 bg-card rounded-2xl border border-border-color text-left">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Email Address</p>
                  <p className="text-sm font-black text-text-main truncate">{selectedRequest.email}</p>
                </div>
              </div>
            </div>
            
            {/* Right Content */}
            <div className="flex-grow p-10 flex flex-col">
              <div className="flex justify-between items-start mb-10">
                <h3 className="text-2xl font-black flex items-center gap-3">
                  <GraduationCap className="text-superior" /> Application Review
                </h3>
                <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-bg-hover rounded-full transition-colors"><XCircle size={24} className="text-text-muted" /></button>
              </div>
              
              <div className="grid grid-cols-2 gap-8 mb-10">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Department</p>
                  <p className="text-lg font-black text-text-main">{selectedRequest.department?.name || 'N/A'}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Academic Standing</p>
                  <p className="text-lg font-black text-emerald-500">{selectedRequest.cgpa} CGPA <span className="text-text-muted text-xs font-medium ml-2">({selectedRequest.semester} Semester)</span></p>
                </div>
              </div>

              <div className="flex-grow">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 block">Decision Notes / Feedback</label>
                <textarea 
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="Enter notes for the student (reason for rejection or next steps)..."
                  className="w-full h-32 p-4 bg-bg-hover rounded-2xl border border-transparent focus:border-superior/30 outline-none resize-none font-medium text-sm text-text-main"
                />
              </div>

              <div className="mt-8 pt-8 border-t border-border-color flex gap-4">
                <button 
                  onClick={() => handleUpdateStatus(selectedRequest._id, 'approved')}
                  className="flex-grow bg-emerald-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={20} /> Approve Application
                </button>
                <button 
                  onClick={() => handleUpdateStatus(selectedRequest._id, 'rejected')}
                  className="flex-grow bg-red-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                >
                  <XCircle size={20} /> Reject Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CandidateRequests() {
  return (
    <ErrorBoundary>
      <CandidateRequestsContent />
    </ErrorBoundary>
  );
}
