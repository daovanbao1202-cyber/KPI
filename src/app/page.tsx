'use client';

import Link from 'next/link';
import { ArrowRight, BarChart2, PieChart, TrendingUp, Activity, LayoutDashboard, Compass } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-[#555cf8] selection:text-white pb-32">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto border-b border-transparent">
        <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="relative w-8 h-8 rounded-full bg-[#82aecd] mr-1 overflow-hidden flex-shrink-0 shadow-sm">
             <div className="absolute top-[33%] left-0 w-full h-[2.5px] bg-white"></div>
             <div className="absolute top-[66%] left-0 w-full h-[2.5px] bg-white"></div>
             <div className="absolute top-0 left-1/2 w-[2.5px] h-full bg-white -translate-x-1/2"></div>
          </div>
          <span className="text-[22px] text-[#1e293b] tracking-wide mt-0.5" style={{ fontFamily: 'Georgia, serif' }}>DAEKHON VINA</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <Link href="#" className="text-[14px] font-bold text-gray-500 hover:text-[#555cf8] transition-colors">Features</Link>
          <Link href="#" className="text-[14px] font-bold text-gray-500 hover:text-[#555cf8] transition-colors">Solutions</Link>
          <Link href="#" className="text-[14px] font-bold text-gray-500 hover:text-[#555cf8] transition-colors">Pricing</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="hidden sm:block text-[14px] font-bold text-[#475569] hover:text-[#1e293b]">Log in</Link>
          <Link href="/dashboard" className="bg-[#1e293b] hover:bg-[#0f172a] text-white px-5 py-2.5 rounded-full text-[13px] font-bold transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 whitespace-nowrap">
            Go to Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-16 pb-20 overflow-hidden">
        {/* Background Ambient Gradients */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#f0f6ff] to-white -z-10"></div>
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[50%] bg-[#bae6fd]/40 blur-[100px] rounded-full -z-10 pointer-events-none"></div>
        <div className="absolute top-[20%] right-[-5%] w-[30%] h-[60%] bg-[#c7d2fe]/30 blur-[120px] rounded-full -z-10 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-8 relative z-10 flex flex-col items-center text-center">
           
           {/* Badge */}
           <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/70 border border-blue-100 shadow-sm mb-8 backdrop-blur-md animate-fade-in hover:shadow-md transition-shadow cursor-pointer">
              <span className="bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full tracking-wider">AI UPDATE</span>
              <span className="text-[13px] font-bold text-[#1e293b]">Experience intelligent KPI tracking</span>
              <ArrowRight size={14} className="text-[#64748b]" />
           </div>

           {/* Title */}
           <h1 className="text-[52px] md:text-[76px] font-[900] text-[#0f172a] tracking-tight mb-6 max-w-4xl drop-shadow-sm leading-[1.05]">
              Master your KPIs with <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#555cf8] to-[#0ea5e9]">
                 Artificial Intelligence
              </span>
           </h1>
           
           <p className="text-[16px] md:text-[18px] text-[#64748b] font-medium mb-10 max-w-2xl leading-relaxed">
             Track, analyze, and optimize your business performance in real-time. Our AI-powered platform predicts trends and builds beautiful dashboards automatically.
           </p>

           <div className="flex flex-col sm:flex-row items-center gap-4 mb-20 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <Link href="/dashboard" className="bg-[#555cf8] hover:bg-[#4a51e2] text-white px-8 py-4 rounded-full text-[15px] font-bold transition-all shadow-[0_8px_30px_rgba(85,92,248,0.3)] hover:shadow-[0_8px_40px_rgba(85,92,248,0.4)] flex items-center gap-2 group w-full sm:w-auto justify-center">
                 Start generating reports <ArrowRight size={18} strokeWidth={2.5} className="group-hover:translate-x-1.5 transition-transform" />
              </Link>
              <button className="bg-white hover:bg-gray-50 text-[#1e293b] border border-gray-200 px-8 py-4 rounded-full text-[15px] font-bold transition-all shadow-sm w-full sm:w-auto">
                 Book a Demo
              </button>
           </div>

           {/* The Animated CSS Composition (Replicating the Screenshot Concept) */}
           <div className="relative w-full max-w-[1000px] h-[550px] flex items-center justify-center perspective-1000 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              
              {/* === LEFT DARK DASHBOARD === */}
              <div className="absolute left-[2%] md:left-[5%] top-[15%] w-[350px] md:w-[450px] h-[340px] bg-[#111827] rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden animate-float-slow opacity-95 hover:opacity-100 hover:z-30 transition-all duration-300 transform-gpu">
                 <div className="h-7 bg-[#1f2937] flex items-center px-4 gap-1.5 border-b border-white/5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div><div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div><div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                 </div>
                 <div className="p-4 grid grid-cols-2 gap-4">
                    {/* Widget 1: Line Chart */}
                    <div className="bg-[#1f2937] h-32 rounded-lg p-3 flex flex-col justify-between border border-white/5">
                       <div className="w-20 h-2 bg-[#374151] rounded-full mb-2"></div>
                       <svg viewBox="0 0 100 40" className="w-full h-16"><path d="M0,30 Q25,0 50,20 T100,10" fill="none" stroke="#22d3ee" strokeWidth="2.5"/><path d="M0,15 Q25,35 50,15 T100,25" fill="none" stroke="#c084fc" strokeWidth="2.5"/></svg>
                    </div>
                    {/* Widget 2: Metric */}
                    <div className="bg-[#0ea5e9] flex flex-col items-center justify-center rounded-lg shadow-inner text-white">
                       <span className="text-3xl font-bold tracking-tighter">124k</span>
                       <span className="text-xs font-semibold opacity-80 mt-1 uppercase tracking-widest">Active</span>
                    </div>
                    {/* Widget 3: Donut */}
                    <div className="bg-[#1f2937] h-32 rounded-lg flex items-center justify-center border border-white/5">
                       <div className="w-20 h-20 rounded-full border-[10px] border-[#84cc16] border-t-[#374151] border-r-[#eab308]"></div>
                    </div>
                    {/* Widget 4: Purple Metric */}
                    <div className="bg-[#7c3aed] flex flex-col items-center justify-center rounded-lg shadow-inner text-white">
                       <span className="text-3xl font-bold tracking-tighter">$18k</span>
                       <span className="text-[10px] font-semibold opacity-80 mt-1 uppercase tracking-widest">Revenue</span>
                    </div>
                 </div>
              </div>

              {/* === RIGHT DARK DASHBOARD === */}
              <div className="absolute right-[2%] md:right-[5%] top-[25%] w-[350px] md:w-[450px] h-[340px] bg-[#1e293b] rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] border border-[#334155] overflow-hidden animate-float-delayed opacity-90 hover:opacity-100 hover:z-30 transition-all duration-300 transform-gpu">
                 <div className="h-7 bg-[#0f172a] flex items-center px-4 gap-2 justify-end">
                    <div className="w-16 h-2 rounded-full bg-[#334155]"></div><div className="w-4 h-4 rounded-full bg-indigo-500"></div>
                 </div>
                 <div className="p-5 flex flex-col gap-4">
                    <div className="flex gap-4 h-28">
                       <div className="w-1/3 bg-gradient-to-br from-[#38bdf8] to-[#0284c7] rounded-lg flex flex-col items-center justify-center text-white font-bold">
                          <Activity size={24} className="mb-2 opacity-80" />
                          <span className="text-2xl">99%</span>
                       </div>
                       {/* Bar Chart */}
                       <div className="w-2/3 bg-[#0f172a] rounded-lg p-4 flex items-end gap-3 justify-center border border-[#334155]">
                          <div className="w-6 bg-[#22d3ee] h-[40%] rounded-t-sm"></div>
                          <div className="w-6 bg-[#c084fc] h-[80%] rounded-t-sm"></div>
                          <div className="w-6 bg-[#84cc16] h-[60%] rounded-t-sm"></div>
                          <div className="w-6 bg-[#3b82f6] h-[90%] rounded-t-sm"></div>
                       </div>
                    </div>
                    {/* Gauge Chart */}
                    <div className="w-full bg-[#0f172a] h-32 rounded-lg relative overflow-hidden border border-[#334155]">
                       <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 w-48 h-48 rounded-full border-[18px] border-[#10b981] border-r-[#334155] border-b-[#334155] transform -rotate-45"></div>
                       <div className="absolute top-[40%] left-1/2 -translate-x-1/2 text-white flex flex-col items-center">
                          <span className="font-extrabold text-3xl">85%</span>
                          <span className="text-[10px] text-gray-400 font-bold tracking-widest mt-1">COMPANY GOAL</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* === CENTER WHITE DASHBOARD (MAIN) === */}
              <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[400px] md:w-[600px] h-[380px] bg-white rounded-xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] border border-gray-200 overflow-hidden animate-float z-20 transform-gpu">
                 <div className="h-10 bg-gray-50 border-b border-gray-100 flex items-center px-4 justify-between">
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div><div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div><div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div></div>
                    <div className="bg-white w-48 h-5 rounded-md border border-gray-200 flex items-center justify-center gap-2"><div className="w-3 h-3 bg-green-400 rounded-sm"></div><span className="text-[9px] font-bold text-gray-400">add a chart</span></div>
                    <div className="w-10 h-5 bg-gray-200 rounded-full flex items-center p-0.5"><div className="w-4 h-4 bg-white rounded-full translate-x-5"></div></div>
                 </div>
                 <div className="p-4 grid grid-cols-2 gap-4 h-[calc(100%-40px)]">
                    {/* Widget 1: Multi-bar */}
                    <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-4 flex flex-col transition-shadow hover:shadow-md">
                       <div className="flex items-center gap-2 mb-6"><div className="w-16 h-2 bg-gray-200 rounded-full"></div></div>
                       <div className="flex-1 flex flex-col justify-center gap-3">
                          <div className="flex items-center gap-2"><div className="w-full border-t-[8px] border-[#38bdf8] rounded-full"></div><span className="text-[10px] font-bold text-gray-400">82</span></div>
                          <div className="flex items-center gap-2"><div className="w-3/4 border-t-[8px] border-[#84cc16] rounded-full"></div><span className="text-[10px] font-bold text-gray-400">45</span></div>
                          <div className="flex items-center gap-2"><div className="w-5/6 border-t-[8px] border-[#c084fc] rounded-full"></div><span className="text-[10px] font-bold text-gray-400">67</span></div>
                       </div>
                    </div>
                    {/* Widget 2: Huge Metric */}
                    <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-4 flex flex-col justify-center items-center relative overflow-hidden transition-shadow hover:shadow-md">
                       <span className="text-4xl font-[900] text-[#1e293b] mb-2 tracking-tighter">2,204</span>
                       <div className="flex items-center gap-1 text-green-500 font-bold text-sm bg-green-50 px-2.5 py-1 rounded-full">
                          <TrendingUp size={14} strokeWidth={3} /> +12%
                       </div>
                       <svg viewBox="0 0 100 30" className="absolute bottom-0 w-full h-12 opacity-30"><path d="M0,30 L0,20 Q25,5 50,15 T100,5 L100,30 Z" fill="#38bdf8"/></svg>
                    </div>
                    {/* Widget 3: Full Donut */}
                    <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-4 flex flex-col items-center justify-center transition-shadow hover:shadow-md">
                       <div className="flex items-center gap-2 w-full mb-2"><div className="w-24 h-2 bg-gray-200 rounded-full"></div></div>
                       <div className="w-24 h-24 rounded-full border-[12px] border-[#84cc16] border-r-[#eab308] border-b-[#c084fc] border-l-[#38bdf8]"></div>
                    </div>
                    {/* Widget 4: Classic Line */}
                    <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-4 flex flex-col transition-shadow hover:shadow-md">
                        <div className="flex items-center gap-2 mb-4"><div className="w-20 h-2 bg-gray-200 rounded-full"></div></div>
                       <div className="flex-1 flex items-end">
                          <svg viewBox="0 0 100 40" className="w-full h-16 overflow-visible">
                            <path d="M0,35 L25,25 L50,30 L75,10 L100,15" fill="none" stroke="#22d3ee" strokeWidth="3"/>
                            <circle cx="25" cy="25" r="3" fill="#0ea5e9"/>
                            <circle cx="50" cy="30" r="3" fill="#0ea5e9"/>
                            <circle cx="75" cy="10" r="4" fill="#0ea5e9" className="animate-pulse"/>
                          </svg>
                       </div>
                    </div>
                 </div>
              </div>

              {/* === FLOATING ACTION TOOLBAR (FOREGROUND) === */}
              <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 bg-white/90 rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.2)] border border-gray-100 p-2.5 flex items-center gap-2.5 z-40 backdrop-blur-xl animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
                 <button className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-[#555cf8] hover:bg-gray-50 rounded-xl transition-colors"><BarChart2 size={22} strokeWidth={2.5} /></button>
                 <button className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-[#555cf8] hover:bg-gray-50 rounded-xl transition-colors"><TrendingUp size={22} strokeWidth={2.5} /></button>
                 <button className="w-14 h-14 flex items-center justify-center bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] text-white rounded-[14px] shadow-lg shadow-blue-500/40 transform scale-110 hover:scale-125 transition-transform"><PieChart size={24} strokeWidth={2.5} /></button>
                 <button className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-[#555cf8] hover:bg-gray-50 rounded-xl transition-colors"><Activity size={22} strokeWidth={2.5} /></button>
                 <button className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-[#555cf8] hover:bg-gray-50 rounded-xl transition-colors"><LayoutDashboard size={22} strokeWidth={2.5} /></button>
              </div>

           </div>
        </div>
      </header>

      {/* Required Animations Injected via style tag */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% { transform: translate(-50%, 0); }
          50% { transform: translate(-50%, -15px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-18px); }
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 7s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite 2s; }
        .animate-fade-in-up { animation: fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .animate-fade-in { animation: fade-in 1s ease-out forwards; }
      `}} />

    </div>
  );
}
