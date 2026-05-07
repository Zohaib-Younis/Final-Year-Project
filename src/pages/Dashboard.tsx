import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, Vote as VoteIcon, Clock, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import Countdown from '../components/Countdown';
import { useAuth } from '../context/AuthContext';

interface Election {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'closed';
}

export default function Dashboard() {
  const [elections, setElections] = useState<Election[]>([]);
  const [myVotes, setMyVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [electionsRes, votesRes] = await Promise.all([
        axios.get('/api/elections'),
        axios.get('/api/vote/my-votes')
      ]);
      
      // Filter elections for non-admin users
      const fetchedElections = electionsRes.data;
      const now = new Date();

      if (user?.role !== 'admin') {
        setElections(fetchedElections.filter((e: Election) => {
          const isStatusActive = e.status === 'active';
          const isNotExpired = new Date(e.end_date) > now;
          return isStatusActive && isNotExpired;
        }));
      } else {
        setElections(fetchedElections);
      }
      
      setMyVotes(votesRes.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-superior"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-text-main tracking-tight">
            {user?.role === 'admin' ? 'All Elections' : 'Active Elections'}
          </h1>
          <p className="text-text-muted mt-1">
            {user?.role === 'admin' 
              ? 'Manage and monitor all university elections.' 
              : 'Cast your vote and help shape the future of Superior University.'}
          </p>
        </div>
        <div className="bg-card px-4 py-2 rounded-2xl border border-border-color text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2 shadow-sm">
          <Clock size={16} className="text-superior animate-pulse" />
          <span>Live Tracking</span>
        </div>
      </div>

      {/* Candidacy Application CTA - Only for students */}
      {user?.role !== 'admin' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-superior text-white p-10 rounded-[2.5rem] shadow-2xl shadow-superior/30 overflow-hidden relative group"
        >
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-black tracking-tight mb-2">Want to lead the change?</h2>
              <p className="text-superior-light font-medium max-w-lg opacity-90">Apply now to become a candidate in the upcoming student body elections. Verify your eligibility and submit your manifesto today.</p>
            </div>
            <Link 
              to="/become-candidate"
              className="bg-white text-superior px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-all active:scale-95 whitespace-nowrap"
            >
              Apply for Candidacy
            </Link>
          </div>
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-card/5 rounded-full blur-3xl group-hover:bg-card/10 transition-all duration-700"></div>
          <div className="absolute -left-10 -top-10 w-48 h-48 bg-card/5 rounded-full blur-3xl"></div>
        </motion.div>
      )}

      {elections.length === 0 ? (
        <div className="bg-card rounded-[2.5rem] p-24 text-center border-2 border-dashed border-border-color">
          <VoteIcon size={64} className="mx-auto text-text-muted opacity-10 mb-6" />
          <h3 className="text-xl font-black text-text-main">
            {user?.role === 'admin' ? 'No elections found' : 'No active elections found'}
          </h3>
          <p className="text-text-muted mt-2">Check back later or contact your administrator.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {elections.map((election, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={election.id}
              className="bg-card rounded-[2.5rem] shadow-sm border border-border-color overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col group"
            >
              <div className="p-6 flex-grow">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-superior/10 text-superior rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <VoteIcon size={28} />
                  </div>
                  <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    election.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-bg-hover text-text-muted border border-border-color'
                  }`}>
                    {election.status}
                  </span>
                </div>
                <h3 className="text-xl font-black text-text-main mb-2 truncate" title={election.title}>
                  {election.title}
                </h3>
                <p className="text-text-muted text-sm mb-6 line-clamp-3 leading-relaxed">
                  {election.description}
                </p>
                
                <div className="space-y-4">
                  {election.status === 'active' && (
                    <div className="mb-4">
                      <Countdown targetDate={election.end_date} />
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
                    <Calendar size={14} className="text-superior" />
                    <span>Starts: {new Date(election.start_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-bg-hover/30 border-t border-border-color/50 flex gap-3">
                {(() => {
                  const hasVoted = myVotes.some(v => 
                    (typeof v.election_id === 'string' ? v.election_id === election.id.toString() : v.election_id?._id === election.id.toString())
                  );
                  const isExpired = new Date(election.end_date) <= new Date();
                  const isClosed = election.status === 'closed' || isExpired;

                  if (isClosed) {
                    return (
                      <Link
                        to={`/results/${election.id}`}
                        className="flex-grow flex items-center justify-center gap-2 bg-text-main text-background py-4 rounded-2xl font-black hover:opacity-90 transition-all"
                      >
                        View Results
                        <CheckCircle2 size={18} />
                      </Link>
                    );
                  }

                  if (hasVoted) {
                    return (
                      <div className="flex-grow flex items-center justify-center gap-2 bg-emerald-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-500/20">
                        <CheckCircle2 size={18} />
                        Voted
                      </div>
                    );
                  }

                  return (
                    <>
                      <Link
                        to={`/vote/${election.id}`}
                        className="flex-grow flex items-center justify-center gap-2 bg-superior text-white py-4 rounded-2xl font-black hover:bg-superior-dark transition-all shadow-lg shadow-superior/20"
                      >
                        Cast Vote
                        <ChevronRight size={18} />
                      </Link>
                      <Link
                        to={`/results/${election.id}`}
                        className="px-6 py-4 bg-card border border-border-color text-text-muted rounded-2xl font-black hover:bg-bg-hover transition-all"
                      >
                        Live
                      </Link>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {myVotes.length > 0 && (
        <div className="mt-20 space-y-8">
          <div>
            <h2 className="text-3xl font-black text-text-main tracking-tight">Your Voting History</h2>
            <p className="text-text-muted mt-1 font-medium">Proof of participation and cryptographic receipts.</p>
          </div>
          <div className="bg-card rounded-[2.5rem] border border-border-color shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted border-b border-border-color bg-bg-hover/30">
                    <th className="px-8 py-5">Election</th>
                    <th className="px-6 py-5">Candidate</th>
                    <th className="px-6 py-5">Date</th>
                    <th className="px-8 py-5 text-right">Receipt ID (Hash)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color/30">
                  {myVotes.map((vote, idx) => (
                    <tr key={idx} className="hover:bg-bg-hover/30 transition-colors">
                      <td className="px-8 py-5 font-black text-text-main">{vote.election_id?.title}</td>
                      <td className="px-6 py-5">
                        <span className="text-[10px] text-text-muted bg-bg-hover px-4 py-1.5 rounded-full font-black uppercase tracking-widest border border-border-color">
                          {vote.candidate_id?.name}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-xs font-bold text-text-muted">
                        {new Date(vote.timestamp).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-5 text-right font-mono text-[10px] text-superior font-black break-all max-w-[200px] uppercase tracking-tighter">
                        {vote.receipt_hash || 'Legacy Vote'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
