import React, { useState, useEffect } from 'react';
import useStore from '../store';
import { CheckCircle, Circle, Map, FileText, Mic, CheckSquare, Award, Navigation, LayoutList, Target, TrendingUp } from 'lucide-react';

export default function Timeline() {
  const { user, token, updatePoints } = useStore();
  const [completedPhases, setCompletedPhases] = useState([]);
  const [timelines, setTimelines] = useState([]);
  const [loading, setLoading] = useState(true);

  const isCandidate = user?.role === 'candidate';

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/timeline?district=${user?.district || ''}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setTimelines(data);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [token, user]);

  const handleComplete = (phaseId, points) => {
    if (!completedPhases.includes(phaseId)) {
      setCompletedPhases([...completedPhases, phaseId]);
      updatePoints(points);
    }
  };

  const getIconForIndex = (idx) => {
    const icons = [<FileText size={24}/>, <Map size={24}/>, <Mic size={24}/>, <CheckSquare size={24}/>, <Navigation size={24}/>, <Award size={24}/>];
    return icons[idx % icons.length];
  };

  if (loading) return <div className="p-8 text-center dark:text-white">Loading Election Data...</div>;

  const totalPhases = timelines.reduce((acc, el) => acc + el.phases.length, 0);
  const completionPercentage = totalPhases > 0 ? Math.round((completedPhases.length / totalPhases) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            {isCandidate ? 'Campaign Command Center' : 'Election Journey'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {isCandidate ? 'Track your nomination and campaign progress' : 'Learn and participate in the democratic process'}
          </p>
        </div>
        
        {/* Progressive Summary Widget */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center space-x-4 min-w-[240px]">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-100 dark:text-slate-700" />
              <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={175.9} strokeDashoffset={175.9 - (175.9 * completionPercentage) / 100} className="text-teal-500 transition-all duration-1000" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-black dark:text-white">{completionPercentage}%</span>
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Overall Progress</p>
            <p className="text-sm font-bold dark:text-white">{completedPhases.length} of {totalPhases} Modules</p>
          </div>
        </div>
      </div>

      {isCandidate && (
        <div className="bg-teal-600 rounded-3xl p-8 mb-12 text-white shadow-xl shadow-teal-600/20 flex items-center justify-between overflow-hidden relative">
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-2">Ready to Contribute?</h2>
            <p className="text-teal-100 max-w-md">Your campaign summary shows you are in the <strong>{completionPercentage > 50 ? 'Active Campaigning' : 'Pre-Election'}</strong> phase. Focus on finalizing your manifesto to gain more citizen trust.</p>
            <button className="mt-6 bg-white text-teal-700 px-6 py-3 rounded-xl font-black hover:bg-teal-50 transition-colors">View Candidate Guide</button>
          </div>
          <Target size={160} className="absolute -right-8 -bottom-8 text-teal-500/30 rotate-12" />
        </div>
      )}

      {timelines.length === 0 && <div className="p-8 text-center text-slate-500 dark:text-slate-400">No active election timelines configured for your district.</div>}

      {timelines.map((election) => (
        <div key={election.id} className="mb-16">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-slate-800 rounded-lg">
              <LayoutList className="text-white" size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{election.title}</h2>
          </div>
          
          <div className="relative border-l-4 border-teal-200 dark:border-teal-900 ml-4 space-y-12">
            {election.phases.map((phase, idx) => {
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
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{idx + 1}. {phase.title}</h3>
                          <p className="text-slate-600 dark:text-slate-400 mt-1 max-w-lg">{phase.desc || phase.description}</p>
                          {isCandidate && !isCompleted && (
                            <div className="mt-3 flex items-center text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-full w-fit">
                              <TrendingUp size={12} className="mr-1" /> Critical Action for Candidate
                            </div>
                          )}
                        </div>
                      </div>
                      {!isCompleted ? (
                        <button onClick={() => handleComplete(phase.id, phase.points)} className="bg-teal-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/10">
                          {isCandidate ? 'Mark Done' : 'Complete Module'} (+{phase.points})
                        </button>
                      ) : (
                        <span className="text-green-600 dark:text-green-400 font-bold flex items-center bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-xl">
                          <CheckCircle size={18} className="mr-2" /> {isCandidate ? 'Goal Achieved' : 'Completed'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  );
}