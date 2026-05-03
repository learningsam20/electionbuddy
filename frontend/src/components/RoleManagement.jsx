import React, { useState, useEffect } from 'react';
import useStore from '../store';
import { UserCog, ShieldCheck, User, Users, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function RoleManagement() {
  const { token } = useStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/v1/admin/ext/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const res = await fetch(`/api/v1/admin/ext/update-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: userId, new_role: newRole })
      });
      const data = await res.json();
      setMessage(data.message);
      fetchUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse dark:text-white">Loading User Directory...</div>;

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <UserCog className="text-teal-500" size={28} /> Global Role Management
           </h3>
           {message && (
             <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl text-xs font-black animate-bounce">
                {message}
             </div>
           )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4 text-center">User</th>
                <th className="px-8 py-4">Current Role</th>
                <th className="px-8 py-4">District</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {Array.isArray(users) && users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      u.role === 'admin' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                      u.role === 'officer' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                      u.role === 'candidate' ? 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' :
                      'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">{u.district || 'Global'}</td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       {['citizen', 'candidate', 'officer'].filter(r => r !== u.role).map(r => (
                         <button
                           key={r}
                           onClick={() => handleUpdateRole(u.id, r)}
                           className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-teal-500 hover:text-white dark:hover:bg-teal-600 rounded-lg text-[10px] font-black uppercase transition-all"
                         >
                           Set {r}
                         </button>
                       ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <ShieldAlert size={120} className="absolute -right-8 -bottom-8 text-white/10" />
            <h4 className="text-2xl font-black mb-4">Security Protocol</h4>
            <p className="text-indigo-100 leading-relaxed text-sm">Role updates are immediate. When a user is promoted to <strong>Officer</strong> or <strong>Candidate</strong>, they gain access to specialized command centers and AI tools.</p>
         </div>
         <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <CheckCircle2 size={120} className="absolute -right-8 -bottom-8 text-white/10" />
            <h4 className="text-2xl font-black mb-4">Compliance Check</h4>
            <p className="text-slate-400 leading-relaxed text-sm">Ensure candidates have verified identities before promoting. All role changes are logged in the immutable Audit Log for accountability.</p>
         </div>
      </div>
    </div>
  );
}
