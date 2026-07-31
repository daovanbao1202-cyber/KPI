'use client';

import Link from 'next/link';
import { ArrowRight, BarChart2, PieChart, TrendingUp, Activity, LayoutDashboard } from 'lucide-react';

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

        {/* ===== LEFT HEXAGONS + BUBBLES ===== */}
        <div className="absolute left-0 top-[22%] w-[360px] h-[500px] pointer-events-none" style={{ zIndex: 5 }}>
          {/* Bubbles */}
          <div className="bubble" style={{ left: '30px',  bottom: '40%', width: '55px', height: '55px', animationDuration: '5s',   animationDelay: '0s' }}></div>
          <div className="bubble" style={{ left: '120px', bottom: '24%', width: '40px', height: '40px', animationDuration: '6.5s', animationDelay: '1.2s' }}></div>
          <div className="bubble" style={{ left: '60px',  bottom: '14%', width: '65px', height: '65px', animationDuration: '7s',   animationDelay: '2.5s' }}></div>
          <div className="bubble" style={{ left: '200px', bottom: '32%', width: '45px', height: '45px', animationDuration: '5.5s', animationDelay: '0.8s' }}></div>
          <div className="bubble" style={{ left: '22px',  bottom: '8%',  width: '35px', height: '35px', animationDuration: '8s',   animationDelay: '3.5s' }}></div>
          {/* Left Hexagons — flat-top style, many sizes, scattered */}
          <svg viewBox="0 0 360 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full animate-hex-left">
            <defs>
              <linearGradient id="hgA" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9"/>
                <stop offset="100%" stopColor="#84cc16" stopOpacity="0.9"/>
              </linearGradient>
              <linearGradient id="hgB" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.85"/>
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.85"/>
              </linearGradient>
              <linearGradient id="hgC" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.7"/>
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.7"/>
              </linearGradient>
              <linearGradient id="hgD" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#84cc16" stopOpacity="0.75"/>
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.75"/>
              </linearGradient>
              <linearGradient id="hgE" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6"/>
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.6"/>
              </linearGradient>
            </defs>
            {/* XL hexagon — top-left */}
            <polygon points="225,140 172,50 68,50 15,140 68,230 172,230" fill="none" stroke="url(#hgA)" strokeWidth="3" strokeLinejoin="round"/>
            {/* Small hexagon — top overlapping right of XL */}
            <polygon points="273,80 254,47 216,47 197,80 216,113 254,113" fill="none" stroke="url(#hgC)" strokeWidth="2" strokeLinejoin="round"/>
            {/* Large hexagon — lower center */}
            <polygon points="285,308 237,224 143,224 95,308 143,392 237,392" fill="none" stroke="url(#hgB)" strokeWidth="2.8" strokeLinejoin="round"/>
            {/* Small hexagon — right of large */}
            <polygon points="338,258 318,223 278,223 258,258 278,293 318,293" fill="none" stroke="url(#hgE)" strokeWidth="2" strokeLinejoin="round"/>
            {/* Medium hexagon — bottom right corner */}
            <polygon points="355,408 324,355 262,355 231,408 262,461 324,461" fill="none" stroke="url(#hgD)" strokeWidth="2.5" strokeLinejoin="round"/>
            {/* Tiny extra — upper area */}
            <polygon points="140,25 124,1 92,1 76,25 92,49 124,49" fill="none" stroke="url(#hgB)" strokeWidth="1.5" strokeLinejoin="round" opacity="0.45"/>
          </svg>
        </div>

        {/* ===== RIGHT HEXAGONS + BUBBLES ===== */}
        <div className="absolute right-0 top-[20%] w-[340px] h-[480px] pointer-events-none" style={{ zIndex: 5 }}>
          {/* Bubbles */}
          <div className="bubble" style={{ right: '28px',  bottom: '36%', width: '60px', height: '60px', animationDuration: '5.5s', animationDelay: '0.3s' }}></div>
          <div className="bubble" style={{ right: '130px', bottom: '22%', width: '38px', height: '38px', animationDuration: '7s',   animationDelay: '1.5s' }}></div>
          <div className="bubble" style={{ right: '62px',  bottom: '12%', width: '70px', height: '70px', animationDuration: '6s',   animationDelay: '2.2s' }}></div>
          <div className="bubble" style={{ right: '200px', bottom: '34%', width: '42px', height: '42px', animationDuration: '8s',   animationDelay: '0.6s' }}></div>
          <div className="bubble" style={{ right: '35px',  bottom: '5%',  width: '30px', height: '30px', animationDuration: '5s',   animationDelay: '4s' }}></div>
          {/* Right Hexagons */}
          <svg viewBox="0 0 340 480" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full animate-hex-right">
            <defs>
              <linearGradient id="hgF" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.9"/>
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.9"/>
              </linearGradient>
              <linearGradient id="hgG" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.75"/>
                <stop offset="100%" stopColor="#84cc16" stopOpacity="0.75"/>
              </linearGradient>
              <linearGradient id="hgH" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.6"/>
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.6"/>
              </linearGradient>
              <linearGradient id="hgI" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#84cc16" stopOpacity="0.8"/>
              </linearGradient>
              <linearGradient id="hgJ" x1="100%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.65"/>
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.65"/>
              </linearGradient>
            </defs>
            {/* XL hexagon — top right */}
            <polygon points="268,118 218,33 118,33 68,118 118,203 218,203" fill="none" stroke="url(#hgF)" strokeWidth="3" strokeLinejoin="round"/>
            {/* Small hex — left of XL */}
            <polygon points="102,178 82,145 42,145 22,178 42,211 82,211" fill="none" stroke="url(#hgI)" strokeWidth="2" strokeLinejoin="round"/>
            {/* Medium hex — lower left */}
            <polygon points="178,318 139,250 61,250 22,318 61,386 139,386" fill="none" stroke="url(#hgG)" strokeWidth="2.8" strokeLinejoin="round"/>
            {/* Small hex — right of medium */}
            <polygon points="300,272 280,238 240,238 220,272 240,306 280,306" fill="none" stroke="url(#hgJ)" strokeWidth="2" strokeLinejoin="round"/>
            {/* Medium hex — bottom center */}
            <polygon points="272,418 242,367 182,367 152,418 182,469 242,469" fill="none" stroke="url(#hgH)" strokeWidth="2.5" strokeLinejoin="round"/>
            {/* Tiny extra */}
            <polygon points="310,60 296,37 268,37 254,60 268,83 296,83" fill="none" stroke="url(#hgF)" strokeWidth="1.5" strokeLinejoin="round" opacity="0.4"/>
          </svg>
        </div>

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

           {/* The Animated Dashboard Composition — all dashboards level/horizontal */}
           <div className="relative w-full max-w-[1000px] h-[520px] flex items-center justify-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>

              {/* === LEFT DARK DASHBOARD — horizontal, no tilt === */}
              <div className="absolute left-[0%] top-[18%] w-[420px] h-[320px] bg-[#111827] rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden animate-float-slow opacity-95 hover:opacity-100 hover:z-30 transition-all duration-300">
                 <div className="h-7 bg-[#1f2937] flex items-center px-4 gap-1.5 border-b border-white/5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                 </div>
                 <div className="p-4 grid grid-cols-2 gap-3 h-[calc(100%-28px)]">
                    <div className="bg-[#1f2937] rounded-lg p-3 flex flex-col justify-between border border-white/5">
                       <div className="w-20 h-2 bg-[#374151] rounded-full"></div>
                       <svg viewBox="0 0 100 40" className="w-full h-14"><path d="M0,30 Q25,0 50,20 T100,10" fill="none" stroke="#22d3ee" strokeWidth="2.5"/><path d="M0,15 Q25,35 50,15 T100,25" fill="none" stroke="#c084fc" strokeWidth="2.5"/></svg>
                    </div>
                    <div className="bg-[#0ea5e9] flex flex-col items-center justify-center rounded-lg shadow-inner text-white">
                       <span className="text-3xl font-bold tracking-tighter">124k</span>
                       <span className="text-xs font-semibold opacity-80 mt-1 uppercase tracking-widest">Active</span>
                    </div>
                    <div className="bg-[#1f2937] rounded-lg flex items-center justify-center border border-white/5">
                       <div className="w-16 h-16 rounded-full border-[8px] border-[#84cc16] border-t-[#374151] border-r-[#eab308]"></div>
                    </div>
                    <div className="bg-[#7c3aed] flex flex-col items-center justify-center rounded-lg shadow-inner text-white">
                       <span className="text-3xl font-bold tracking-tighter">$18k</span>
                       <span className="text-[10px] font-semibold opacity-80 mt-1 uppercase tracking-widest">Revenue</span>
                    </div>
                 </div>
              </div>

              {/* === RIGHT DARK DASHBOARD — horizontal, no tilt === */}
              <div className="absolute right-[0%] top-[18%] w-[420px] h-[320px] bg-[#1e293b] rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] border border-[#334155] overflow-hidden animate-float-delayed opacity-90 hover:opacity-100 hover:z-30 transition-all duration-300">
                 <div className="h-7 bg-[#0f172a] flex items-center px-4 gap-2 justify-end">
                    <div className="w-16 h-2 rounded-full bg-[#334155]"></div>
                    <div className="w-4 h-4 rounded-full bg-indigo-500"></div>
                 </div>
                 <div className="p-4 flex flex-col gap-3 h-[calc(100%-28px)]">
                    <div className="flex gap-3 flex-1">
                       <div className="w-1/3 bg-gradient-to-br from-[#38bdf8] to-[#0284c7] rounded-lg flex flex-col items-center justify-center text-white font-bold">
                          <Activity size={22} className="mb-1 opacity-80" />
                          <span className="text-2xl">99%</span>
                       </div>
                       <div className="w-2/3 bg-[#0f172a] rounded-lg p-3 flex items-end gap-2.5 justify-center border border-[#334155]">
                          <div className="w-6 bg-[#22d3ee] h-[40%] rounded-t-sm"></div>
                          <div className="w-6 bg-[#c084fc] h-[80%] rounded-t-sm"></div>
                          <div className="w-6 bg-[#84cc16] h-[60%] rounded-t-sm"></div>
                          <div className="w-6 bg-[#3b82f6] h-[90%] rounded-t-sm"></div>
                       </div>
                    </div>
                    <div className="w-full bg-[#0f172a] flex-1 rounded-lg relative overflow-hidden border border-[#334155]">
                       <div className="absolute bottom-[-35px] left-1/2 -translate-x-1/2 w-40 h-40 rounded-full border-[16px] border-[#10b981] border-r-[#334155] border-b-[#334155] transform -rotate-45"></div>
                       <div className="absolute top-[38%] left-1/2 -translate-x-1/2 text-white flex flex-col items-center">
                          <span className="font-extrabold text-2xl">85%</span>
                          <span className="text-[9px] text-gray-400 font-bold tracking-widest mt-0.5">COMPANY GOAL</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* === CENTER WHITE DASHBOARD (MAIN) — on top, fully horizontal === */}
              <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[480px] md:w-[560px] h-[360px] bg-white rounded-xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] border border-gray-200 overflow-hidden animate-float z-20">
                 <div className="h-10 bg-gray-50 border-b border-gray-100 flex items-center px-4 justify-between">
                    <div className="flex items-center gap-1.5">
                       <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
                    </div>
                    <div className="bg-white w-48 h-5 rounded-md border border-gray-200 flex items-center justify-center gap-2">
                       <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
                       <span className="text-[9px] font-bold text-gray-400">add a chart</span>
                    </div>
                    <div className="w-10 h-5 bg-gray-200 rounded-full flex items-center p-0.5">
                       <div className="w-4 h-4 bg-white rounded-full translate-x-5"></div>
                    </div>
                 </div>
                 <div className="p-4 grid grid-cols-2 gap-4 h-[calc(100%-40px)]">
                    <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-4 flex flex-col transition-shadow hover:shadow-md">
                       <div className="flex items-center gap-2 mb-4"><div className="w-16 h-2 bg-gray-200 rounded-full"></div></div>
                       <div className="flex-1 flex flex-col justify-center gap-3">
                          <div className="flex items-center gap-2"><div className="w-full border-t-[8px] border-[#38bdf8] rounded-full"></div><span className="text-[10px] font-bold text-gray-400">82</span></div>
                          <div className="flex items-center gap-2"><div className="w-3/4 border-t-[8px] border-[#84cc16] rounded-full"></div><span className="text-[10px] font-bold text-gray-400">45</span></div>
                          <div className="flex items-center gap-2"><div className="w-5/6 border-t-[8px] border-[#c084fc] rounded-full"></div><span className="text-[10px] font-bold text-gray-400">67</span></div>
                       </div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-4 flex flex-col justify-center items-center relative overflow-hidden transition-shadow hover:shadow-md">
                       <span className="text-4xl font-[900] text-[#1e293b] mb-2 tracking-tighter">2,204</span>
                       <div className="flex items-center gap-1 text-green-500 font-bold text-sm bg-green-50 px-2.5 py-1 rounded-full">
                          <TrendingUp size={14} strokeWidth={3} /> +12%
                       </div>
                       <svg viewBox="0 0 100 30" className="absolute bottom-0 w-full h-12 opacity-30"><path d="M0,30 L0,20 Q25,5 50,15 T100,5 L100,30 Z" fill="#38bdf8"/></svg>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-4 flex flex-col items-center justify-center transition-shadow hover:shadow-md">
                       <div className="flex items-center gap-2 w-full mb-2"><div className="w-24 h-2 bg-gray-200 rounded-full"></div></div>
                       <div className="w-24 h-24 rounded-full border-[12px] border-[#84cc16] border-r-[#eab308] border-b-[#c084fc] border-l-[#38bdf8]"></div>
                    </div>
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

              {/* === FLOATING ACTION TOOLBAR === */}
              <div className="absolute bottom-[10px] left-1/2 -translate-x-1/2 bg-white/90 rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.2)] border border-gray-100 p-2.5 flex items-center gap-2.5 z-40 backdrop-blur-xl animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
                 <button className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-[#555cf8] hover:bg-gray-50 rounded-xl transition-colors"><BarChart2 size={22} strokeWidth={2.5} /></button>
                 <button className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-[#555cf8] hover:bg-gray-50 rounded-xl transition-colors"><TrendingUp size={22} strokeWidth={2.5} /></button>
                 <button className="w-14 h-14 flex items-center justify-center bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] text-white rounded-[14px] shadow-lg shadow-blue-500/40 transform scale-110 hover:scale-125 transition-transform"><PieChart size={24} strokeWidth={2.5} /></button>
                 <button className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-[#555cf8] hover:bg-gray-50 rounded-xl transition-colors"><Activity size={22} strokeWidth={2.5} /></button>
                 <button className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-[#555cf8] hover:bg-gray-50 rounded-xl transition-colors"><LayoutDashboard size={22} strokeWidth={2.5} /></button>
              </div>

           </div>

           {/* You're in good company */}
           <div className="mt-10 flex flex-col items-center gap-4 animate-fade-in-up" style={{ animationDelay: '1s' }}>
             <p className="text-[15px] text-[#94a3b8] font-medium tracking-wide">You&apos;re in good company</p>
             <div className="flex items-center gap-8 opacity-40">
               {[1,2,3,4,5].map(i => (
                 <div key={i} className="flex items-center gap-2">
                   <div className="w-5 h-5 rounded-full" style={{ background: `hsl(${i * 60 + 180}, 70%, 60%)` }}></div>
                   <div className="w-12 h-2 rounded-full bg-gray-300"></div>
                 </div>
               ))}
             </div>
           </div>
        </div>
      </header>

      {/* Required Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% { transform: translate(-50%, 0px); }
          50%       { transform: translate(-50%, -14px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-16px); }
        }
        @keyframes hex-left {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-18px); }
        }
        @keyframes hex-right {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-14px); }
        }
        @keyframes fade-in-up {
          0%   { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes bubble-rise {
          0%   { transform: translateY(0)     scale(1);    opacity: 0.6; }
          50%  { transform: translateY(-150px) scale(1.06); opacity: 0.3; }
          100% { transform: translateY(-320px) scale(0.72); opacity: 0; }
        }
        .animate-float          { animation: float 6s ease-in-out infinite; }
        .animate-float-slow     { animation: float-slow 7s ease-in-out infinite; }
        .animate-float-delayed  { animation: float-delayed 8s ease-in-out infinite 1.5s; }
        .animate-hex-left       { animation: hex-left 9s ease-in-out infinite; }
        .animate-hex-right      { animation: hex-right 10s ease-in-out infinite 2s; }
        .animate-fade-in-up     { animation: fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .animate-fade-in        { animation: fade-in 1s ease-out forwards; }
        .bubble {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, rgba(167,139,250,0.48), rgba(34,211,238,0.18));
          border: 1.5px solid rgba(167,139,250,0.32);
          animation: bubble-rise linear infinite;
        }
      `}} />

    </div>
  );
}
