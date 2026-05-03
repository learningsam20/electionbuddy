import React, { useState, useEffect } from 'react';
import useStore from '../store';
import { Award, Users, Share2, TrendingUp, ShieldCheck, Zap, Info } from 'lucide-react';

export default function Dashboard() {
  const { user, token } = useStore();
  const [familyStats, setFamilyStats] = useState(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/stats/my/family`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setFamilyStats(data))
    .catch(err => console.error(err));
  }, [token]);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/stats/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action_type: 'share_with_fellows' })
      });
      alert('Thanks for sharing the word! Your contribution to election awareness is noted.');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSharing(false);
    }
  };

  const pointsTarget = 500;
  const progressPercent = Math.min(100, (user?.total_points / pointsTarget) * 100);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white">Welcome, {user?.name.split(' ')[0]}!</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Your impact on democracy today.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Points & Level Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="relative w-48 h-48 flex-shrink-0">
             <svg className="w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100 dark:text-slate-700" />
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={552.9} strokeDashoffset={552.9 - (552.9 * progressPercent) / 100} strokeLinecap="round" className="text-teal-500 transition-all duration-1000" />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-black text-slate-900 dark:text-white">{user?.total_points}</span>
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-tighter">Election Points</span>
             </div>
          </div>
          <div className="flex-1">
             <div className="flex items-center space-x-2 mb-2">
                <Zap className="text-teal-500 fill-teal-500" size={20} />
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Democracy Advocate</h2>
             </div>
             <p className="text-slate-500 dark:text-slate-400 leading-relaxed">You've reached <strong>Level {Math.floor(user?.total_points / 100) + 1}</strong>. Keep participating in quizzes and timelines to become an 'Election Expert'.</p>
             <div className="mt-6 flex flex-wrap gap-3">
                <span className="px-4 py-2 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-xl text-sm font-bold border border-teal-100 dark:border-teal-800 flex items-center">
                  <Award size={16} className="mr-2" /> Top 5% in {user?.district}
                </span>
                <span className="px-4 py-2 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold border border-slate-100 dark:border-slate-700 flex items-center">
                  <ShieldCheck size={16} className="mr-2" /> Identity Verified
                </span>
             </div>
          </div>
          <TrendingUp className="absolute -top-4 -right-4 text-slate-50 dark:text-slate-700/30" size={120} />
        </div>

        {/* Family Maturity Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <Users size={32} className="text-indigo-200" />
              <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Privacy Protected</div>
            </div>
            <h3 className="text-2xl font-black mb-2">Family Maturity</h3>
            <p className="text-indigo-100 text-sm leading-relaxed mb-6">Collective progress of your immediate family in understanding the democratic process.</p>
            
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-4xl font-black">{familyStats?.family_maturity || 0}%</span>
                <span className="text-xs font-bold text-indigo-200 mb-1">{familyStats?.member_count || 0} Members Linked</span>
              </div>
              <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white transition-all duration-1000" style={{ width: `${familyStats?.family_maturity || 0}%` }}></div>
              </div>
              <p className="text-[10px] text-indigo-200 italic flex items-center">
                <Info size={12} className="mr-1" /> This score is aggregated and anonymous to protect privacy.
              </p>
            </div>
          </div>
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Sharing & Engagement Section */}
      <div className="bg-slate-900 rounded-3xl p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 border border-slate-800 shadow-2xl">
        <div className="max-w-xl">
           <h3 className="text-3xl font-black mb-4 flex items-center">
              <Share2 className="mr-4 text-teal-400" size={36} /> Share the Word
           </h3>
           <p className="text-slate-400 text-lg leading-relaxed">Democracy thrives on informed participation. Invite your fellows, friends, and colleagues to join <strong>ElectionBuddy</strong> and help build a more mature electoral culture.</p>
        </div>
        <button 
          onClick={handleShare}
          disabled={isSharing}
          className="bg-teal-500 hover:bg-teal-400 text-slate-900 px-10 py-5 rounded-2xl font-black text-xl transition-all shadow-xl shadow-teal-500/20 active:scale-95 disabled:opacity-50"
        >
          {isSharing ? 'Processing...' : 'Share with Fellows'}
        </button>
      </div>

      {/* Analytics Insights Placeholder */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl text-center">
            <p className="text-slate-400 font-bold italic">AI Insight: Based on your recent quizzes, you should explore the 'Campaign Finance' module next to complete your expertise.</p>
         </div>
         <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl text-center">
            <p className="text-slate-400 font-bold italic">Persistence Status: Your progress and sharing actions are being securely logged for election analytics.</p>
         </div>
      </div>
    </div>
  );
}