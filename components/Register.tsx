import React, { useState } from 'react';
import { School, User, Lock, AlertCircle, ArrowRight, Mail, BadgeCheck, ArrowLeft } from 'lucide-react';
import { SystemUser } from '../types';

interface RegisterProps {
  onRegister: (user: SystemUser) => void;
  onNavigateToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister, onNavigateToLogin }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Password Strength Logic
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length > 5) score += 1;
    if (pass.length > 9) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const getStrengthColor = (score: number) => {
    if (score < 3) return 'bg-red-400';
    if (score < 5) return 'bg-yellow-400';
    return 'bg-green-500';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
        setError("Password must be at least 6 characters.");
        setIsLoading(false);
        return;
    }

    try {
        const usernameToUse = formData.username || formData.email;
        const registrationData = {
            id: `USER-${Date.now()}`,
            username: usernameToUse,
            password: formData.password,
            employeeId: `EMP-${Date.now()}`, // In a real app, this might link to an actual employee record
            roleIds: ['ROLE-ADMIN'],
            isActive: true
        };

        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registrationData),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Registration failed');
        }

        const newUser = await response.json();
        onRegister(newUser);
    } catch (err: any) {
        console.error(err);
        setError(err.message || "Registration failed. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in duration-300">
        
        {/* Brand Section */}
        <div className="md:w-1/2 bg-slate-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full filter blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500 rounded-full filter blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
          </div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border border-white/20">
               <School size={32} />
            </div>
            <h1 className="text-4xl font-bold mb-2">Join OLA MIS</h1>
            <p className="text-slate-300 text-lg">Admin Registration Portal</p>
          </div>

          <div className="relative z-10 mt-12">
            <div className="space-y-6">
               <div className="p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                   <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
                       <BadgeCheck className="text-blue-400" size={18} />
                       Admin Privileges
                   </h3>
                   <p className="text-sm text-slate-300">
                       Creating an account here grants full administrative access to student records, staff directory, and system settings.
                   </p>
               </div>
            </div>
          </div>
          
          <div className="mt-8">
              <button 
                onClick={onNavigateToLogin}
                className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-sm font-medium"
              >
                  <ArrowLeft size={16} />
                  Back to Login
              </button>
          </div>
        </div>

        {/* Register Form Section */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white h-full overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Create Admin Account</h2>
            <p className="text-slate-500 text-sm mt-1">Enter your details to register as a new administrator.</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3 animate-in slide-in-from-top-2">
              <AlertCircle size={20} className="text-red-500 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">First Name</label>
                    <input
                        name="firstName"
                        required
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                        placeholder="e.g. John"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Last Name</label>
                    <input
                        name="lastName"
                        required
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                        placeholder="e.g. Doe"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="admin@ola.edu.gh"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="Choose a username (optional)"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Password</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock size={16} />
                        </div>
                        <input
                        type="password"
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                        placeholder="Create password (min 6 chars)"
                        />
                    </div>
                    {/* Password Strength Meter */}
                    {formData.password && (
                        <div className="pt-1">
                            <div className="flex gap-1 h-1">
                                {[1, 2, 3, 4, 5].map((level) => (
                                    <div 
                                        key={level}
                                        className={`flex-1 rounded-full transition-colors duration-300 ${
                                            passwordStrength >= level ? getStrengthColor(passwordStrength) : 'bg-slate-100'
                                        }`}
                                    />
                                ))}
                            </div>
                            <div className="flex justify-between items-center mt-1">
                                <p className="text-[10px] text-slate-400">
                                   Strength: <span className={`font-bold ${
                                       passwordStrength < 3 ? 'text-red-500' : passwordStrength < 5 ? 'text-yellow-600' : 'text-green-600'
                                   }`}>{
                                       passwordStrength < 3 ? 'Weak' : passwordStrength < 5 ? 'Medium' : 'Strong'
                                   }</span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Confirm Password</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock size={16} />
                        </div>
                        <input
                        type="password"
                        name="confirmPassword"
                        required
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                        placeholder="Confirm password"
                        />
                    </div>
                </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-lg transition-all shadow-lg shadow-slate-500/30 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Register Account</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
             <p className="text-sm text-slate-500">
               Already have an account? {' '}
               <button onClick={onNavigateToLogin} className="text-blue-600 hover:underline font-semibold">
                 Sign In
               </button>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;