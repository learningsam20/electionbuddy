import React, { useState } from 'react';
import useStore from '../store';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('citizen@ElectionBuddy.com');
  const [password, setPassword] = useState('Citizen@123');
  const [error, setError] = useState('');
  const login = useStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch(`/api/v1/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });

      if (!response.ok) throw new Error('Invalid credentials');

      const data = await response.json();
      login(data.user, data.access_token);
      
      if (data.user.role === 'officer' || data.user.role === 'admin') {
         navigate('/dashboard');
      } else {
         navigate('/timeline');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="mt-6 text-4xl font-black text-teal-600 dark:text-teal-400">ElectionBuddy</h2>
        <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Sign in to your account</h3>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow sm:rounded-xl sm:px-10 transition-colors">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email address</label>
              <input type="email" required className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-white transition-colors" value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
              <input type="password" required className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-white transition-colors" value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            <div>
              <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors dark:focus:ring-offset-slate-800">
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}