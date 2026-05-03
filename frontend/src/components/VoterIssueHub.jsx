import React, { useState } from 'react';
import useStore from '../store';
import { MessageSquare, Mic, Send, CheckCircle2 } from 'lucide-react';

export default function VoterIssueHub() {
  const { token, user } = useStore();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mode, setMode] = useState('text'); // text or audio

  const handleSubmit = async () => {
    if (!content) return;
    setIsSubmitting(true);
    try {
      await fetch(`/api/v1/citizen/submit-issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content,
          constituency: user?.assembly_constituency || 'Unknown'
        })
      });
      setSubmitted(true);
      setContent('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-8 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 rounded-3xl text-center">
        <CheckCircle2 className="w-12 h-12 text-teal-500 mx-auto mb-4" />
        <h3 className="text-xl font-black text-teal-900 dark:text-teal-300 mb-2">Issue Submitted Anonymously</h3>
        <p className="text-teal-700 dark:text-teal-400 text-sm mb-6">Your voice has been added to the "Voice of the Voter" hub. Candidates in {user?.assembly_constituency} will see this in their priority heatmap.</p>
        <button onClick={() => setSubmitted(false)} className="text-teal-600 font-bold underline">Submit another issue</button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center">
          <MessageSquare className="text-indigo-500 mr-2" size={24} /> Voice of the Voter
        </h3>
        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
          <button onClick={() => setMode('text')} className={`px-4 py-1 rounded-lg text-xs font-bold transition-all ${mode === 'text' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400'}`}>TEXT</button>
          <button onClick={() => setMode('audio')} className={`px-4 py-1 rounded-lg text-xs font-bold transition-all ${mode === 'audio' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400'}`}>AUDIO</button>
        </div>
      </div>

      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">Submit local issues you care about (e.g., roads, water, safety). Your identity remains anonymous.</p>

      {mode === 'text' ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Describe the issue in your area..."
          className="w-full h-32 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
        />
      ) : (
        <div className="h-32 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center border-dashed">
          <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-3 text-indigo-600 animate-pulse">
            <Mic size={32} />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hold to Record (STT Powered)</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || (mode === 'text' && !content)}
        className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-600/20"
      >
        {isSubmitting ? 'Submitting...' : <><Send size={20} /> Submit Anonymously</>}
      </button>
    </div>
  );
}
