import React, { useState, useEffect } from 'react';
import useStore from '../store';
import { Award, TrendingUp, User } from 'lucide-react';

export default function Leaderboard() {
  const { token, user } = useStore();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/leaderboard/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setLeaders(data);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [token]);

  if (loading) return <div className="p-8 text-center dark:text-white">Loading Leaderboard...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center space-x-4 mb-8">
        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl">
          <Award className="text-yellow-600 dark:text-yellow-400" size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Citizen Leaderboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Top contributors in {user?.district} district</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
        <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <div className="col-span-1">Rank</div>
          <div className="col-span-6">Citizen</div>
          <div className="col-span-3">Constituency</div>
          <div className="col-span-2 text-right">Points</div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {leaders.map((leader) => {
            const isMe = leader.name === user?.name;
            return (
              <div key={leader.rank} className={`grid grid-cols-12 gap-4 px-8 py-5 items-center transition-colors ${isMe ? 'bg-teal-50 dark:bg-teal-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}>
                <div className="col-span-1">
                  <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                    leader.rank === 1 ? 'bg-yellow-100 text-yellow-700' : 
                    leader.rank === 2 ? 'bg-slate-200 text-slate-700' : 
                    leader.rank === 3 ? 'bg-orange-100 text-orange-700' : 
                    'text-slate-400'
                  }`}>
                    {leader.rank}
                  </span>
                </div>
                <div className="col-span-6 flex items-center space-x-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                    <User size={18} className="text-slate-500" />
                  </div>
                  <div>
                    <p className={`font-bold ${isMe ? 'text-teal-700 dark:text-teal-400' : 'text-slate-900 dark:text-white'}`}>
                      {leader.name} {isMe && <span className="text-[10px] bg-teal-600 text-white px-1.5 py-0.5 rounded-md ml-2 uppercase">You</span>}
                    </p>
                  </div>
                </div>
                <div className="col-span-3 text-sm text-slate-600 dark:text-slate-400 font-medium">
                  {leader.assembly_constituency}
                </div>
                <div className="col-span-2 text-right font-black text-slate-900 dark:text-white">
                  {leader.total_points.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {leaders.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl mt-8 border-2 border-dashed border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400">No data available for this district yet.</p>
        </div>
      )}
    </div>
  );
}