import React, { useState, useEffect } from 'react';
import useStore from '../store';
import { Activity, Database, ShieldAlert, FileText, Cpu, Globe } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const MOCK_LATENCY_DATA = [
  { time: '12:00', latency: 45 },
  { time: '12:05', latency: 52 },
  { time: '12:10', latency: 48 },
  { time: '12:15', latency: 85 },
  { time: '12:20', latency: 42 },
  { time: '12:25', latency: 38 },
  { time: '12:30', latency: 40 },
];

export default function AdminTelemetry({ mode = 'full' }) {
  const { token } = useStore();
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (mode === 'full' || mode === 'telemetry') {
          const statsRes = await fetch(`/api/v1/admin/ext/telemetry`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (mode === 'full' || mode === 'audit') {
          const logsRes = await fetch(`/api/v1/admin/ext/audit-logs`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const logsData = await logsRes.json();
          setLogs(logsData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, mode]);

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-3xl"></div></div>;

  return (
    <div className="space-y-8">
      {(mode === 'full' || mode === 'telemetry') && (
        <>
          {/* High Level Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             {[
               { label: 'Total Users', value: stats?.total_users, icon: Database, color: 'text-blue-500' },
               { label: 'Active Sessions', value: stats?.active_users, icon: Activity, color: 'text-green-500' },
               { label: 'Avg Latency', value: `${stats?.avg_api_latency_ms}ms`, icon: Cpu, color: 'text-orange-500' },
               { label: 'Anomalies', value: 0, icon: ShieldAlert, color: 'text-red-500' }
             ].map((s, i) => (
               <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center space-x-3 mb-2">
                     <s.icon className={s.color} size={20} />
                     <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                  </div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{s.value}</p>
               </div>
             ))}
          </div>

          {/* Latency Chart */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
             <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center">
                <Activity className="text-orange-500 mr-2" size={24} /> API Performance (Last 30 mins)
             </h3>
             <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={MOCK_LATENCY_DATA}>
                      <defs>
                        <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                      <Area type="monotone" dataKey="latency" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorLatency)" />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>
        </>
      )}

      {(mode === 'full' || mode === 'audit') && (
        /* Audit Logs */
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
           <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center">
                 <FileText className="text-blue-500 mr-2" size={24} /> Immutable Audit Logs
              </h3>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase">Live Feed</span>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <tr>
                       <th className="px-8 py-4">Timestamp</th>
                       <th className="px-8 py-4">User ID</th>
                       <th className="px-8 py-4">Action</th>
                       <th className="px-8 py-4">Details</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {logs.map(log => (
                      <tr key={log.id} className="text-sm">
                         <td className="px-8 py-4 text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                         <td className="px-8 py-4 font-bold text-slate-700 dark:text-slate-300">USER_{log.user_id}</td>
                         <td className="px-8 py-4">
                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-bold">{log.action}</span>
                         </td>
                         <td className="px-8 py-4 text-slate-500">{log.details}</td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
}
