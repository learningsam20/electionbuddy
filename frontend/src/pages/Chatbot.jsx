import React, { useState, useRef, useEffect } from 'react';
import useStore from '../store';
import { Bot, User, Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function Chatbot() {
  const { token } = useStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch(`/api/v1/chat/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: userMsg })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'model', content: data.response }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex flex-col h-[80vh] overflow-hidden border border-slate-200 dark:border-slate-700">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center">
        <Bot className="mr-3 text-teal-600 dark:text-teal-400 w-8 h-8" /> 
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">ElectionBuddy AI Assistant</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Ask any questions about the election process</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-900/50">
        {messages.length === 0 && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-sm px-5 py-3 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="prose dark:prose-invert max-w-none">
                <p>Hello! I am <strong>ElectionBuddy</strong>, your AI election assistant. How can I help you today?</p>
                <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-widest">Available Topics: Voter Registration, Candidate Affidavits, Manifestos, and Voting Ethics.</p>
              </div>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-md ${
              msg.role === 'user' 
                ? 'bg-teal-600 text-white rounded-br-sm' 
                : 'bg-teal-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm border border-teal-100 dark:border-slate-700'
            }`}>
              <div className="text-sm sm:text-base leading-relaxed break-words whitespace-pre-wrap">
                 {msg.role === 'model' ? (
                   <ReactMarkdown 
                    components={{
                      p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2" {...props} />,
                      li: ({node, ...props}) => <li className="mb-1" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-black text-teal-700 dark:text-teal-400" {...props} />
                    }}
                   >
                    {msg.content}
                   </ReactMarkdown>
                 ) : (
                   <p className="m-0 font-medium">{msg.content}</p>
                 )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-sm px-5 py-3 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center space-x-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></div>
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">ElectionBuddy is thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        <form onSubmit={sendMessage} className="flex space-x-4">
          <input 
            type="text" 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            placeholder="Type your question..." 
            className="flex-1 border border-slate-300 dark:border-slate-600 rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 dark:bg-slate-700 dark:text-white transition-colors"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()} className="bg-teal-600 text-white p-3 rounded-full hover:bg-teal-700 disabled:opacity-50 transition-colors shadow-md">
            <Send size={24} />
          </button>
        </form>
      </div>
    </div>
  );
}