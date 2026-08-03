'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useKPI } from '@/context/KPIContext';
import { Target, Lock, Mail, ArrowRight, ShieldCheck, Zap, X, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

/** `useSearchParams` requires a Suspense boundary above it. */
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc]" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // Typing a password you cannot see is the usual reason a correct one "fails".
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useKPI();

  // First-time password setup, for accounts migrated without a credential.
  const [setupEmail, setSetupEmail] = useState<string | null>(null);
  const [setupDone, setSetupDone] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [setupError, setSetupError] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [showSetupPassword, setShowSetupPassword] = useState(false);

  const destination = searchParams.get('next') || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await login(email, password);

    if (result.status === 'ok') {
      router.push(destination);
    } else if (result.status === 'needs-password-setup') {
      setSetupEmail(result.email);
      setSetupDone(false);
      setNewPassword('');
      setConfirmPassword('');
      setSetupError('');
    } else {
      setError(result.message);
    }

    setIsLoading(false);
  };

  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError('');

    if (newPassword !== confirmPassword) {
      setSetupError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setIsSettingUp(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: setupEmail, newPassword }),
      });
      const payload = await res.json();

      if (!res.ok) {
        setSetupError(payload.error || 'Không đặt được mật khẩu.');
        return;
      }

      // Sign straight in with the credential that was just created.
      const result = await login(setupEmail as string, newPassword);
      if (result.status === 'ok') {
        setSetupDone(true);
        router.push(destination);
      } else {
        setSetupDone(true);
      }
    } catch {
      setSetupError('Không kết nối được tới máy chủ.');
    } finally {
      setIsSettingUp(false);
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
                     {/* Self-service reset removed: it let anyone change any
                         account's password by typing that person's email. */}
                     <span className="text-xs font-medium text-slate-400">
                        Quên mật khẩu? Liên hệ Admin
                     </span>
                  </div>
                  <div className="relative group">
                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                        <Lock size={18} />
                     </div>
                     <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
                     />
                     <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                     >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                     </button>
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
                  Chưa có tài khoản? <span className="text-blue-600 font-bold">Liên hệ quản trị viên</span>
               </p>
            </div>
         </div>
      </div>

      {/* First-time password setup */}
      {setupEmail && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
               {/* Modal Header */}
               <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                     <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                        <Lock size={18} />
                     </div>
                     <span className="font-bold text-slate-800">Đặt mật khẩu lần đầu</span>
                  </div>
                  <button
                     onClick={() => setSetupEmail(null)}
                     className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-all"
                  >
                     <X size={18} />
                  </button>
               </div>

               {/* Modal Content */}
               <div className="p-6">
                  {setupError && (
                     <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>{setupError}</span>
                     </div>
                  )}

                  {!setupDone ? (
                     <form onSubmit={handleCreatePassword} className="space-y-4">
                        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 mb-2">
                           <p className="text-xs text-blue-800 font-medium leading-relaxed">
                              Tài khoản <span className="font-bold text-blue-900">{setupEmail}</span> chưa
                              có mật khẩu. Vui lòng tạo mật khẩu để bảo vệ tài khoản của bạn.
                           </p>
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-xs font-bold text-slate-600 ml-1">Mật khẩu mới</label>
                           <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                 <Lock size={16} />
                              </div>
                              <input
                                 type={showSetupPassword ? 'text' : 'password'}
                                 required
                                 value={newPassword}
                                 onChange={(e) => setNewPassword(e.target.value)}
                                 placeholder="Tối thiểu 8 ký tự, gồm chữ và số"
                                 className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                              />
                              <button
                                 type="button"
                                 onClick={() => setShowSetupPassword(!showSetupPassword)}
                                 aria-label={showSetupPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                 className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                              >
                                 {showSetupPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                           </div>
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-xs font-bold text-slate-600 ml-1">Xác nhận mật khẩu</label>
                           <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                 <Lock size={16} />
                              </div>
                              <input
                                 type={showSetupPassword ? 'text' : 'password'}
                                 required
                                 value={confirmPassword}
                                 onChange={(e) => setConfirmPassword(e.target.value)}
                                 placeholder="Nhập lại mật khẩu"
                                 className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                              />
                           </div>
                        </div>

                        <button
                           type="submit"
                           disabled={isSettingUp}
                           className="w-full bg-[#10b981] hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-md transition-all mt-2 text-sm flex items-center justify-center gap-1.5 disabled:opacity-70"
                        >
                           {isSettingUp ? 'Đang lưu...' : 'Tạo mật khẩu và đăng nhập'}
                        </button>
                     </form>
                  ) : (
                     <div className="text-center py-4 space-y-4">
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full">
                           <CheckCircle2 size={36} />
                        </div>
                        <div className="space-y-2">
                           <h3 className="font-bold text-slate-800 text-lg">Đã tạo mật khẩu!</h3>
                           <p className="text-xs text-slate-500 leading-relaxed px-4">
                              Mật khẩu đã được mã hoá và lưu trên máy chủ. Bạn có thể dùng mật khẩu này để đăng nhập.
                           </p>
                        </div>
                        <button
                           onClick={() => setSetupEmail(null)}
                           className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow-md transition-all text-sm mt-2"
                        >
                           Quay lại đăng nhập
                        </button>
                     </div>
                  )}
               </div>
            </div>
         </div>
      )}
    </div>
  );
}

