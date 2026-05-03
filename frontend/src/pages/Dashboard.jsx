import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import useStore from '../store';
import { Award, Users, Share2, TrendingUp, ShieldCheck, Zap, Info, BarChart3, PieChart, Calendar, Lightbulb, UserCheck, CheckCircle2, MessageSquare, MapPin, Sparkles, Database, Activity, ShieldAlert, FileText, Settings, Heart, Megaphone, ChevronRight, Check, AlertCircle, Clock, Eye, EyeOff, BellOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import MaturityQuiz from '../components/MaturityQuiz';
import PollingBoothMap from '../components/PollingBoothMap';
import VoterIssueHub from '../components/VoterIssueHub';
import CandidateDiscovery from '../components/CandidateDiscovery';
import CampaignAssistant from '../components/CampaignAssistant';
import AdminTelemetry from '../components/AdminTelemetry';
import SocialPostGenerator from '../components/SocialPostGenerator';
import RoleManagement from '../components/RoleManagement';

export default function Dashboard() {
  const { user, token } = useStore();
  const [familyStats, setFamilyStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  const officerAlertRef = useRef(null);
  const adminAlertRef = useRef(null);
  const [alertStatus, setAlertStatus] = useState(null); 
  const [targetBooth, setTargetBooth] = useState('ALL');
  const [boothList, setBoothList] = useState([]);
  const [familyIdInput, setFamilyIdInput] = useState('');
  const [linkingStatus, setLinkingStatus] = useState(null);

  // Officer state
  const [officerData, setOfficerData] = useState(null);
  const [recommendation, setRecommendation] = useState('');
  const [loadingOfficer, setLoadingOfficer] = useState(false);

  useEffect(() => {
    if (user?.role === 'citizen' || user?.role === 'candidate') {
      fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/stats/my/family`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setFamilyStats(data))
      .catch(err => console.error(err));
    }
    
    if (user?.role === 'officer') {
      setLoadingOfficer(true);
      fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/stats/officer/overview`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setOfficerData(data))
      .catch(err => console.error(err));

      fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/stats/officer/recommendations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        setRecommendation(data.recommendation);
        setLoadingOfficer(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingOfficer(false);
      });

      // Fetch booths for target selection
      fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/officer/ext/booth-resources?district=${user?.district || 'Pune'}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        const booths = Array.isArray(data) ? data.filter(r => r.type === 'booth') : [];
        setBoothList(booths);
      })
      .catch(err => console.error(err));
    }
  }, [token, user]);

  const renderRoleNavigation = () => {
    const tabs = {
      citizen: [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'maturity', label: 'Maturity Quiz', icon: Zap },
        { id: 'candidates', label: 'Candidates', icon: UserCheck },
        { id: 'logistics', label: 'Polling Booth', icon: MapPin },
        { id: 'issues', label: 'Issue Hub', icon: MessageSquare },
        { id: 'alerts', label: 'System Alerts', icon: Megaphone }
      ],
      candidate: [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'profile', label: 'Profile', icon: Settings },
        { id: 'campaign', label: 'AI Assistant', icon: Sparkles },
        { id: 'insights', label: 'Issue Heatmap', icon: MessageSquare },
        { id: 'maturity', label: 'Ethics Check', icon: ShieldCheck },
        { id: 'alerts', label: 'System Alerts', icon: Megaphone }
      ],
      officer: [
        { id: 'overview', label: 'Command Center', icon: Activity },
        { id: 'moderation', label: 'Moderation', icon: ShieldCheck },
        { id: 'logistics', label: 'Resources', icon: MapPin },
        { id: 'alerts', label: 'Alerts', icon: Megaphone }
      ],
      admin: [
        { id: 'overview', label: 'System Health', icon: Activity },
        { id: 'telemetry', label: 'Telemetry', icon: Database },
        { id: 'billing', label: 'Cloud Costs', icon: PieChart },
        { id: 'audit', label: 'Audit Logs', icon: FileText }
      ]
    };

    const currentTabs = tabs[user?.role] || tabs.citizen;

    return (
      <div className="flex bg-white dark:bg-slate-800 p-2 rounded-3xl mb-10 shadow-sm border border-slate-100 dark:border-slate-700 overflow-x-auto no-scrollbar">
        {currentTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-900 dark:bg-teal-600 text-white shadow-lg shadow-slate-900/10 dark:shadow-teal-600/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>
    );
  };

  const [systemAlerts, setSystemAlerts] = useState([]);

  const fetchAlerts = () => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/ext/system-alerts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setSystemAlerts(Array.isArray(data) ? data : []))
    .catch(err => console.error(err));
  };

  useEffect(() => {
    if (token) fetchAlerts();
  }, [token]);

  const updateAlertStatus = async (alertId, status, snoozeHours = 0) => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/ext/alerts/${alertId}/status?status=${status}&snooze_hours=${snoozeHours}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const renderCitizenView = () => {
    switch (activeTab) {
      case 'maturity':
        return (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <MaturityQuiz />
              <div className="space-y-8">
                 <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl">
                    <h3 className="text-2xl font-black mb-4 flex items-center"><Info className="mr-2" /> Why Maturity Matters</h3>
                    <p className="text-indigo-100 leading-relaxed mb-6">A mature voter is an informed voter. By completing these assessments, you help raise the democratic index of <strong>{user?.district}</strong>.</p>
                    <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
                       <p className="text-xs font-black uppercase tracking-widest mb-1">Constituency Maturity</p>
                       <p className="text-3xl font-black">68%</p>
                    </div>
                 </div>
                 <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700">
                    <h4 className="text-lg font-black text-slate-900 dark:text-white mb-4">Educational Modules</h4>
                    <div className="space-y-3">
                       {["Path to the Parliament", "Build a Manifesto", "Election Ethics 101"].map(m => (
                         <button key={m} className="w-full text-left p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-teal-500 transition-all font-bold text-sm flex justify-between items-center group">
                            {m} <ChevronRight size={16} className="text-slate-400 group-hover:text-teal-500" />
                         </button>
                       ))}
                    </div>
                 </div>
              </div>
            </div>
          </>
        );
      case 'candidates': return <CandidateDiscovery />;
      case 'logistics': return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2"><PollingBoothMap /></div>
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 flex flex-col justify-center">
             <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-full w-fit mb-6 text-orange-600"><Lightbulb size={32} /></div>
             <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Pro-Tip for Voting Day</h3>
             <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-6">Carry your EPIC card or a valid Photo ID. Best time to vote to avoid queues is usually between 10:00 AM and 1:00 PM.</p>
             <button 
               onClick={() => window.open('https://electorallogin.eci.gov.in/', '_blank')}
               className="bg-slate-900 dark:bg-slate-700 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors"
             >
               Check Voter List
             </button>
          </div>
        </div>
      );
      case 'issues': return <div className="grid grid-cols-1 lg:grid-cols-2 gap-8"><VoterIssueHub /><div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col justify-center"><h3 className="text-2xl font-black mb-4">Voice of the Voter</h3><p className="text-slate-400 leading-relaxed mb-6">Your submitted issues are aggregated and shared with candidates in your area to help them prioritize development work. Total issues in {user?.assembly_constituency}: <strong>124</strong></p><div className="flex -space-x-2"><div className="w-10 h-10 rounded-full bg-teal-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-black">78%</div><div className="w-10 h-10 rounded-full bg-indigo-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-black">22%</div></div></div></div>;
      case 'alerts':
        return (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-2xl font-black text-slate-900 dark:text-white">Active System Alerts</h3>
               <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-black uppercase text-slate-400">Live Updates</span>
               </div>
            </div>
            
            {systemAlerts.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <CheckCircle2 size={48} className="mx-auto text-teal-500 mb-4" />
                <p className="text-slate-900 dark:text-white font-bold">All clear!</p>
                <p className="text-slate-500">No active alerts for your area.</p>
              </div>
            ) : (
              systemAlerts.map(alert => (
                <div key={alert.id} className={`p-6 rounded-3xl flex flex-col gap-4 shadow-sm border transition-all ${alert.status === 'read' ? 'bg-slate-50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800 opacity-60' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800'}`}>
                   <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg ${alert.status === 'read' ? 'bg-slate-400' : 'bg-red-600 shadow-red-600/20'}`}><Megaphone size={20} /></div>
                      <div className="flex-1">
                         <div className="flex justify-between items-start">
                            <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${alert.status === 'read' ? 'text-slate-400' : 'text-red-600 dark:text-red-400'}`}>
                              System Alert • {alert.constituency}
                            </p>
                            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold">
                               <Clock size={12} /> {new Date(alert.timestamp).toLocaleString()}
                            </div>
                         </div>
                         <p className={`text-base font-bold leading-tight ${alert.status === 'read' ? 'text-slate-500' : 'text-slate-900 dark:text-white'}`}>{alert.text}</p>
                      </div>
                   </div>
                   
                   <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/50 mt-2">
                      <button 
                        onClick={() => updateAlertStatus(alert.id, alert.status === 'read' ? 'unread' : 'read')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${alert.status === 'read' ? 'bg-slate-200 text-slate-600 dark:bg-slate-700' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}
                      >
                         {alert.status === 'read' ? <><EyeOff size={14} /> Mark Unread</> : <><Eye size={14} /> Mark Read</>}
                      </button>
                      <button 
                        onClick={() => updateAlertStatus(alert.id, 'snoozed', 1)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                      >
                         <BellOff size={14} /> Snooze 1h
                      </button>
                   </div>
                </div>
              ))
            )}
          </div>
        );
      default: return (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Points & Level Card */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
              <div className="relative w-48 h-48 flex-shrink-0">
                 <svg className="w-full h-full transform -rotate-90">
                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100 dark:text-slate-700" />
                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={552.9} strokeDashoffset={552.9 - (552.9 * Math.min(100, (user?.total_points / 500) * 100)) / 100} strokeLinecap="round" className="text-teal-500 transition-all duration-1000" />
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
                 <p className="text-slate-500 dark:text-slate-400 leading-relaxed">You've reached <strong>Level {Math.floor(user?.total_points / 100) + 1}</strong>. Maturity Level: <strong>{user?.maturity_level}</strong>. Keep participating to become an 'Election Expert'.</p>
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
                  <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden mb-6">
                    <div className="h-full bg-white transition-all duration-1000" style={{ width: `${familyStats?.family_maturity || 0}%` }}></div>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase text-indigo-200 tracking-widest">Link Family Members</p>
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         value={familyIdInput}
                         onChange={(e) => setFamilyIdInput(e.target.value)}
                         placeholder="Enter Family ID..."
                         className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm placeholder:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-white/30"
                       />
                       <button 
                         onClick={async () => {
                           if (!familyIdInput) return;
                           try {
                             const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/citizen/link-family`, {
                               method: 'POST',
                               headers: {
                                 'Content-Type': 'application/json',
                                 'Authorization': `Bearer ${token}`
                               },
                               body: JSON.stringify({ family_group_id: familyIdInput })
                             });
                             const data = await res.json();
                             if (res.ok) {
                               setLinkingStatus({ type: 'success', msg: 'Linked!' });
                               setFamilyIdInput('');
                               // Refresh stats
                               fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/stats/my/family`, {
                                 headers: { 'Authorization': `Bearer ${token}` }
                               })
                               .then(res => res.json())
                               .then(data => setFamilyStats(data));
                             } else {
                               setLinkingStatus({ type: 'error', msg: data.detail || 'Failed' });
                             }
                           } catch (err) {
                             setLinkingStatus({ type: 'error', msg: 'Error' });
                           }
                         }}
                         className="bg-white text-indigo-600 px-4 py-2 rounded-xl font-black text-xs hover:bg-indigo-50 transition-colors"
                       >
                         Link
                       </button>
                    </div>
                    {linkingStatus && (
                      <p className={`text-[10px] font-black uppercase ${linkingStatus.type === 'success' ? 'text-teal-300' : 'text-red-300'}`}>
                        {linkingStatus.msg}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
            </div>
          </div>
          <SocialPostGenerator />
        </>
      );
    }
  };

  const renderCandidateView = () => {
    switch (activeTab) {
      case 'campaign': return <CampaignAssistant />;
      case 'profile': return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Master Profile Management</h3>
              <div className="space-y-6">
                 <div>
                    <label className="block text-sm font-black text-slate-400 uppercase mb-2">YouTube Campaign URLs</label>
                    <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700" placeholder="Add YouTube link..." />
                 </div>
                 <div>
                    <label className="block text-sm font-black text-slate-400 uppercase mb-2">News & Media Mentions</label>
                    <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700" placeholder="Add news article link..." />
                 </div>
                 <button className="w-full bg-teal-600 text-white py-4 rounded-2xl font-black">Save Master Profile</button>
              </div>
           </div>
           <div className="bg-slate-900 rounded-3xl p-8 text-white">
              <h3 className="text-xl font-black mb-6">Sentiment Analysis</h3>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 mb-6">
                 <p className="text-xs font-black uppercase text-slate-400 mb-2">Overall Sentiment</p>
                 <p className="text-2xl font-black text-teal-400">Positive (72%)</p>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">Gemini has analyzed your linked news articles. The general sentiment is positive, focusing on your recent infrastructure development work in {user?.assembly_constituency}.</p>
           </div>
        </div>
      );
      case 'insights': return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Constituency Issue Heatmap</h3>
              <div className="space-y-4">
                 {[
                   { issue: "Road Maintenance", count: 45, color: "bg-red-500" },
                   { issue: "Water Supply", count: 32, color: "bg-orange-500" },
                   { issue: "Waste Management", count: 28, color: "bg-yellow-500" },
                   { issue: "Street Lighting", count: 19, color: "bg-teal-500" }
                 ].map(i => (
                   <div key={i.issue} className="space-y-2">
                      <div className="flex justify-between text-sm font-bold">
                         <span className="text-slate-700 dark:text-slate-300">{i.issue}</span>
                         <span className="text-slate-400">{i.count} Votes</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                         <div className={`h-full ${i.color}`} style={{ width: `${(i.count/50)*100}%` }}></div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
           <div className="bg-indigo-600 rounded-3xl p-8 text-white flex flex-col justify-center">
              <h3 className="text-2xl font-black mb-4">Voter Insights</h3>
              <p className="text-indigo-100 leading-relaxed mb-6">These issues are aggregated from the anonymous 'Voice of the Voter' hub. Use this data to tailor your manifesto promises.</p>
              <button className="bg-white text-indigo-600 py-3 rounded-xl font-bold">Export Insight Report</button>
           </div>
        </div>
      );
      case 'maturity': return <div className="max-w-2xl mx-auto"><MaturityQuiz /></div>;
      case 'alerts': return (
        <div className="max-w-2xl mx-auto space-y-4">
           <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Campaign Alerts</h3>
           <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <CheckCircle2 size={48} className="mx-auto text-teal-500 mb-4" />
                <p className="text-slate-900 dark:text-white font-bold">All clear!</p>
                <p className="text-slate-500">No active system alerts for your campaign.</p>
           </div>
        </div>
      );
      default: return (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700">
             <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Candidate Metrics</h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                   <p className="text-xs font-black text-slate-400 uppercase mb-1">Profile Views</p>
                   <p className="text-3xl font-black text-slate-900 dark:text-white">1,240</p>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                   <p className="text-xs font-black text-slate-400 uppercase mb-1">Engagement Rate</p>
                   <p className="text-3xl font-black text-slate-900 dark:text-white">8.4%</p>
                </div>
             </div>
          </div>
          <div className="bg-teal-600 rounded-3xl p-8 text-white flex flex-col justify-center">
             <h3 className="text-2xl font-black mb-4">Ethics Verified</h3>
             <p className="text-teal-100 text-sm mb-6">Your candidate maturity quiz results are verified and displayed publicly on your profile.</p>
             <div className="p-4 bg-white/20 rounded-2xl flex items-center gap-3">
                <ShieldCheck size={24} />
                <span className="font-bold">Score: 9/10</span>
             </div>
          </div>
        </div>
        <div className="mt-12">
          <SocialPostGenerator />
        </div>
      </>
    );
    }
  };

  const [moderationItems, setModerationItems] = useState([]);
  const [modLoading, setModLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'officer' && activeTab === 'moderation') {
      setModLoading(true);
      fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/officer/ext/campaign-pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        setModerationItems(Array.isArray(data) ? data : []);
        setModLoading(false);
      })
      .catch(err => {
        console.error(err);
        setModLoading(false);
      });
    }
  }, [user, activeTab, token]);

  const handleModerate = async (id, status) => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/officer/ext/campaign-moderate/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      setModerationItems(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const renderOfficerView = () => {
    switch (activeTab) {
      case 'moderation': return (
        <div className="space-y-8">
           <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
              <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                 <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center">
                    <ShieldCheck className="text-teal-500 mr-3" size={24} /> Review Queue
                 </h3>
                 <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                       {moderationItems.length} Pending
                    </span>
                 </div>
              </div>
              
              <div className="p-8">
                 {modLoading ? (
                   <div className="text-center py-20 text-slate-400 font-bold">Scanning submissions...</div>
                 ) : !Array.isArray(moderationItems) || moderationItems.length === 0 ? (
                   <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                      <CheckCircle2 size={48} className="mx-auto text-teal-500 mb-4" />
                      <p className="text-slate-900 dark:text-white font-black text-lg">Inbox Zero!</p>
                      <p className="text-slate-500">All campaign submissions have been moderated.</p>
                   </div>
                 ) : (
                   <div className="space-y-8">
                      {Array.isArray(moderationItems) && moderationItems.map(item => (
                        <div key={item.id} className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                           <div className="space-y-6">
                              <div className="flex justify-between items-start">
                                 <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Candidate</p>
                                    <p className="text-xl font-black text-slate-900 dark:text-white">{item.candidate_name}</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Submitted</p>
                                    <p className="text-sm font-bold text-slate-500">{new Date(item.timestamp).toLocaleTimeString()}</p>
                                 </div>
                              </div>
                              
                              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                 <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3 italic">Content Draft</p>
                                 <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">"{item.content}"</p>
                                 {item.media_url && (
                                   <div className="mt-6 rounded-xl overflow-hidden border-2 border-slate-100 dark:border-slate-700 aspect-video bg-black">
                                      <video controls className="w-full h-full">
                                         <source src={item.media_url} type="video/mp4" />
                                         Your browser does not support the video tag.
                                      </video>
                                   </div>
                                 )}
                              </div>
                              
                              <div className="flex gap-4">
                                 <button onClick={() => handleModerate(item.id, 'approved')} className="flex-1 bg-teal-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-teal-600/20 hover:opacity-90 transition-all">Approve Content</button>
                                 <button onClick={() => handleModerate(item.id, 'rejected')} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-red-600/20 hover:opacity-90 transition-all">Reject / Flag</button>
                              </div>
                           </div>
                           
                           <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 flex flex-col">
                              <div className="flex items-center gap-3 mb-6">
                                 <div className={`p-2 rounded-xl ${item.ai_review?.safety_score > 0.7 ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
                                    <Sparkles size={24} />
                                 </div>
                                 <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Gemini AI Audit</h4>
                              </div>
                              
                              <div className="space-y-6 flex-1">
                                 <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                                    <div className="flex justify-between items-center mb-2">
                                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compliance Score</span>
                                       <span className={`text-sm font-black ${item.ai_review?.safety_score > 0.7 ? 'text-green-500' : 'text-red-500'}`}>
                                          {Math.round(item.ai_review?.safety_score * 100)}%
                                       </span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                       <div 
                                          className={`h-full transition-all duration-1000 ${item.ai_review?.safety_score > 0.7 ? 'bg-green-500' : 'bg-red-500'}`} 
                                          style={{ width: `${item.ai_review?.safety_score * 100}%` }}
                                       ></div>
                                    </div>
                                 </div>
                                 
                                 <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">AI Reasoning</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                       {item.ai_review?.comments}
                                    </p>
                                 </div>
                                 
                                  {item.ai_review?.flagged_keywords?.length > 0 && (
                                   <div>
                                      <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Flagged Entities</p>
                                      <div className="flex flex-wrap gap-2">
                                         {Array.isArray(item.ai_review.flagged_keywords) && item.ai_review.flagged_keywords.map(kw => (
                                           <span key={kw} className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-[10px] font-black border border-red-100 dark:border-red-800">
                                              {kw.toUpperCase()}
                                           </span>
                                         ))}
                                      </div>
                                   </div>
                                 )}
                              </div>
                              
                              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
                                 <p className="text-[10px] text-slate-400 font-bold uppercase text-center tracking-tighter italic">Human verification required for final publishing</p>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                 )}
              </div>
           </div>
        </div>
      );
      case 'logistics': return <PollingBoothMap isOfficer={true} />;
      case 'alerts': return (
        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700">
           <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Automated Multi-lingual Alerts</h3>
           {alertStatus && (
             <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${alertStatus.type === 'success' ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 border border-teal-100 dark:border-teal-800' : 'bg-red-50 dark:bg-red-900/30 text-red-600 border border-red-100 dark:border-red-800'}`}>
                {alertStatus.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                <p className="text-sm font-bold">{alertStatus.msg}</p>
             </div>
           )}
           <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Constituency Scope</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select 
                    value={targetBooth}
                    onChange={(e) => setTargetBooth(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-sm font-bold appearance-none cursor-pointer"
                  >
                     <option value="ALL">Entire District ({user?.district})</option>
                     {boothList.map(b => (
                       <option key={b.id} value={b.id}>{b.name}</option>
                     ))}
                  </select>
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex items-center gap-3">
                     <Users className="text-indigo-600" size={20} />
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Target Voters</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white">
                          {targetBooth === 'ALL' ? '~12,400' : '~450'}
                        </p>
                     </div>
                  </div>
                </div>
              </div>
              <textarea 
                ref={officerAlertRef}
                placeholder="Draft notification (e.g., Polling time extended by 1 hour)" 
                className="w-full h-32 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700"
              ></textarea>
              <div className="flex flex-wrap gap-2">
                 {['Hindi', 'Marathi', 'English', 'Tamil'].map(l => (
                   <span key={l} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-bold text-slate-500">{l}</span>
                 ))}
              </div>
              <button 
                onClick={async () => {
                  const content = officerAlertRef.current?.value;
                  if (!content) return;
                  setAlertStatus(null);
                  try {
                     const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/ext/system-alerts`, {
                        method: 'POST',
                        headers: {
                           'Content-Type': 'application/json',
                           'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ 
                          content, 
                          constituency: targetBooth === 'ALL' ? user?.district : targetBooth 
                        })
                     });
                     const data = await res.json();
                     if (res.ok) {
                        setAlertStatus({ type: 'success', msg: `Broadcast Successful to ${targetBooth === 'ALL' ? user?.district : targetBooth}` });
                        if (officerAlertRef.current) officerAlertRef.current.value = '';
                     } else {
                        setAlertStatus({ type: 'error', msg: data.detail || 'Failed to broadcast alert' });
                     }
                  } catch (err) {
                     setAlertStatus({ type: 'error', msg: 'Network error occurred' });
                  }
                }}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2"
              >
                 <Megaphone size={20} /> Push Broadcast
              </button>
           </div>
        </div>
      );
      default: return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl"><Users className="text-blue-600" size={24} /></div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Citizens</h3>
              </div>
              <p className="text-4xl font-black text-slate-900 dark:text-white">{officerData?.total_citizens || 0}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-xl"><BarChart3 className="text-teal-600" size={24} /></div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Education Reach</h3>
              </div>
              <p className="text-4xl font-black text-slate-900 dark:text-white">{Object.values(officerData?.education_levels || {}).reduce((a,b) => a+b, 0)}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl"><UserCheck className="text-orange-600" size={24} /></div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Candidates</h3>
              </div>
              <p className="text-4xl font-black text-slate-900 dark:text-white">{officerData?.candidate_count || 0}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl"><CheckCircle2 className="text-indigo-600" size={24} /></div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Phases Clear</h3>
              </div>
              <p className="text-4xl font-black text-slate-900 dark:text-white">{officerData?.campaign_milestones_completed || 0}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex items-center space-x-3 mb-6">
                <Calendar className="text-teal-600" size={24} /><h2 className="text-xl font-black text-slate-900 dark:text-white">Active Elections</h2>
              </div>
              <div className="space-y-4">
                {Array.isArray(officerData?.upcoming_elections) && officerData.upcoming_elections.map((election) => (
                  <div key={election.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-600">
                    <p className="font-bold text-slate-900 dark:text-white">{election.title}</p>
                    <p className="text-xs text-slate-500 uppercase font-black tracking-widest mt-1">{election.type}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-6"><div className="p-2 bg-yellow-500 rounded-xl"><Lightbulb className="text-slate-900" size={24} /></div><h2 className="text-2xl font-black">AI Insights</h2></div>
                <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed"><ReactMarkdown>{recommendation}</ReactMarkdown></div>
              </div>
            </div>
          </div>
        </>
      );
    }
  };

  const renderAdminView = () => {
    switch (activeTab) {
      case 'telemetry': return <AdminTelemetry mode="telemetry" />;
      case 'billing': return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Cloud Resource Consumption</h3>
              <div className="space-y-6">
                 {[
                   { service: "Gemini 1.5 Pro (Tokens)", cost: "$14.20", usage: "1.2M Tokens", progress: 65 },
                   { service: "Google Maps API", cost: "$8.50", usage: "4.2K Calls", progress: 40 },
                   { service: "GCS (Video Storage)", cost: "$2.10", usage: "125 GB", progress: 15 },
                   { service: "Speech-to-Text", cost: "$0.45", usage: "120 Mins", progress: 5 }
                 ].map(s => (
                   <div key={s.service} className="space-y-2">
                      <div className="flex justify-between text-sm font-bold">
                         <span className="text-slate-700 dark:text-slate-300">{s.service}</span>
                         <span className="text-slate-400">{s.cost} / {s.usage}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                         <div className="h-full bg-teal-500" style={{ width: `${s.progress}%` }}></div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
           <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col justify-center">
              <p className="text-xs font-black uppercase text-slate-500 mb-2">Estimated Monthly Cost</p>
              <p className="text-5xl font-black text-white mb-6">$25.25</p>
              <div className="flex items-center gap-2 text-green-400 font-bold text-sm mb-8">
                 <TrendingUp size={16} /> -12% compared to last month
              </div>
              <button className="bg-teal-500 text-slate-900 py-4 rounded-2xl font-black">View GCP Billing</button>
           </div>
        </div>
      );
      case 'audit': return <AdminTelemetry mode="audit" />;
      default: return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">System Alerts</h3>
              <p className="text-sm text-slate-500 mb-6">Global platform alerts and emergency notifications.</p>
              <div className="space-y-4">
                 <textarea 
                   ref={adminAlertRef}
                   placeholder="Type urgent system-wide message..."
                   className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700 text-sm"
                 ></textarea>
                 <button 
                   onClick={async () => {
                     const content = adminAlertRef.current?.value;
                     if (!content) return;
                     try {
                        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/ext/system-alerts`, {
                           method: 'POST',
                           headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
                           },
                           body: JSON.stringify({ content })
                        });
                        const data = await res.json();
                        alert(data.message);
                        if (adminAlertRef.current) adminAlertRef.current.value = '';
                     } catch (err) {
                        console.error(err);
                     }
                   }}
                   className="w-full bg-red-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                 >
                    <Megaphone size={18} /> New System Alert
                 </button>
              </div>
           </div>
           <div className="bg-indigo-600 rounded-3xl p-8 text-white flex flex-col justify-center">
              <h3 className="text-2xl font-black mb-4 flex items-center"><ShieldAlert className="mr-2" /> BOT PROTECTION</h3>
              <p className="text-indigo-100 text-sm mb-6">Anomaly detection is active. 0 suspicious IP spikes in last 24 hours.</p>
              <div className="px-4 py-2 bg-white/10 rounded-xl font-bold text-xs">STATUS: OPTIMAL</div>
           </div>
        </div>
      );
    }
  };

  const renderContent = () => {
    switch (user?.role) {
      case 'candidate': return renderCandidateView();
      case 'officer': return renderOfficerView();
      case 'admin': return renderAdminView();
      default: return renderCitizenView();
    }
  };

  const getDashboardTitle = () => {
    switch (user?.role) {
      case 'candidate': return 'Candidate Hub';
      case 'officer': return 'Officer Command Center';
      case 'admin': return 'Admin Control Center';
      default: return `Welcome, ${user?.name.split(' ')[0]}!`;
    }
  };

  const getDashboardSubtitle = () => {
    switch (user?.role) {
      case 'candidate': return `Campaign Management for ${user?.assembly_constituency}`;
      case 'officer': return `District Management for ${user?.district}`;
      case 'admin': return 'Platform Health & Security Dashboard';
      default: return 'Your impact on democracy today.';
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white">{getDashboardTitle()}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">{getDashboardSubtitle()}</p>
        </div>
        <div className="hidden md:flex gap-4">
           {user?.role === 'citizen' && (
             <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600"><Heart size={16} /></div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Voter Status</p>
                   <p className="text-xs font-black text-slate-900 dark:text-white">REGISTERED</p>
                </div>
             </div>
           )}
        </div>
      </div>

      {renderRoleNavigation()}
      {renderContent()}
    </div>
  );
}