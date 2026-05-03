import React, { useState } from 'react';
import useStore from '../store';
import { Sparkles, FileText, Share2, Languages, Megaphone, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function CampaignAssistant() {
  const { token, user } = useStore();
  const [topic, setTopic] = useState('');
  const [format, setFormat] = useState('speech');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    setResult('');
    try {
      const res = await fetch(`/api/v1/candidate/ext/campaign-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ topic, format })
      });
      const data = await res.json();
      setResult(data.content);
    } catch (err) {
      console.error(err);
      setResult("Error generating content.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center">
          <Sparkles className="text-teal-500 mr-2" size={24} /> AI Campaign Assistant
        </h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">What's the topic?</label>
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., New public park inauguration, water scarcity solutions..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Content Format</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'speech', label: 'Speech', icon: Megaphone },
                { id: 'press_release', label: 'Press Release', icon: FileText },
                { id: 'social_post', label: 'Social Post', icon: Share2 }
              ].map(f => (
                <button 
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`p-4 rounded-2xl border-2 font-bold flex flex-col items-center gap-2 transition-all ${format === f.id ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400' : 'border-slate-100 dark:border-slate-700 text-slate-400'}`}
                >
                  <f.icon size={20} />
                  <span className="text-xs uppercase tracking-tighter">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={loading || !topic}
            className="w-full bg-teal-600 hover:bg-teal-500 text-white py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-teal-600/20"
          >
            {loading ? 'AI is drafting...' : <><Sparkles size={20} /> Generate Draft</>}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-8 border border-slate-100 dark:border-slate-700">
           <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">Generated {format.replace('_', ' ')}</h4>
              <div className="flex gap-2">
                 <button className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 text-slate-500 hover:text-teal-600">
                    <Share2 size={18} />
                 </button>
                 <button className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 text-slate-500 hover:text-teal-600">
                    <Languages size={18} />
                 </button>
              </div>
           </div>
           <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown>{result}</ReactMarkdown>
           </div>
        </div>
      )}
    </div>
  );
}
