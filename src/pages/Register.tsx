import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User as UserIcon, AlertCircle, Info, CheckCircle2, Building2, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';

interface Department {
  id: string;
  name: string;
  code: string;
}

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get('/api/auth/departments');
        setDepartments(res.data);
      } catch (err) {
        console.error('Failed to load departments', err);
      }
    };
    fetchDepartments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const selectedDept = departments.find(d => d.name === department);
    if (selectedDept && !registrationNumber.toUpperCase().includes(selectedDept.code.toUpperCase())) {
      setError(`Registration number must contain '${selectedDept.code}' for ${department} department.`);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      await axios.post('/api/auth/request-account', {
        username,
        email,
        password,
        registration_number: registrationNumber,
        department,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-superior-bg min-h-[calc(100vh-100px)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full space-y-6 bg-white p-10 rounded-2xl shadow-xl shadow-superior/5 text-center"
        >
          <div className="mx-auto h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-800">Request Submitted!</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Your account request has been submitted and is <strong>pending administrator approval</strong>. You will be able to log in once an admin approves your request.
          </p>
          <Link
            to="/login"
            className="inline-block w-full py-3 px-4 text-sm font-semibold rounded-lg text-white bg-superior hover:bg-superior-dark transition-all shadow-md"
          >
            Back to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-superior-bg min-h-[calc(100vh-100px)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl shadow-superior/5"
      >
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-superior rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-superior/20">
            <UserPlus size={32} />
          </div>
          <h2 className="text-3xl font-extrabold text-superior tracking-tight">Request Account</h2>
          <p className="mt-2 text-sm text-gray-500">
            Submit a request to join the Superior University voting system
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-center gap-3 text-red-700 text-sm">
            <AlertCircle size={20} className="flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <UserIcon size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-superior focus:border-transparent transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Registration Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Info size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-superior focus:border-transparent transition-all"
                  placeholder="SU92-BSIT-F22-000"
                />
              </div>
              {department && departments.find(d => d.name === department) && (
                <p className="mt-1 text-[10px] text-superior font-bold uppercase tracking-wider animate-pulse">
                  Required Format: SU92-{departments.find(d => d.name === department)?.code}-FXX-XXX
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-superior focus:border-transparent transition-all"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Building2 size={18} />
                </div>
                <select
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-superior focus:border-transparent transition-all appearance-none bg-white"
                >
                  <option value="">Select your department...</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.name}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                  <ChevronDown size={18} />
                </div>
              </div>
              {departments.length === 0 && (
                <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                  <Info size={12} /> No departments available. Contact admin.
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-superior focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-superior hover:bg-superior-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-superior transition-all disabled:opacity-50 shadow-md"
          >
            {loading ? 'Submitting Request...' : 'Submit Account Request'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-superior hover:text-superior-dark underline transition-colors">
              Log in here
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
