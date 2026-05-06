'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKPI } from '@/context/KPIContext';
import { Target, Lock, Mail, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Demo purposes
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useKPI();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await login(email, password);
      if (success) {
        router.push('/dashboard');
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Left side: Branding & Hero */}
      <div className="md:w-[45%] bg-[#0f172a] relative overflow-hidden flex-col items-center justify-center p-12 text-white hidden md:flex">
         <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
               <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                     <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
                  </pattern>
               </defs>
               <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
         </div>
         <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]"></div>
         <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]"></div>

         <div className="relative z-10 max-w-md text-center">
            <div className="flex items-center justify-center mb-10">
               <div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-500/20">
                  <Target size={40} className="text-white" />
               </div>
            </div>
            <h1 className="text-4xl font-extrabold mb-6 tracking-tight leading-tight">
               Master your KPIs with <span className="text-blue-500">Precision</span>.
            </h1>
            <p className="text-gray-400 text-lg mb-12 leading-relaxed">
               Welcome to DAEKHON VINA. The ultimate dashboard for cascading strategy and measuring success.
            </p>

            <div className="grid grid-cols-2 gap-4 text-left">
               <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl">
                  <Zap size={20} className="text-blue-400 mb-2" />
                  <h4 className="font-bold text-sm">Real-time Data</h4>
                  <p className="text-xs text-gray-500">Instant updates across all teams.</p>
               </div>
               <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl">
                  <ShieldCheck size={20} className="text-emerald-400 mb-2" />
                  <h4 className="font-bold text-sm">RBAC Control</h4>
                  <p className="text-xs text-gray-500">Granular permissions for everyone.</p>
               </div>
            </div>
         </div>
         
         <div className="absolute bottom-10 text-gray-500 text-xs">
            © 2026 DAEKHON VINA. All Rights Reserved.
         </div>
      </div>

      {/* Right side: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
         <div className="w-full max-w-[420px]">
            <div className="md:hidden flex items-center gap-3 mb-10">
               <div className="bg-blue-600 p-2 rounded-lg">
                  <Target size={24} className="text-white" />
               </div>
               <span className="font-bold text-xl text-slate-800">DAEKHON VINA</span>
            </div>

            <div className="mb-10">
               <h2 className="text-3xl font-bold text-slate-900 mb-2">Sign In</h2>
               <p className="text-slate-500">Enter your credentials to access your dashboard</p>
            </div>

            {error && (
               <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm font-medium animate-in fade-in slide-in-from-top-1">
                  {error}
               </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
               <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                  <div className="relative group">
                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                        <Mail size={18} />
                     </div>
                     <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="daovanbao1202@gmail.com"
                        className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
                     />
                  </div>
               </div>

               <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                     <label className="text-sm font-bold text-slate-700">Password</label>
                     <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700">Forgot?</a>
                  </div>
                  <div className="relative group">
                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                        <Lock size={18} />
                     </div>
                     <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
                     />
                  </div>
               </div>

               <div className="flex items-center gap-2 mb-2">
                  <input type="checkbox" id="remember" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  <label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer font-medium">Keep me signed in</label>
               </div>

               <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-[#3b82f6] hover:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed group"
               >
                  {isLoading ? (
                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                     <>
                        Access Dashboard
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                     </>
                  )}
               </button>
            </form>

            <div className="mt-10 pt-10 border-t border-slate-100">
               <p className="text-center text-slate-500 text-sm">
                  Don't have an account? <a href="#" className="text-blue-600 font-bold hover:underline">Contact Administrator</a>
               </p>
            </div>
            
            <div className="mt-8 bg-slate-50 rounded-xl p-4 border border-slate-100">
               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Demo Credentials</p>
               <div className="space-y-2">
                  <p className="text-xs text-slate-600 flex justify-between"><span>Admin:</span> <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">daovanbao1202@gmail.com</span></p>
                  <p className="text-xs text-slate-600 flex justify-between"><span>User:</span> <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">hung@example.com</span></p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
