import React, { useState, useEffect } from 'react';
import useStore from '../store';
import { UserCheck, Sparkles, ChevronRight, FileText, ExternalLink, Youtube } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function CandidateDiscovery() {
  const { token, user } = useStore();
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/candidate/ext/list?constituency=${user?.assembly_constituency || ''}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setCandidates(Array.isArray(data) ? data : []);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [token, user]);

  const [viewingProfile, setViewingProfile] = useState(false);

  const handleSummarize = async (candidate) => {
    setSelectedCandidate(candidate);
    setViewingProfile(false);
    setLoading(true);
    setSummary('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/citizen/manifesto-summarizer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ candidate_id: candidate.id })
      });
      const data = await res.json();
      setSummary(data.summary || "No summary available.");
    } catch (err) {
      console.error(err);
      setSummary("Error generating summary.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (candidate) => {
    setSelectedCandidate(candidate);
    setViewingProfile(true);
    setSummary('');
  };

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center">
          <UserCheck className="text-teal-500 mr-2" size={24} /> Candidates in {user?.assembly_constituency || 'Your Area'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {candidates.map(c => (
            <div key={c.id} className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-teal-500 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-black text-lg text-slate-900 dark:text-white">{c.name}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{c.party}</p>
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                  <UserCheck size={20} className="text-teal-600" />
                </div>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{c.bio}</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleSummarize(c)}
                  className="flex-1 bg-slate-900 dark:bg-slate-700 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-teal-600 transition-all"
                >
                  <Sparkles size={16} /> AI Summary
                </button>
                <button 
                  onClick={() => handleViewProfile(c)}
                  className="px-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 py-3 rounded-xl font-bold text-sm hover:border-teal-500 transition-all"
                >
                  Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedCandidate && (
        <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black flex items-center">
                <Sparkles className="text-teal-400 mr-3" size={28} /> AI Manifesto Summary: {selectedCandidate.name}
              </h3>
              <button onClick={() => setSelectedCandidate(null)} className="text-slate-400 hover:text-white font-bold">Close</button>
            </div>
            
            {viewingProfile ? (
              <div className="space-y-6">
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                   <h4 className="text-sm font-black uppercase text-teal-400 mb-3 tracking-widest">Biography</h4>
                   <p className="text-slate-300 leading-relaxed">{selectedCandidate.bio}</p>
                </div>
                 <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                    <h4 className="text-sm font-black uppercase text-teal-400 mb-3 tracking-widest">Key Achievements</h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       {(Array.isArray(selectedCandidate.achievements) ? selectedCandidate.achievements : []).map(a => (
                         <li key={a} className="flex items-center gap-2 text-slate-300 text-sm">
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div> {a}
                         </li>
                       ))}
                       {(!selectedCandidate.achievements || selectedCandidate.achievements.length === 0) && (
                         <li className="text-slate-500 text-sm italic">No verified track record provided yet.</li>
                       )}
                    </ul>
                 </div>
                <div className="grid grid-cols-2 gap-4">
                  <a href={selectedCandidate.video_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 p-4 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-2xl transition-all font-bold text-sm border border-red-600/20">
                    <Youtube size={18} /> Watch Campaign
                  </a>
                  <a href={selectedCandidate.manifesto_url} className="flex items-center justify-center gap-2 p-4 bg-teal-600/20 hover:bg-teal-600/30 text-teal-400 rounded-2xl transition-all font-bold text-sm border border-teal-600/20">
                    <FileText size={18} /> Full Manifesto
                  </a>
                </div>
              </div>
            ) : (
              <>
                {loading ? (
                  <div className="flex items-center space-x-3 animate-pulse">
                    <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                    <p className="text-slate-400 font-bold">Gemini is distilling complex manifestos...</p>
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none text-slate-300">
                    <ReactMarkdown>{summary}</ReactMarkdown>
                    
                    <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-4">
                      <a href={selectedCandidate.video_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all font-bold text-sm border border-white/10">
                        <Youtube size={18} className="text-red-500" /> Watch Videos
                      </a>
                      <a href={selectedCandidate.manifesto_url} className="flex items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all font-bold text-sm border border-white/10">
                        <FileText size={18} className="text-teal-500" /> Full Manifesto
                      </a>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl"></div>
        </div>
      )}
    </div>
  );
}
