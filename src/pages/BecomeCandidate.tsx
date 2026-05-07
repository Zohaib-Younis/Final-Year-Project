import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  User, 
  Mail, 
  Shield, 
  CreditCard, 
  Image as ImageIcon, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ChevronLeft,
  GraduationCap,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Add an ErrorBoundary to catch runtime crashes and display them
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 max-w-2xl mx-auto mt-20 bg-red-50 border-2 border-red-500 rounded-2xl text-red-900">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><AlertCircle /> Application Error</h2>
          <p className="mb-4">Something went wrong while rendering the Become Candidate page.</p>
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

function BecomeCandidateContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingStatus, setFetchingStatus] = useState(true);
  const [existingRequest, setExistingRequest] = useState<any>(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: user?.username || '',
    father_name: '',
    semester: '',
    department: '',
    gpa: '',
    cgpa: '',
    email: user?.email || '',
    registration_number: user?.registration_number || '',
    cnic_number: '',
    picture_url: ''
  });

  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    fetchDepartments();
    checkRequestStatus();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await axios.get('/api/candidates/departments');
      const depts = Array.isArray(res.data) ? res.data : [];
      setDepartments(depts);
      
      // Auto-select user's department and pre-fill registration number
      if (user) {
        const updates: any = {};
        if (user.department) {
          const userDept = depts.find((d: any) => d.name === user.department);
          if (userDept) {
            updates.department = userDept.id || userDept._id;
          }
        }
        if (user.registration_number) {
          updates.registration_number = user.registration_number;
        }
        
        if (Object.keys(updates).length > 0) {
          setFormData(prev => ({ ...prev, ...updates }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch departments', err);
    }
  };

  const checkRequestStatus = async () => {
    try {
      const res = await axios.get('/api/candidates/my-request');
      console.log('My request data:', res.data);
      if (res.data && Object.keys(res.data).length > 0) {
        setExistingRequest(res.data);
      } else {
        setExistingRequest(null);
      }
    } catch (err) {
      console.error('Failed to check request status', err);
    } finally {
      setFetchingStatus(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreview(base64String);
        setFormData({ ...formData, picture_url: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (parseFloat(formData.cgpa) < 3.0) {
      setError('You are not eligible. Minimum CGPA requirement is 3.0.');
      return;
    }

    if (!formData.picture_url) {
      setError('Please upload a profile picture.');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/candidates/apply', formData);
      checkRequestStatus();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingStatus) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-superior"></div></div>;
  }

  if (existingRequest && existingRequest._id) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 px-4 sm:px-0">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-text-muted hover:text-superior transition-colors font-black text-xs uppercase tracking-widest">
          <ChevronLeft size={20} /> Back to Dashboard
        </Link>

        <div className="bg-card p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] border border-border-color shadow-2xl text-center space-y-8">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${
            existingRequest.status === 'approved' ? 'bg-emerald-50 text-emerald-500' :
            existingRequest.status === 'rejected' ? 'bg-red-50 text-red-500' :
            'bg-superior/10 text-superior'
          }`}>
            {existingRequest.status === 'approved' ? <CheckCircle2 size={48} /> : 
             existingRequest.status === 'rejected' ? <AlertCircle size={48} /> :
             <Shield size={48} className="animate-pulse" />}
          </div>
          
          <div>
            <h2 className="text-3xl font-black text-text-main mb-2">Application {existingRequest.status ? String(existingRequest.status).charAt(0).toUpperCase() + String(existingRequest.status).slice(1) : ''}</h2>
            <p className="text-text-muted max-w-md mx-auto">
              {existingRequest.status === 'pending' ? 'Your candidacy application is currently being reviewed by the Election Commission.' :
               existingRequest.status === 'approved' ? 'Congratulations! Your candidacy has been approved. You will now appear in the elections.' :
               'Unfortunately, your candidacy application was not approved at this time.'}
            </p>
          </div>

          {existingRequest.admin_notes && (
            <div className="bg-bg-hover p-6 rounded-2xl border border-border-color text-left max-w-2xl mx-auto">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Reviewer Feedback</p>
              <p className="text-sm font-medium text-text-main">{existingRequest.admin_notes}</p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto pt-4">
            <div className="p-4 bg-bg-hover rounded-2xl">
              <p className="text-[10px] font-black text-text-muted uppercase mb-1">CGPA</p>
              <p className="text-lg font-black text-text-main">{existingRequest.cgpa}</p>
            </div>
            <div className="p-4 bg-bg-hover rounded-2xl">
              <p className="text-[10px] font-black text-text-muted uppercase mb-1">Semester</p>
              <p className="text-lg font-black text-text-main">{existingRequest.semester}</p>
            </div>
            <div className="p-4 bg-bg-hover rounded-2xl">
              <p className="text-[10px] font-black text-text-muted uppercase mb-1">Applied On</p>
              <p className="text-sm font-black text-text-main">{existingRequest.applied_at ? new Date(existingRequest.applied_at).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div className="p-4 bg-bg-hover rounded-2xl">
              <p className="text-[10px] font-black text-text-muted uppercase mb-1">Department</p>
              <p className="text-sm font-black text-text-main truncate">{existingRequest.department?.name || 'N/A'}</p>
            </div>
          </div>
          
          <button onClick={() => navigate('/dashboard')} className="w-full bg-superior text-white py-4 rounded-2xl font-black shadow-lg shadow-superior/20">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 sm:px-0 pb-12">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-text-muted hover:text-superior transition-colors font-black text-xs uppercase tracking-widest">
        <ChevronLeft size={20} /> Back to Dashboard
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-text-main tracking-tight">Become a Candidate</h1>
          <p className="text-text-muted mt-2 font-medium leading-relaxed">Fill out the application form to stand in the upcoming elections.</p>
        </div>
        <div className="bg-card px-6 py-3 rounded-2xl border border-border-color shadow-sm w-full md:w-auto">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Minimum Eligibility</p>
          <p className="text-sm font-black text-superior mt-1">CGPA 3.0 or higher</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Picture Section */}
          <div className="lg:col-span-1">
            <div className="bg-card p-8 rounded-[2.5rem] border border-border-color shadow-sm text-center">
              <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-6">Profile Picture</h3>
              <div className="relative group cursor-pointer mx-auto w-48 h-48 mb-6">
                <div className="w-full h-full rounded-[2.5rem] bg-bg-hover flex items-center justify-center overflow-hidden border-2 border-dashed border-border-color group-hover:border-superior/50 transition-all">
                  {preview ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-text-muted">
                      <ImageIcon size={48} className="mx-auto mb-2 opacity-20" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Upload Photo</p>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <p className="text-xs text-text-muted leading-relaxed">Required for identification on the ballot.</p>
            </div>
          </div>

          {/* Form Content Section */}
          <div className="lg:col-span-2">
            <div className="bg-card p-10 rounded-[2.5rem] border border-border-color shadow-sm space-y-8">
              <div className="space-y-6">
                <h3 className="text-xl font-black flex items-center gap-2">
                  <User size={24} className="text-superior" /> Personal Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField 
                    label="Candidate Name" 
                    icon={<User size={14} />} 
                    value={formData.name} 
                    onChange={(e: any) => setFormData({...formData, name: e.target.value})}
                    required 
                  />
                  <InputField 
                    label="Father's Name" 
                    icon={<User size={14} />} 
                    value={formData.father_name} 
                    onChange={(e: any) => setFormData({...formData, father_name: e.target.value})}
                    required 
                  />
                  <InputField 
                    label="CNIC Number" 
                    icon={<CreditCard size={14} />} 
                    value={formData.cnic_number} 
                    onChange={(e: any) => setFormData({...formData, cnic_number: e.target.value})}
                    placeholder="00000-0000000-0"
                    required 
                  />
                  <InputField 
                    label="University Email" 
                    icon={<Mail size={14} />} 
                    type="email"
                    value={formData.email} 
                    onChange={(e: any) => setFormData({...formData, email: e.target.value})}
                    required 
                  />
                </div>
              </div>

              <div className="h-px bg-border-color/50"></div>

              <div className="space-y-6">
                <h3 className="text-xl font-black flex items-center gap-2">
                  <GraduationCap size={24} className="text-superior" /> Academic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2 ml-1">
                      <Briefcase size={14} /> Department
                    </label>
                    <select 
                      className="w-full p-4 bg-bg-hover rounded-2xl border border-transparent focus:border-superior/30 outline-none transition-all text-text-main font-bold"
                      value={formData.department}
                      onChange={e => setFormData({...formData, department: e.target.value})}
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept.id || dept._id} value={dept.id || dept._id}>
                          {dept.name} {dept.code ? `(${dept.code})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <InputField 
                    label="Registration Number" 
                    icon={<Shield size={14} />} 
                    value={formData.registration_number} 
                    onChange={(e: any) => setFormData({...formData, registration_number: e.target.value})}
                    placeholder="e.g. F22-BSCS-000"
                    required 
                  />
                  <InputField 
                    label="Current Semester" 
                    icon={<Briefcase size={14} />} 
                    type="number"
                    min="1"
                    max="12"
                    value={formData.semester} 
                    onChange={(e: any) => setFormData({...formData, semester: e.target.value})}
                    required 
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <InputField 
                      label="Last GPA" 
                      type="number"
                      step="0.01"
                      min="0"
                      max="4"
                      value={formData.gpa} 
                      onChange={(e: any) => setFormData({...formData, gpa: e.target.value})}
                      required 
                    />
                    <InputField 
                      label="Total CGPA" 
                      type="number"
                      step="0.01"
                      min="0"
                      max="4"
                      value={formData.cgpa} 
                      onChange={(e: any) => setFormData({...formData, cgpa: e.target.value})}
                      required 
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 p-6 rounded-3xl flex items-center gap-4 border border-red-100 dark:border-red-500/20">
                  <AlertCircle size={24} />
                  <p className="font-bold text-sm">{error}</p>
                </div>
              )}

              <div className="pt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-superior text-white py-5 rounded-[2rem] font-black shadow-2xl shadow-superior/30 hover:bg-superior-dark transition-all disabled:opacity-50"
                >
                  {loading ? 'Submitting Application...' : 'Submit Candidacy Application'}
                </button>
                <p className="text-[10px] text-text-muted text-center mt-4 font-bold uppercase tracking-widest">By submitting, you agree to the University Election Rules & Guidelines.</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function InputField({ label, icon, ...props }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2 ml-1">
        {icon} {label}
      </label>
      <div className="relative">
        <input 
          {...props}
          className="w-full p-4 bg-bg-hover rounded-2xl border border-transparent focus:border-superior/30 focus:ring-4 focus:ring-superior/5 outline-none transition-all text-text-main font-bold placeholder:text-text-muted/40 placeholder:font-normal"
        />
      </div>
    </div>
  );
}

export default function BecomeCandidate() {
  return (
    <ErrorBoundary>
      <BecomeCandidateContent />
    </ErrorBoundary>
  );
}
