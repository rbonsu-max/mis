import React, { useState } from 'react';
import { School, User, Lock, AlertCircle, ArrowRight, Mail } from 'lucide-react';
import { SystemUser } from '../types';

interface LoginProps {
  onLogin: (user: SystemUser) => void;
  onNavigateToLogin?: () => void; // Added to match some usages if any
  onNavigateToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onNavigateToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }

      const user = await response.json();
      onLogin(user);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Username or password is incorrect');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in duration-300">
        
        {/* Brand Section */}
        <div className="md:w-1/2 bg-blue-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
             <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500 rounded-full filter blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
             <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500 rounded-full filter blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
          </div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border border-white/20">
               <School size={32} />
            </div>
            <h1 className="text-4xl font-bold mb-2">OLA College</h1>
            <p className="text-blue-200 text-lg">Management Information System</p>
          </div>

          <div className="relative z-10 mt-12">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                 <div className="w-8 h-1 rounded-full bg-blue-400 mt-2"></div>
                 <p className="text-blue-100 text-sm">Comprehensive Student Record Management</p>
              </div>
              <div className="flex items-start gap-4">
                 <div className="w-8 h-1 rounded-full bg-blue-400 mt-2"></div>
                 <p className="text-blue-100 text-sm">Staff Directory & Leave Management</p>
              </div>
              <div className="flex items-start gap-4">
                 <div className="w-8 h-1 rounded-full bg-blue-400 mt-2"></div>
                 <p className="text-blue-100 text-sm">Integrated AI Assistant</p>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-blue-300/50 mt-8">© 2024 OLA College of Education</p>
        </div>

        {/* Login Form Section */}
        <div className="md:w-1/2 p-12 flex flex-col justify-center bg-white">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Welcome Back</h2>
            <p className="text-slate-500 text-sm mt-1">Please login to access your dashboard.</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3">
              <AlertCircle size={20} className="text-red-500 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 block">Username or Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 block">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
               <label className="flex items-center gap-2 cursor-pointer">
                 <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                 <span className="text-slate-600">Remember me</span>
               </label>
               <a href="#" className="text-blue-600 hover:underline font-medium">Forgot Password?</a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
             <p className="text-sm text-slate-500">
               Don't have an account?{' '}
               <button onClick={onNavigateToRegister} className="text-blue-600 hover:underline font-semibold">
                 Register as Admin
               </button>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;