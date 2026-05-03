import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-[40px] p-12 border border-slate-100 dark:border-slate-700 shadow-2xl text-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-3xl flex items-center justify-center mx-auto text-red-600 mb-8">
              <AlertTriangle size={40} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Something went wrong</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              We've encountered an unexpected UI error. Don't worry, your data is safe.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 w-full bg-slate-900 dark:bg-teal-600 text-white py-4 rounded-2xl font-black shadow-xl hover:opacity-90 transition-all"
            >
              <RotateCcw size={20} /> Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
