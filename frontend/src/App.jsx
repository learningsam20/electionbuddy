import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Chatbot from './pages/Chatbot';
import QuizMode from './pages/QuizMode';
import Timeline from './pages/Timeline';
import Leaderboard from './pages/Leaderboard';
import useStore from './store';
import Layout from './components/Layout';
import ThemeToggle from './components/ThemeToggle';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen text-slate-900 dark:text-slate-50 transition-colors">
        <Routes>
          <Route path="/login" element={<><ThemeToggle /><Login /></>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/timeline" element={<ProtectedRoute><Timeline /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chatbot /></ProtectedRoute>} />
          <Route path="/quiz" element={<ProtectedRoute><QuizMode /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
export default App;