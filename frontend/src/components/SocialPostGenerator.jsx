import React, { useState } from 'react';
import useStore from '../store';
import { Share2, Sparkles, Copy, Languages, Check } from 'lucide-react';

export default function SocialPostGenerator() {
  const { token, user } = useStore();
  const [topic, setTopic] = useState('');
  const [lang, setLang] = useState(user?.language || 'en');
  const [platform, setPlatform] = useState('Twitter');
  const [post, setPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    setPost('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/citizen/social-posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ topic, target_language: lang, platform })
      });
      const data = await res.json();
      setPost(data.post);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(post);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
      <div className="relative z-10">
        <h3 className="text-2xl font-black mb-6 flex items-center">
          <Share2 className="text-teal-400 mr-3" size={28} /> Social Media Amplifier
        </h3>
        
        <div className="space-y-4">
          <input 
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic: e.g., Why every vote matters, Local issues..."
            className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-2">Language</label>
              <select 
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-sm font-bold outline-none"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="mr">Marathi</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-2">Platform</label>
              <select 
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-sm font-bold outline-none"
              >
                <option value="Twitter">Twitter / X</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Instagram">Instagram</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <button 
                onClick={handleGenerate}
                disabled={loading || !topic}
                className="w-full bg-teal-500 hover:bg-teal-400 text-slate-900 py-3.5 rounded-2xl font-black text-sm transition-all disabled:opacity-50"
              >
                {loading ? 'AI is thinking...' : 'Generate Smart Post'}
              </button>
            </div>
          </div>
        </div>

        {post && (
          <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-2xl relative group">
            <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{post}</p>
            <button 
              onClick={copyToClipboard}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
            >
              {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
            </button>
          </div>
        )}
      </div>
      <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl"></div>
    </div>
  );
}
