import React, { useState, useEffect } from 'react';
import useStore from '../store';
import { LayoutList, CheckCircle, Circle, Clock, Calendar, ChevronRight, TrendingUp, Info, ListChecks } from 'lucide-react';

export default function Timeline() {
  const { token, user, updatePoints } = useStore();
  const [timelines, setTimelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const isCandidate = user?.role === 'candidate';

  useEffect(() => {
    const fetchTimelines = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/timeline/list?district=${user?.district || ''}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        setTimelines(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTimelines();
  }, [token, user]);

  const [completedPhases, setCompletedPhases] = useState([]);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const url = isCandidate 
          ? `${import.meta.env.VITE_API_BASE_URL}/api/v1/candidate/progress`
          : `${import.meta.env.VITE_API_BASE_URL}/api/v1/timeline/progress`;
          
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        setCompletedPhases(Array.isArray(data) ? data.map(p => p.id || p.phase_id) : []);
      } catch (err) {
        console.error(err);
      }
    };

    if (user) fetchProgress();
  }, [token, user, isCandidate]);

  const handleComplete = async (phaseId, points) => {
    setError(null);
    setSuccess(null);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/timeline/complete/${phaseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setCompletedPhases([...completedPhases, phaseId]);
        updatePoints(points);
        setSuccess(data.message);
      } else {
        setError(data.detail || 'Could not complete phase.');
      }
    } catch (err) {
      setError('Network error occurred.');
    }
  };

  const getIconForIndex = (idx) => {
    const icons = [<LayoutList />, <CheckCircle />, <Clock />, <Calendar />];
    return icons[idx % icons.length];
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Syncing Election Timeline...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">
            Election <span className="text-teal-600">Journey</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Follow the roadmap to ensure a smooth and informed voting experience.</p>
        </div>
        
        <button 
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-6 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all font-bold text-sm text-slate-700 dark:text-slate-200"
        >
          {showGuide ? 'Hide Guide' : 'How it works?'} <ChevronRight size={18} className={showGuide ? 'rotate-90 transition-transform' : ''} />
        </button>
      </div>

      {showGuide && (
        <div className="mb-12 bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden animate-in slide-in-from-top-4 duration-500">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center font-black">1</div>
              <h3 className="font-bold text-lg">Track Phases</h3>
              <p className="text-sm text-slate-400">Stay updated with registration, nomination, and polling dates specific to your district.</p>
            </div>
            <div className="space-y-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center font-black">2</div>
              <h3 className="font-bold text-lg">Complete Tasks</h3>
              <p className="text-sm text-slate-400">Mark modules as complete to earn maturity points and badges for your profile.</p>
            </div>
            <div className="space-y-3">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center font-black">3</div>
              <h3 className="font-bold text-lg">Earn Rewards</h3>
              <p className="text-sm text-slate-400">Higher maturity levels unlock special insights and community leadership status.</p>
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl"></div>
        </div>
      )}

      {timelines.length === 0 && <div className="p-8 text-center text-slate-500 dark:text-slate-400">No active election timelines configured for your district.</div>}

      {(error || success) && (
        <div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${success ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 border border-teal-100 dark:border-teal-800' : 'bg-red-50 dark:bg-red-900/30 text-red-600 border border-red-100 dark:border-red-800'}`}>
           {success ? <CheckCircle size={20} /> : <Info size={20} />}
           <p className="text-sm font-bold">{success || error}</p>
        </div>
      )}

      {timelines.map((election) => {
        const relevantPhases = election.phases.filter(p => 
          p.target_role === 'both' || p.target_role === user?.role || user?.role === 'officer'
        );
        
        if (relevantPhases.length === 0) return null;

        return (
          <div key={election.id} className="mb-16">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-slate-800 rounded-lg">
                <LayoutList className="text-white" size={20} />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{election.title}</h2>
            </div>
            
            <div className="relative border-l-4 border-teal-200 dark:border-teal-900 ml-4 space-y-12">
              {relevantPhases.map((phase, idx) => {
                const isCompleted = completedPhases.includes(phase.id);
                return (
                  <div key={phase.id} className="relative pl-8">
                    <div className={`absolute -left-[22px] bg-white dark:bg-slate-800 p-1 rounded-full border-4 ${isCompleted ? 'border-teal-500' : 'border-slate-300 dark:border-slate-600'}`}>
                      {isCompleted ? <CheckCircle className="text-teal-500" /> : <Circle className="text-slate-300 dark:text-slate-600" />}
                    </div>
                    
                    <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-md p-6 border-l-4 transition-all ${isCompleted ? 'border-teal-500' : 'border-transparent hover:shadow-lg'}`}>
                      <div className="flex justify-between items-start flex-wrap gap-4">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-2xl ${isCompleted ? 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                            {getIconForIndex(idx)}
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                               <h3 className="text-xl font-bold text-slate-900 dark:text-white">{idx + 1}. {phase.title}</h3>
                               {phase.start_date && (
                                 <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-3 py-1 rounded-full">
                                    <Calendar size={12} /> {new Date(phase.start_date).toLocaleDateString()} - {new Date(phase.end_date).toLocaleDateString()}
                                 </div>
                               )}
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 mt-1 max-w-lg">{phase.desc || phase.description}</p>
                            
                            {phase.requirements_json && (
                              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                 <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2 flex items-center gap-2"><ListChecks size={14} /> Requirements for Completion</h4>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {JSON.parse(phase.requirements_json).map(req => (
                                      <div key={req} className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                                         <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-teal-500' : 'bg-slate-300'}`}></div>
                                         {req}
                                      </div>
                                    ))}
                                 </div>
                              </div>
                            )}

                            {isCandidate && !isCompleted && (
                              <div className="mt-3 flex items-center text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-full w-fit">
                                <TrendingUp size={12} className="mr-1" /> Critical Action for Candidate
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-4">
                          {(() => {
                            const now = new Date();
                            const start = phase.start_date ? new Date(phase.start_date) : null;
                            const end = phase.end_date ? new Date(phase.end_date) : null;
                            
                            if (isCompleted) return <span className="text-green-600 dark:text-green-400 font-bold flex items-center bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-xl text-sm"><CheckCircle size={18} className="mr-2" /> {isCandidate ? 'Goal Achieved' : 'Completed'}</span>;
                            
                            if (start && end) {
                              if (now >= start && now <= end) return <span className="text-teal-600 font-bold flex items-center bg-teal-50 dark:bg-teal-900/20 px-4 py-2 rounded-xl text-sm animate-pulse"><Clock size={18} className="mr-2" /> Active Phase</span>;
                              if (now < start) return <span className="text-slate-400 font-bold flex items-center bg-slate-100 dark:bg-slate-700/50 px-4 py-2 rounded-xl text-sm"><Clock size={18} className="mr-2" /> Upcoming</span>;
                              return <span className="text-red-400 font-bold flex items-center bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-xl text-sm"><Clock size={18} className="mr-2" /> Past Due</span>;
                            }
                            return null;
                          })()}

                          {(!isCompleted && user?.role !== 'officer') && (
                            <button onClick={() => handleComplete(phase.id, phase.points)} className="bg-teal-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/10 text-sm">
                              {isCandidate ? 'Mark Done' : 'Complete Module'} (+{phase.points})
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}