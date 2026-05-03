import React, { useState, useEffect } from 'react';
import useStore from '../store';
import { Users, UserPlus, Edit2, Trash2, ShieldCheck, ShieldAlert, X, Check } from 'lucide-react';

export default function Family() {
  const { token, user } = useStore();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    relation: '',
    voter_id: '',
    is_registered: false
  });

  useEffect(() => {
    fetchMembers();
  }, [token]);

  const fetchMembers = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/family/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setMembers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingMember 
      ? `${import.meta.env.VITE_API_BASE_URL}/api/v1/family/${editingMember.id}`
      : `${import.meta.env.VITE_API_BASE_URL}/api/v1/family/`;
    
    const method = editingMember ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setShowModal(false);
        setEditingMember(null);
        setFormData({ name: '', age: '', relation: '', voter_id: '', is_registered: false });
        fetchMembers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this family member?')) return;
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/family/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchMembers();
    } catch (err) {
      console.error(err);
    }
  };

  const openModal = (member = null) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        name: member.name,
        age: member.age,
        relation: member.relation,
        voter_id: member.voter_id || '',
        is_registered: member.is_registered
      });
    } else {
      setEditingMember(null);
      setFormData({ name: '', age: '', relation: '', voter_id: '', is_registered: false });
    }
    setShowModal(true);
  };

  if (loading) return <div className="p-8 text-center dark:text-white font-bold animate-pulse">Loading Family Tree...</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">
            Family <span className="text-teal-600">Unit</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Manage and track the voting readiness of your household.</p>
        </div>
        
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all font-bold"
        >
          <UserPlus size={20} /> Add Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map(member => (
          <div key={member.id} className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-3 rounded-2xl ${member.is_registered ? 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                {member.is_registered ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModal(member)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-teal-500"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(member.id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{member.name}</h3>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">{member.relation} • {member.age} years</p>
            
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400">Voter ID</span>
                <span className="font-mono text-slate-900 dark:text-slate-200">{member.voter_id || 'Not Provided'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400">Registration</span>
                <span className={`font-black px-2 py-0.5 rounded-md ${member.is_registered ? 'bg-teal-50 text-teal-600' : 'bg-red-50 text-red-600'}`}>
                  {member.is_registered ? 'VERIFIED' : 'PENDING'}
                </span>
              </div>
            </div>
          </div>
        ))}

        {members.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
             <Users size={48} className="mx-auto text-slate-300 mb-4" />
             <p className="text-slate-500 dark:text-slate-400 font-medium">No family members added yet. Start building your unit!</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-white/10">
            <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">{editingMember ? 'Edit Member' : 'Add Family Member'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Age</label>
                  <input 
                    required
                    type="number" 
                    value={formData.age}
                    onChange={e => setFormData({...formData, age: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Relation</label>
                  <select 
                    required
                    value={formData.relation}
                    onChange={e => setFormData({...formData, relation: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none dark:text-white appearance-none"
                  >
                    <option value="">Select...</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Child">Child</option>
                    <option value="Grandparent">Grandparent</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Voter ID (Optional)</label>
                  <input 
                    type="text" 
                    value={formData.voter_id}
                    onChange={e => setFormData({...formData, voter_id: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none dark:text-white"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <input 
                    type="checkbox" 
                    id="is_registered"
                    checked={formData.is_registered}
                    onChange={e => setFormData({...formData, is_registered: e.target.checked})}
                    className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <label htmlFor="is_registered" className="text-sm font-bold text-slate-700 dark:text-slate-300">Verified on Electoral Roll</label>
                </div>
              </div>
              
              <button type="submit" className="w-full bg-slate-900 dark:bg-teal-600 text-white py-4 rounded-2xl font-black shadow-xl hover:opacity-90 transition-all">
                {editingMember ? 'Update Member Details' : 'Save Family Member'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
