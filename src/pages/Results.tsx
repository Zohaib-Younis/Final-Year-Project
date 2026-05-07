import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { ChevronLeft, Info, Users, Award, TrendingUp, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface ResultData {
  id: string;
  name: string;
  image_url?: string;
  votes: number;
}

export default function Results() {
  const { electionId } = useParams();
  const [results, setResults] = useState<ResultData[]>([]);
  const [deptStats, setDeptStats] = useState<any[]>([]);
  const [candidateDeptStats, setCandidateDeptStats] = useState<any[]>([]);
  const [electionTitle, setElectionTitle] = useState('');
  const [resultsAnnounced, setResultsAnnounced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    fetchInitialResults();
    
    // Setup Socket.io for real-time updates
    const socket: Socket = io();
    socket.on(`election:${electionId}:results`, (data: any) => {
      setResults(data.results || data);
      setDeptStats(data.deptStats || []);
      setCandidateDeptStats(data.candidateDeptStats || []);
      setIsLive(true);
      setTimeout(() => setIsLive(false), 2000);
    });

    return () => {
      socket.disconnect();
    };
  }, [electionId]);

  const fetchInitialResults = async () => {
    try {
      const electionRes = await axios.get(`/api/elections/${electionId}`);
      setElectionTitle(electionRes.data.title);
      setResultsAnnounced(electionRes.data.results_announced);
      
      const resultsRes = await axios.get(`/api/vote/results/${electionId}`);
      setResults(resultsRes.data.results || resultsRes.data);
      setDeptStats(resultsRes.data.deptStats || []);
      setCandidateDeptStats(resultsRes.data.candidateDeptStats || []);
    } catch (err) {
      console.error('Failed to fetch initial results', err);
    } finally {
      setLoading(false);
    }
  };

  const totalVotes = Array.isArray(results) ? results.reduce((sum, r) => sum + r.votes, 0) : 0;
  const sortedResults = Array.isArray(results) ? [...results].sort((a, b) => b.votes - a.votes) : [];
  const COLORS = ['#7b5c7e', '#a68ba8', '#5a425c', '#d1c4d1'];

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-superior"></div></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-text-muted hover:text-superior transition-colors group font-black text-xs uppercase tracking-widest">
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-sm border ${
          isLive ? 'bg-emerald-500 text-white animate-pulse border-emerald-400' : 'bg-bg-hover text-text-muted border-border-color'
        }`}>
          <RefreshCw size={12} className={isLive ? 'animate-spin' : ''} />
          {isLive ? 'Live Update' : 'Updates Auto-Sync'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card p-10 rounded-[2.5rem] shadow-sm border border-border-color"
          >
            <div className="mb-10">
              <h1 className="text-3xl font-black text-text-main mb-2 tracking-tight">{electionTitle}</h1>
              <div className="flex items-center gap-2 bg-bg-hover/50 w-fit px-4 py-2 rounded-xl border border-border-color/50">
                <Users size={18} className="text-superior" />
                <span className="text-text-muted text-sm font-bold uppercase tracking-widest">
                  Total Votes Cast: <span className="font-black text-text-main ml-1">{totalVotes}</span>
                </span>
              </div>
              {resultsAnnounced && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-6 p-6 bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl border border-amber-400 shadow-xl shadow-amber-500/20 text-white relative overflow-hidden"
                >
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <Award size={20} className="text-amber-200" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Official Results Announced</span>
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">The winner is {sortedResults[0]?.name}!</h2>
                  </div>
                  <Award size={100} className="absolute -bottom-4 -right-4 opacity-20 rotate-12 text-white" />
                </motion.div>
              )}
            </div>

            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sortedResults} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="votes" radius={[10, 10, 0, 0]} barSize={60}>
                    {sortedResults.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <div className="bg-card rounded-[2.5rem] p-10 shadow-sm border border-border-color">
            <h3 className="text-xl font-black text-text-main mb-8 flex items-center gap-2 tracking-tight">
              <Award size={20} className="text-superior" />
              Detailed Breakdown
            </h3>
            <div className="space-y-6">
              {sortedResults.map((result, index) => (
                <div key={result.id} className="flex items-center gap-6 group">
                  <div className="w-10 h-10 rounded-2xl bg-bg-hover flex items-center justify-center font-black text-text-muted text-xs shrink-0 group-hover:bg-superior group-hover:text-white transition-colors">
                    {index + 1}
                  </div>
                  {result.image_url ? (
                    <img src={result.image_url} alt={result.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-card shadow-lg shrink-0 group-hover:scale-110 transition-transform" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-bg-hover flex items-center justify-center text-text-muted shrink-0 group-hover:bg-superior/10 group-hover:text-superior transition-colors">
                      <Award size={24} />
                    </div>
                  )}
                  <div className="flex-grow">
                    <div className="flex justify-between items-end mb-2">
                      <span className="font-black text-text-main group-hover:text-superior transition-colors">
                        {result.name}
                        {resultsAnnounced && index === 0 && (
                          <span className="ml-2 inline-flex items-center gap-1 bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                            <Award size={10} /> Winner
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] font-black text-superior uppercase tracking-widest bg-superior/10 px-3 py-1 rounded-full">{result.votes} votes ({totalVotes > 0 ? ((result.votes / totalVotes) * 100).toFixed(1) : 0}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-bg-hover rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${totalVotes > 0 ? (result.votes / totalVotes) * 100 : 0}%` }}
                        transition={{ duration: 1, ease: "circOut" }}
                        className="h-full bg-superior rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Department-wise Performance */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-[2.5rem] p-10 shadow-sm border border-border-color"
          >
            <h3 className="text-xl font-black text-text-main mb-8 flex items-center gap-2 tracking-tight">
              <TrendingUp size={20} className="text-superior" />
              Department-wise Breakdown
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(
                candidateDeptStats.reduce((acc: any, curr: any) => {
                  if (!acc[curr.department]) acc[curr.department] = [];
                  acc[curr.department].push(curr);
                  return acc;
                }, {})
              ).length === 0 ? (
                <div className="col-span-full py-12 text-center text-text-muted font-bold text-sm bg-bg-hover/30 rounded-3xl border border-dashed border-border-color">
                  No department-specific data available yet.
                </div>
              ) : (
                Object.entries(
                  candidateDeptStats.reduce((acc: any, curr: any) => {
                    if (!acc[curr.department]) acc[curr.department] = [];
                    acc[curr.department].push(curr);
                    return acc;
                  }, {})
                ).map(([dept, stats]: [string, any], idx) => (
                  <motion.div 
                    key={dept}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-bg-hover/20 rounded-3xl p-6 border border-border-color/50"
                  >
                    <h3 className="text-[10px] font-black text-superior uppercase tracking-[0.2em] mb-4 border-b border-border-color pb-2">
                      {dept}
                    </h3>
                    <div className="space-y-4">
                      {stats.sort((a: any, b: any) => b.votes - a.votes).map((s: any, i: number) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-xs font-bold text-text-main">{s.candidateName}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-bg-hover rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-superior" 
                                style={{ width: `${(s.votes / Math.max(...stats.map((x: any) => x.votes))) * 100}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-black text-superior">{s.votes}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          <div className="bg-superior text-white p-10 rounded-[2.5rem] shadow-2xl shadow-superior/30 border border-white/10 overflow-hidden relative">
            <TrendingUp size={64} className="absolute -top-4 -right-4 opacity-10 rotate-12" />
            <h3 className="text-xl font-black mb-2 tracking-tight">Current Standings</h3>
            <p className="text-superior-light mb-8 text-xs font-bold uppercase tracking-widest opacity-80">Real-time Lead visualization</p>
            {sortedResults.length > 0 && sortedResults[0].votes > 0 ? (
              <div className="p-6 bg-white/10 rounded-3xl border border-white/20 backdrop-blur-sm">
                <span className="text-[10px] uppercase tracking-[0.2em] text-superior-light font-black">Currently Leading</span>
                <p className="text-3xl font-black mt-2 tracking-tight">{sortedResults[0].name}</p>
                <div className="mt-6 flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="opacity-60">Lead Advantage</span>
                  <span className="text-superior-light bg-white/10 px-3 py-1 rounded-lg">+{sortedResults[0].votes - (sortedResults[1]?.votes || 0)} votes</span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-white/10 rounded-2xl border border-white/20 text-center py-6">
                <Info size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Waiting for votes to start rolling in...</p>
              </div>
            )}
          </div>
          <div className="bg-card p-8 rounded-[2.5rem] border border-border-color shadow-sm">
            <h4 className="font-black text-text-main mb-6 text-[10px] uppercase tracking-[0.2em]">Notice Board</h4>
            <div className="space-y-4">
              <div className="flex gap-4 p-4 rounded-2xl bg-bg-hover/30 border border-border-color/30">
                <div className="w-1.5 h-1.5 rounded-full bg-superior mt-1.5 flex-none shrink-0 animate-pulse"></div>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-relaxed">Results are provisional until the official audit is complete.</p>
              </div>
              <div className="flex gap-4 p-4 rounded-2xl bg-bg-hover/30 border border-border-color/30">
                <div className="w-1.5 h-1.5 rounded-full bg-superior mt-1.5 flex-none shrink-0 animate-pulse"></div>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-relaxed">System is running in offline LAN mode.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
