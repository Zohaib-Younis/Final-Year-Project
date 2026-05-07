import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bell, Trophy, Award, X, Users, Vote, Trash2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Winner {
  id: string; // election ID
  electionTitle: string;
  name: string;
  image_url?: string;
  votes: number;
}

export default function WinnerNotification() {
  const [isOpen, setIsOpen] = useState(false);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [clearedIds, setClearedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load cleared IDs from localStorage
    const saved = localStorage.getItem('cleared_notifications');
    if (saved) setClearedIds(JSON.parse(saved));

    fetchWinners();
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchWinners = async () => {
    try {
      setLoading(true);
      const electionsRes = await axios.get('/api/elections');
      const closedElections = electionsRes.data.filter((e: any) => e.status === 'closed' || e.results_announced);
      
      const winnersData = await Promise.all(
        closedElections.map(async (election: any) => {
          try {
            const resultsRes = await axios.get(`/api/vote/results/${election.id}`);
            const results = resultsRes.data.results || resultsRes.data;
            if (Array.isArray(results) && results.length > 0) {
              const sorted = [...results].sort((a, b) => b.votes - a.votes);
              return {
                id: election.id,
                electionTitle: election.title,
                name: sorted[0].name,
                image_url: sorted[0].image_url,
                votes: sorted[0].votes
              };
            }
          } catch (e) {
            console.error(`Failed to fetch winner for ${election.id}`);
          }
          return null;
        })
      );

      const validWinners = winnersData.filter(w => w !== null) as Winner[];
      setWinners(validWinners);
      
      // Check if there are any new (not cleared) notifications
      const saved = localStorage.getItem('cleared_notifications');
      const cleared = saved ? JSON.parse(saved) : [];
      const hasUnread = validWinners.some(w => !cleared.includes(w.id));
      setHasNew(hasUnread);
    } catch (err) {
      console.error('Failed to fetch winners', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearOne = (id: string) => {
    const updated = [...clearedIds, id];
    setClearedIds(updated);
    localStorage.setItem('cleared_notifications', JSON.stringify(updated));
    
    // Check if any remain
    const stillHasNew = winners.some(w => !updated.includes(w.id));
    setHasNew(stillHasNew);
  };

  const handleClearAll = () => {
    const allIds = winners.map(w => w.id);
    setClearedIds(allIds);
    localStorage.setItem('cleared_notifications', JSON.stringify(allIds));
    setHasNew(false);
  };

  const visibleWinners = winners.filter(w => !clearedIds.includes(w.id));

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        className="p-2 text-text-muted hover:text-superior hover:bg-bg-hover rounded-full transition-all relative group"
        title="Election Winners"
      >
        <Bell size={20} className={hasNew ? 'animate-bounce' : ''} />
        {hasNew && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-card rounded-full"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 md:w-96 bg-card border border-border-color shadow-2xl rounded-[2rem] overflow-hidden z-[60]"
          >
            <div className="p-6 border-b border-border-color bg-superior/5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Trophy size={20} className="text-amber-500" />
                <h3 className="font-black text-text-main text-sm uppercase tracking-widest">Winners</h3>
              </div>
              <div className="flex items-center gap-4">
                {visibleWinners.length > 0 && (
                  <button 
                    onClick={handleClearAll}
                    className="text-[10px] font-black text-superior hover:text-superior-dark uppercase tracking-widest flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={12} />
                    Clear All
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-text-main transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-superior mx-auto"></div>
                </div>
              ) : visibleWinners.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <CheckCircle2 size={48} className="mx-auto text-emerald-500 opacity-20" />
                  <p className="text-sm font-bold text-text-muted">All caught up!</p>
                  <p className="text-[10px] uppercase tracking-widest text-text-muted/60">No new winners to display</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {visibleWinners.map((winner, idx) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9, x: 20 }}
                      key={winner.id}
                      className="p-4 bg-bg-hover/30 rounded-3xl border border-border-color/50 group hover:border-superior/30 transition-all relative"
                    >
                      <button
                        onClick={() => handleClearOne(winner.id)}
                        className="absolute top-4 right-4 p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        title="Clear notification"
                      >
                        <X size={14} />
                      </button>

                      <p className="text-[10px] font-black text-superior uppercase tracking-widest mb-3 opacity-60 pr-8">
                        {winner.electionTitle}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="relative shrink-0">
                          {winner.image_url ? (
                            <img 
                              src={winner.image_url} 
                              alt={winner.name} 
                              className="w-16 h-16 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-md group-hover:scale-110 transition-transform" 
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-2xl bg-superior/10 flex items-center justify-center text-superior">
                              <Award size={32} />
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-lg shadow-sm">
                            <Trophy size={12} />
                          </div>
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-black text-text-main text-lg tracking-tight group-hover:text-superior transition-colors">
                            {winner.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Users size={14} className="text-text-muted" />
                            <span className="text-xs font-bold text-text-muted">
                              <span className="text-text-main">{winner.votes}</span> total votes
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
            
            <div className="p-4 bg-bg-hover/30 text-center border-t border-border-color">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Official Declarations</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
