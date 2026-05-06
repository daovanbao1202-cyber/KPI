import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  target?: string;
  trend?: number; // percentage
  icon: ReactNode;
  trendUpIsGood?: boolean;
}

export default function MetricCard({ title, value, target, trend, icon, trendUpIsGood = true }: MetricCardProps) {
  const isPositive = trend && trend > 0;
  const isGood = isPositive === trendUpIsGood;

  return (
    <div className="glass-card rounded-[2rem] p-6 flex flex-col interactive-hover border-white/50">
      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-col">
          <h3 className="text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">{title}</h3>
          <div className="flex items-baseline gap-3">
             <span className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{value}</span>
             {trend && (
                <div className={`flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full ${
                   isGood ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'
                }`}>
                   {isPositive ? <TrendingUp size={12} strokeWidth={3} /> : <TrendingDown size={12} strokeWidth={3} />}
                   {Math.abs(trend)}%
                </div>
             )}
          </div>
        </div>
        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 text-brand-primary rounded-2xl flex items-center justify-center shadow-inner border border-white/40 dark:border-slate-700/50">
          {icon}
        </div>
      </div>
      
      {target && (
        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Objective</span>
          <span className="text-xs font-black text-slate-600 dark:text-slate-300">{target}</span>
        </div>
      )}
    </div>
  );
}
