import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, Info, CheckCircle2, User as UserIcon, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import Countdown from '../components/Countdown';

interface Candidate {
  id: string;
  name: string;
  bio: string;
  manifesto?: string;
  department?: string;
  image_url?: string;
}

interface Election {
  id: string;
  title: string;
  description: string;
  end_date: string;
  password?: string;
  candidates: Candidate[];
}

export default function Vote() {
  const { electionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [election, setElection] = useState<Election | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [electionPassword, setElectionPassword] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [voted, setVoted] = useState(false);
  const [receipt, setReceipt] = useState('');
  const [error, setError] = useState('');
  const [viewingCandidate, setViewingCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    fetchElectionDetails();
  }, [electionId]);

  const fetchElectionDetails = async () => {
    try {
      const res = await axios.get(`/api/elections/${electionId}`);
      setElection(res.data);
      if (!res.data.password) {
        setIsVerified(true);
      }
    } catch (err) {
      console.error('Failed to fetch election details', err);
      setError('Could not load election details.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`/api/elections/${electionId}/verify`, { password: electionPassword });
      if (res.data.success) {
        setIsVerified(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Incorrect election password.');
    }
  };

  const handleVote = async () => {
    if (!selectedCandidate) return;

    setSubmitting(true);
    setError('');
    try {
      const res = await axios.post('/api/vote', {
        election_id: electionId,
        candidate_id: selectedCandidate
      });
      setReceipt(res.data.receipt_hash);
      setVoted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cast vote. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-superior"></div></div>;
  if (!election) return <div className="text-center py-12 text-gray-500">Election not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-text-muted hover:text-superior transition-colors group font-bold text-sm">
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </Link>

      <div className="bg-card rounded-[2.5rem] shadow-sm border border-border-color overflow-hidden">
        <div className="p-8 border-b border-border-color bg-superior/5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-black text-text-main mb-2 tracking-tight">{election.title}</h1>
              <p className="text-text-muted font-medium leading-relaxed">{election.description}</p>
            </div>
            {isVerified && !voted && (
              <div className="bg-card p-4 rounded-2xl border border-superior/20 shadow-sm">
                <Countdown targetDate={election.end_date} onEnd={() => window.location.reload()} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-superior font-medium">
            <ShieldCheck size={18} />
            <span>Secure Voting System • Your identity is encrypted</span>
          </div>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {!isVerified ? (
              <motion.div
                key="verify"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-md mx-auto py-8 text-center"
              >
                <div className="mb-6">
                  <div className="mx-auto w-16 h-16 bg-superior/10 text-superior rounded-full flex items-center justify-center mb-4">
                    <ShieldCheck size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Election Password</h2>
                  <p className="text-gray-500 mt-2">This election is password-protected. Please enter the password provided by the administrator.</p>
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 p-4 rounded-2xl text-sm mb-6 flex items-center gap-3 justify-center border border-red-100 dark:border-red-500/20">
                    <AlertCircle size={18} />
                    <p className="font-bold">{error}</p>
                  </div>
                )}

                <form onSubmit={handleVerifyPassword} className="space-y-4">
                  <input
                    type="password"
                    required
                    value={electionPassword}
                    onChange={(e) => setElectionPassword(e.target.value)}
                    placeholder="Enter Election Password"
                    className="w-full p-4 rounded-2xl bg-bg-hover border border-transparent focus:border-superior/30 focus:ring-4 focus:ring-superior/5 outline-none transition-all text-center font-black tracking-widest text-text-main"
                  />
                  <button
                    type="submit"
                    className="w-full bg-superior text-white py-4 rounded-2xl font-black shadow-lg shadow-superior/20 hover:bg-superior-dark transition-all"
                  >
                    Enter Election
                  </button>
                </form>
              </motion.div>
            ) : !voted ? (
              <motion.div
                key="voting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                 <div className="flex items-center gap-2 text-text-muted mb-6 bg-bg-hover/50 p-4 rounded-2xl border border-border-color/50">
                  <Info size={18} className="text-superior" />
                  <span className="text-xs font-bold uppercase tracking-wide">Select one candidate from the list below to cast your vote.</span>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 text-sm mb-6">
                    <AlertCircle size={20} />
                    <p>{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {election.candidates.map((candidate) => (
                    <button
                      key={candidate.id}
                      onClick={() => setSelectedCandidate(candidate.id)}
                      className={`relative p-8 rounded-[2.5rem] border-2 text-left transition-all group overflow-hidden ${
                        selectedCandidate === candidate.id
                          ? 'border-superior bg-superior/5 shadow-xl shadow-superior/10'
                          : 'border-border-color bg-card hover:border-superior-light hover:bg-bg-hover'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                         {candidate.image_url ? (
                          <img src={candidate.image_url} alt={candidate.name} className="w-20 h-20 rounded-[1.5rem] object-cover border-4 border-card shadow-lg group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className={`w-20 h-20 rounded-[1.5rem] transition-all flex-shrink-0 flex items-center justify-center ${
                            selectedCandidate === candidate.id ? 'bg-superior text-white scale-105' : 'bg-bg-hover text-text-muted group-hover:bg-superior/10 group-hover:text-superior'
                          }`}>
                            <UserIcon size={32} />
                          </div>
                        )}
                        <div>
                           <h3 className={`font-black text-xl mb-1 transition-colors tracking-tight ${
                            selectedCandidate === candidate.id ? 'text-superior' : 'text-text-main group-hover:text-superior'
                          }`}>
                            {candidate.name}
                          </h3>
                           <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-black bg-superior/10 text-superior px-3 py-1 rounded-full uppercase tracking-widest">{candidate.department || 'General'}</span>
                          </div>
                          <p className="text-sm text-text-muted line-clamp-2 leading-relaxed">{candidate.bio}</p>
                          {candidate.manifesto && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setViewingCandidate(candidate); }}
                              className="mt-2 text-xs font-bold text-superior hover:underline flex items-center gap-1"
                            >
                              <Info size={12} /> Read Manifesto
                            </button>
                          )}
                        </div>
                      </div>
                       {selectedCandidate === candidate.id && (
                        <div className="absolute top-6 right-6 text-superior animate-bounce">
                          <CheckCircle2 size={32} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                 <div className="mt-12 pt-8 border-t border-border-color flex flex-col items-center">
                  <p className="text-sm text-text-muted mb-6 font-medium">
                    Logged in as <span className="font-black text-text-main">{user?.username}</span> • Final action cannot be undone.
                  </p>
                  <button
                    disabled={!selectedCandidate || submitting}
                    onClick={handleVote}
                    className="w-full md:w-64 bg-superior text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-superior/30 hover:bg-superior-dark hover:scale-105 transition-all active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
                  >
                    {submitting ? 'Casting Vote...' : 'Confirm Vote'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="voted"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center space-y-6"
              >
                <div className="mx-auto w-24 h-24 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/10">
                  <CheckCircle2 size={56} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-text-main tracking-tight">Vote Cast Successfully!</h2>
                  <p className="text-text-muted mt-2 max-w-sm mx-auto font-medium leading-relaxed">
                    Your contribution to Superior University's democratic process has been recorded and encrypted.
                  </p>
                </div>

                <div className="max-w-md mx-auto p-8 bg-bg-hover rounded-[2.5rem] border border-dashed border-border-color">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4">Your Vote Receipt</p>
                  <p className="font-mono text-xl font-black text-superior select-all break-all uppercase tracking-tighter">{receipt}</p>
                  <p className="text-[10px] text-text-muted mt-6 leading-relaxed font-bold">
                    IMPORTANT: Save this receipt ID. You can use it to verify that your vote was counted correctly in the final audit.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-4 pt-8">
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="bg-superior text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-superior/20 hover:bg-superior-dark transition-all"
                  >
                    Back to Dashboard
                  </button>
                  <p className="text-xs text-text-muted font-bold uppercase tracking-widest animate-pulse">Self-destructing session in 30 seconds...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {viewingCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingCandidate(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-card w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-border-color"
            >
              <div className="p-8 border-b border-border-color bg-superior/5 flex items-center gap-6">
                {viewingCandidate.image_url ? (
                  <img src={viewingCandidate.image_url} alt={viewingCandidate.name} className="w-24 h-24 rounded-3xl object-cover border-4 border-card shadow-lg" />
                ) : (
                  <div className="w-24 h-24 bg-card rounded-3xl flex items-center justify-center text-superior shadow-lg border border-border-color">
                    <UserIcon size={36} />
                  </div>
                )}
                <div>
                  <h3 className="text-3xl font-black text-text-main tracking-tight">{viewingCandidate.name}</h3>
                  <p className="text-superior font-black uppercase tracking-[0.2em] text-[10px]">{viewingCandidate.department || 'General Representative'}</p>
                </div>
              </div>
              <div className="p-8 max-h-[60vh] overflow-y-auto">
                <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4">Manifesto & Platform</h4>
                <div className="text-text-main leading-relaxed whitespace-pre-wrap font-medium">
                  {viewingCandidate.manifesto || "No detailed manifesto provided by this candidate."}
                </div>
              </div>
              <div className="p-8 bg-bg-hover/30 border-t border-border-color flex justify-end">
                <button 
                  onClick={() => setViewingCandidate(null)}
                  className="px-10 py-4 bg-card border border-border-color rounded-2xl font-black text-text-muted hover:bg-bg-hover transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
