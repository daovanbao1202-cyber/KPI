'use client';

import { 
  ComposedChart, Area, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, BarChart, LineChart
} from 'recharts';
import { useKPI } from '@/context/KPIContext';

// Helper for dates
const getPastDate = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const getDatesInRange = (startDate: string, endDate: string) => {
  const dates = [];
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ey, em, ed] = endDate.split('-').map(Number);
  
  let current = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  
  let count = 0;
  while (current <= end && count < 365) { // Limit to 365 days to prevent infinite loops/too much data
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
    count++;
  }
  return dates;
};

const resolveDates = (dateRange?: { start: string, end: string }) => {
  if (dateRange && dateRange.start && dateRange.end) {
    return getDatesInRange(dateRange.start, dateRange.end).map(d => ({ date: d, isToday: d === getPastDate(0) }));
  }
  return [5, 4, 3, 2, 1, 0].map(daysAgo => ({ date: getPastDate(daysAgo), isToday: daysAgo === 0 }));
};

export function BarGraph({ kpiId, dateRange }: { kpiId?: string, dateRange?: { start: string, end: string } }) {
  const { userActuals, kpiDefs, userTargets, users, viewLevel, viewFilter, reports } = useKPI();
  
  const targetKpi = kpiId ? kpiDefs.find(k => k.id === kpiId) : kpiDefs[0];
  if (!targetKpi) return <div className="h-[250px] flex items-center justify-center text-gray-400">No KPI defined</div>;

  // Filter users based on viewLevel
  const relevantUserIds = users
    .filter(u => {
      if (viewLevel === 'Company') return true;
      if (viewLevel === 'Department') return String(u.department) === String(viewFilter);
      if (viewLevel === 'Individual') return String(u.id) === String(viewFilter);
      return false;
    })
    .map(u => u.id);

  // Aggregate target value
  let targetValue = userTargets
    .filter(t => t.kpiId === targetKpi.id && relevantUserIds.includes(t.userId))
    .reduce((acc, curr) => acc + curr.targetValue, 0);
  
  // Fallback to KPI's default hasTarget if no specific targets exist for this set
  if (targetValue === 0 && targetKpi.hasTarget) {
    targetValue = Number(targetKpi.hasTarget);
  } else if (targetValue === 0) {
    targetValue = 100; // Final fallback
  }

  const dates = resolveDates(dateRange);

  const barData = dates.map(({ date, isToday }) => {
    const dObj = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = dObj.getDate() === yesterday.getDate() && dObj.getMonth() === yesterday.getMonth() && dObj.getFullYear() === yesterday.getFullYear();
    
    let nameStr = `${dObj.getDate()} ${monthNames[dObj.getMonth()]} ${dObj.getFullYear()}`;
    if (isToday) nameStr = 'Today';
    else if (isYesterday) nameStr = 'Yesterday';

    let actual = 0;
    relevantUserIds.forEach(uId => {
      const rCount = reports.filter(r => r.kpiId === targetKpi.id && r.userId === uId && r.dateKey === date && r.isDone).length;
      if (rCount > 0) {
        actual += rCount;
      } else {
        const m = userActuals.find(a => a.kpiId === targetKpi.id && a.userId === uId && a.date === date);
        if (m) actual += m.actualValue;
      }
    });
    
    return {
      name: nameStr,
      target: targetValue,
      actual: actual,
      average: targetValue * 0.7 
    };
  });

  return (
    <div className="h-[300px] w-full pt-6">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" axisLine={true} stroke="#cbd5e1" tickLine={true} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip cursor={{ fill: '#f8f9fa' }} />
          <Legend verticalAlign="bottom" height={36} iconType="square" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
          
          <Line type="linear" dataKey="target" name="Target" stroke="#84cc16" strokeWidth={2} dot={{ r: 3, fill: '#84cc16' }} />
          <Line type="linear" dataKey="average" name="Average" stroke="#bef264" strokeWidth={2} dot={{ r: 3, fill: '#bef264' }} />
          <Bar dataKey="actual" name={targetKpi.name} fill="#38bdf8" barSize={50} radius={[0, 0, 0, 0]} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

const PIE_COLORS = ['#22d3ee', '#84cc16', '#eab308', '#c084fc', '#f472b6', '#fb923c', '#2dd4bf'];

export function KPIDonutChart({ kpiId, dateRange }: { kpiId?: string, dateRange?: { start: string, end: string } }) {
  const { userActuals, kpiDefs, users, viewLevel, viewFilter, reports } = useKPI();
  
  const targetKpi = kpiId ? kpiDefs.find(k => k.id === kpiId) : kpiDefs[0];
  if (!targetKpi) return null;

  const relevantUsers = users.filter(u => {
    if (viewLevel === 'Company') return true;
    if (viewLevel === 'Department') return String(u.department) === String(viewFilter);
    if (viewLevel === 'Individual') return String(u.id) === String(viewFilter);
    return false;
  });

  const relevantUserIds = relevantUsers.map(u => u.id);

  let pieData = [];
  let centerLabel = "";

  if (viewLevel === 'Individual') {
    // Show Daily Breakdown for Individual
    const dates = resolveDates(dateRange);
    pieData = dates.map(({ date, isToday }) => {
      const dObj = new Date(date);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = dObj.getDate() === yesterday.getDate() && dObj.getMonth() === yesterday.getMonth() && dObj.getFullYear() === yesterday.getFullYear();
      
      let nameStr = `${dObj.getDate()} ${monthNames[dObj.getMonth()]} ${dObj.getFullYear()}`;
      if (isToday) nameStr = 'Today';
      else if (isYesterday) nameStr = 'Yesterday';

      let val = 0;
      relevantUserIds.forEach(uId => {
        const rCount = reports.filter(r => r.kpiId === targetKpi.id && r.userId === uId && r.dateKey === date && r.isDone).length;
        if (rCount > 0) {
          val += rCount;
        } else {
          const m = userActuals.find(a => a.kpiId === targetKpi.id && a.userId === uId && a.date === date);
          if (m) val += m.actualValue;
        }
      });
      
      return { name: nameStr, value: val };
    }).filter(d => d.value > 0);
    centerLabel = pieData.reduce((acc, curr) => acc + curr.value, 0).toString();
  } else {
    // Show User Breakdown for Company/Department
    const dates = resolveDates(dateRange);
    pieData = relevantUsers.map(u => {
      let val = 0;
      dates.forEach(({ date }) => {
        const rCount = reports.filter(r => r.kpiId === targetKpi.id && r.userId === u.id && r.dateKey === date && r.isDone).length;
        if (rCount > 0) {
          val += rCount;
        } else {
          const m = userActuals.find(a => a.kpiId === targetKpi.id && a.userId === u.id && a.date === date);
          if (m) val += m.actualValue;
        }
      });
      return { name: `${u.firstName} ${u.lastName}`, value: val };
    }).filter(d => d.value > 0);
    centerLabel = pieData.reduce((acc, curr) => acc + curr.value, 0).toString();
  }

  return (
    <div className="h-[300px] w-full flex flex-col pt-4">
      <div className="flex items-center gap-2 px-6 mb-2">
         <span className="text-xl">{targetKpi.icon || '🎯'}</span>
         <span className="text-[14px] font-semibold text-gray-700">{targetKpi.name}</span>
      </div>
      <div className="flex-1 w-full flex items-center justify-center flex-col relative min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {pieData.length > 0 ? (
              <Pie
                data={pieData}
                cx="50%" cy="50%" innerRadius={0} outerRadius={75}
                paddingAngle={0} dataKey="value"
                labelLine={true} label={({ name }) => name}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
            ) : (
              <Pie
                data={[{ name: 'No Data', value: 1 }]}
                cx="50%" cy="50%" innerRadius={0} outerRadius={75} dataKey="value"
              >
                <Cell fill="#f1f5f9" />
              </Pie>
            )}
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[36px] text-[#334155] font-normal text-center mt-2 mb-6">{centerLabel}</div>
    </div>
  );
}

export function LineGraph({ kpiId, dateRange }: { kpiId?: string, dateRange?: { start: string, end: string } }) {
  const { userActuals, kpiDefs, userTargets, users, viewLevel, viewFilter, reports } = useKPI();
  
  const targetKpi = kpiId ? kpiDefs.find(k => k.id === kpiId) : kpiDefs[0];
  if (!targetKpi) return null;

  const relevantUserIds = users
    .filter(u => {
      if (viewLevel === 'Company') return true;
      if (viewLevel === 'Department') return String(u.department) === String(viewFilter);
      if (viewLevel === 'Individual') return String(u.id) === String(viewFilter);
      return false;
    })
    .map(u => u.id);

  let targetValue = userTargets
    .filter(t => t.kpiId === targetKpi.id && relevantUserIds.includes(t.userId))
    .reduce((acc, curr) => acc + curr.targetValue, 0);
  
  if (targetValue === 0 && targetKpi.hasTarget) targetValue = Number(targetKpi.hasTarget);
  if (targetValue === 0) targetValue = 100;

  const dates = resolveDates(dateRange);

  const chartData = dates.map(({ date, isToday }) => {
    let actual = 0;
    relevantUserIds.forEach(uId => {
      const rCount = reports.filter(r => r.kpiId === targetKpi.id && r.userId === uId && r.dateKey === date && r.isDone).length;
      if (rCount > 0) {
        actual += rCount;
      } else {
        const m = userActuals.find(a => a.kpiId === targetKpi.id && a.userId === uId && a.date === date);
        if (m) actual += m.actualValue;
      }
    });
    
    return {
      name: isToday ? 'Today' : date.split('-').slice(1).reverse().join('/'),
      actual,
      target: targetValue
    };
  });

  return (
    <div className="h-[250px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" axisLine={true} stroke="#cbd5e1" tick={{ fill: '#64748b', fontSize: 10 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
          <Tooltip />
          <Area type="monotone" dataKey="actual" fill="#38bdf8" fillOpacity={0.1} stroke="#38bdf8" strokeWidth={2} />
          <Line type="linear" dataKey="target" name="Average" stroke="#84cc16" strokeWidth={1} dot={true} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SingleKPI({ kpiId, dateRange }: { kpiId?: string, dateRange?: { start: string, end: string } }) {
  const { userActuals, kpiDefs, userTargets, users, viewLevel, viewFilter, reports } = useKPI();
  const targetKpi = kpiId ? kpiDefs.find(k => k.id === kpiId) : kpiDefs[0];
  if (!targetKpi) return null;

  const relevantUserIds = users
    .filter(u => {
      if (viewLevel === 'Company') return true;
      if (viewLevel === 'Department') return String(u.department) === String(viewFilter);
      if (viewLevel === 'Individual') return String(u.id) === String(viewFilter);
      return false;
    })
    .map(u => u.id);

  const dates = resolveDates(dateRange);

  let currentTotal = 0;
  dates.forEach(({ date }) => {
    relevantUserIds.forEach(uId => {
      const rCount = reports.filter(r => r.kpiId === targetKpi.id && r.userId === uId && r.dateKey === date && r.isDone).length;
      if (rCount > 0) {
        currentTotal += rCount;
      } else {
        const m = userActuals.find(a => a.kpiId === targetKpi.id && a.userId === uId && a.date === date);
        if (m) currentTotal += m.actualValue;
      }
    });
  });

  let targetValue = userTargets
    .filter(t => t.kpiId === targetKpi.id && relevantUserIds.includes(t.userId))
    .reduce((acc, curr) => acc + curr.targetValue, 0);
  
  if (targetValue === 0 && targetKpi.hasTarget) targetValue = Number(targetKpi.hasTarget);
  if (targetValue === 0) targetValue = 100;

  const sparklineData = dates.map(({ date }) => {
    let value = 0;
    relevantUserIds.forEach(uId => {
      const rCount = reports.filter(r => r.kpiId === targetKpi.id && r.userId === uId && r.dateKey === date && r.isDone).length;
      if (rCount > 0) {
        value += rCount;
      } else {
        const m = userActuals.find(a => a.kpiId === targetKpi.id && a.userId === uId && a.date === date);
        if (m) value += m.actualValue;
      }
    });
    return { value, target: targetValue };
  });

  const rawPct = targetValue > 0 ? ((currentTotal - targetValue) / targetValue) * 100 : 0;
  const diffPct = Math.round(rawPct);
  const isPositive = currentTotal >= targetValue;

  return (
    <div className="flex flex-col w-full h-[300px] p-2 mt-4">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xl">{targetKpi.icon || '🎯'}</span>
        <span className="text-[15px] font-medium text-gray-800">{targetKpi.name}</span>
      </div>
      
      <div className="flex justify-between items-start flex-1">
        <div className="text-[52px] leading-none text-[#38bdf8] font-light">
          {currentTotal.toLocaleString()}
        </div>
        
        <div className="w-[140px] h-[70px] opacity-80 mt-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={sparklineData}>
              <Area type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={1} fill="#bae6fd" fillOpacity={0.6} />
              <Line type="monotone" dataKey="target" stroke="#84cc16" strokeWidth={1} dot={{ r: 1, fill: '#84cc16' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto pt-4 gap-3">
         <div className="flex-1 bg-[#f8fafc] rounded-md px-4 py-3 flex items-center shadow-sm border border-gray-100">
            <span className="text-gray-400 font-medium mr-4">Target</span>
            <span className="text-[#84cc16] text-xl font-medium">{targetValue.toLocaleString()}</span>
         </div>
         
         <div className={`rounded-md px-4 py-3 flex items-center text-white w-[110px] justify-center shadow-sm ${isPositive ? 'bg-[#84cc16]' : 'bg-[#b91c1c]'}`}>
            <span className="font-bold text-lg">{isPositive ? '+' : ''}{diffPct}%</span>
         </div>
      </div>
    </div>
  );
}

export function StackedKpiGraph({ kpiIds, dateRange }: { kpiIds?: string[], dateRange?: { start: string, end: string } }) {
  const { userActuals, kpiDefs, users, viewLevel, viewFilter, reports } = useKPI();
  const ids = kpiIds || (kpiDefs.slice(0, 3).map(k => k.id));
  
  const relevantUserIds = users
    .filter(u => {
      if (viewLevel === 'Company') return true;
      if (viewLevel === 'Department') return String(u.department) === String(viewFilter);
      if (viewLevel === 'Individual') return String(u.id) === String(viewFilter);
      return false;
    })
    .map(u => u.id);

  const dates = resolveDates(dateRange);

  const data = dates.map(({ date, isToday }) => {
    const dObj = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = dObj.getDate() === yesterday.getDate() && dObj.getMonth() === yesterday.getMonth() && dObj.getFullYear() === yesterday.getFullYear();
    
    let nameStr = `${dObj.getDate()} ${monthNames[dObj.getMonth()]} ${dObj.getFullYear()}`;
    if (isToday) nameStr = 'Today';
    else if (isYesterday) nameStr = 'Yesterday';

    const row: any = { name: nameStr };
    ids.forEach(kId => {
      let actual = 0;
      relevantUserIds.forEach(uId => {
        const rCount = reports ? reports.filter(r => r.kpiId === kId && r.userId === uId && r.dateKey === date && r.isDone).length : 0;
        if (rCount > 0) {
          actual += rCount;
        } else {
          const m = userActuals.find(a => a.kpiId === kId && a.userId === uId && a.date === date);
          if (m) actual += m.actualValue;
        }
      });
      row[kId] = actual;
    });
    return row;
  });

  return (
    <div className="h-[300px] w-full pt-6">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" axisLine={true} stroke="#cbd5e1" tickLine={true} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip cursor={{ fill: '#f8f9fa' }} />
          <Legend verticalAlign="bottom" height={36} iconType="square" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
          {ids.map((id, idx) => (
            <Bar key={id} name={kpiDefs.find(k => k.id === id)?.name || id} dataKey={id} stackId="a" fill={PIE_COLORS[idx % PIE_COLORS.length]} barSize={50} radius={[0, 0, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MultipleKpiSeries({ kpiIds, dateRange }: { kpiIds?: string[], dateRange?: { start: string, end: string } }) {
  const { userActuals, kpiDefs, users, viewLevel, viewFilter, reports } = useKPI();
  const ids = kpiIds || (kpiDefs.slice(0, 3).map(k => k.id));
  
  const relevantUserIds = users
    .filter(u => {
      if (viewLevel === 'Company') return true;
      if (viewLevel === 'Department') return String(u.department) === String(viewFilter);
      if (viewLevel === 'Individual') return String(u.id) === String(viewFilter);
      return false;
    })
    .map(u => u.id);

  const dates = resolveDates(dateRange);

  const data = dates.map(({ date, isToday }) => {
    const dObj = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = dObj.getDate() === yesterday.getDate() && dObj.getMonth() === yesterday.getMonth() && dObj.getFullYear() === yesterday.getFullYear();
    
    let nameStr = `${dObj.getDate()} ${monthNames[dObj.getMonth()]} ${dObj.getFullYear()}`;
    if (isToday) nameStr = 'Today';
    else if (isYesterday) nameStr = 'Yesterday';

    const row: any = { name: nameStr };
    ids.forEach(kId => {
      let actual = 0;
      relevantUserIds.forEach(uId => {
        const rCount = reports ? reports.filter(r => r.kpiId === kId && r.userId === uId && r.dateKey === date && r.isDone).length : 0;
        if (rCount > 0) {
          actual += rCount;
        } else {
          const m = userActuals.find(a => a.kpiId === kId && a.userId === uId && a.date === date);
          if (m) actual += m.actualValue;
        }
      });
      row[kId] = actual;
    });
    return row;
  });

  const MULTI_COLORS = ['#38bdf8', '#84cc16', '#94a3b8', '#fbbf24', '#f87171', '#c084fc'];

  return (
    <div className="h-[300px] w-full pt-6">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" axisLine={true} stroke="#cbd5e1" tickLine={true} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip cursor={{ fill: '#f8f9fa' }} />
          <Legend verticalAlign="bottom" height={36} iconType="square" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
          {ids.map((id, idx) => {
            const color = MULTI_COLORS[idx % MULTI_COLORS.length];
            return (
              <Line 
                key={id} 
                name={kpiDefs.find(k => k.id === id)?.name || id} 
                type="linear" 
                dataKey={id} 
                stroke={color} 
                strokeWidth={2} 
                dot={(props: any) => {
                  const { cx, cy } = props;
                  if (cx == null || cy == null) return null;
                  return <rect key={`dot-${cx}-${cy}`} x={cx - 3.5} y={cy - 3.5} width={7} height={7} fill={color} />;
                }}
                activeDot={(props: any) => {
                  const { cx, cy } = props;
                  if (cx == null || cy == null) return null;
                  return <rect key={`active-dot-${cx}-${cy}`} x={cx - 5} y={cy - 5} width={10} height={10} fill={color} />;
                }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
export function GaugeChart({ kpiId, dateRange }: { kpiId?: string, dateRange?: { start: string, end: string } }) {
  const { userActuals, kpiDefs, userTargets, users, viewLevel, viewFilter, reports } = useKPI();
  
  const targetKpi = kpiId ? kpiDefs.find(k => k.id === kpiId) : kpiDefs[0];
  if (!targetKpi) return null;

  const relevantUserIds = users
    .filter(u => {
      if (viewLevel === 'Company') return true;
      if (viewLevel === 'Department') return String(u.department) === String(viewFilter);
      if (viewLevel === 'Individual') return String(u.id) === String(viewFilter);
      return false;
    })
    .map(u => u.id);

  const dates = resolveDates(dateRange);
  let targetValue = 0;
  let currentTotal = 0;

  dates.forEach(({ date }) => {
    relevantUserIds.forEach(uId => {
      // Actual
      const rCount = reports ? reports.filter(r => r.kpiId === targetKpi.id && r.userId === uId && r.dateKey === date && r.isDone).length : 0;
      if (rCount > 0) {
        currentTotal += rCount;
      } else {
        const m = userActuals.find(a => a.kpiId === targetKpi.id && a.userId === uId && a.date === date);
        if (m) currentTotal += m.actualValue;
      }

      // Target
      let periodTarget = userTargets.find(t => t.kpiId === targetKpi.id && t.userId === uId && t.dateKey === date)?.targetValue;
      if (periodTarget === undefined) {
        periodTarget = userTargets.find(t => t.kpiId === targetKpi.id && t.userId === uId && !t.dateKey)?.targetValue;
      }
      if (periodTarget === undefined) {
        periodTarget = Number(targetKpi.hasTarget) || 0;
      }
      targetValue += periodTarget;
    });
  });

  if (targetValue === 0) targetValue = Number(targetKpi.hasTarget) || 100;

  const maxScale = targetValue * 2;
  const clampedActual = Math.min(currentTotal, maxScale);
  const percentage = maxScale > 0 ? clampedActual / maxScale : 0;
  
  const radius = 80;
  const arcLength = Math.PI * radius;
  const strokeDashoffset = arcLength - (percentage * arcLength);

  return (
    <div className="w-full flex flex-col pt-4">
      <div className="flex items-center gap-2 px-6 mb-2">
         <span className="text-xl">{targetKpi.icon || '🎯'}</span>
         <span className="text-[14px] font-semibold text-gray-700">{targetKpi.name}</span>
      </div>
      <div className="h-[200px] w-full flex flex-col items-center justify-center relative">
        <svg width="100%" height="100%" viewBox="0 0 200 150" className="overflow-visible">
          {/* Background Arc */}
          <path 
            d="M 20 100 A 80 80 0 0 1 180 100" 
            fill="none" 
            stroke="#e5e7eb" 
            strokeWidth="20" 
            strokeLinecap="butt"
          />
          
          {/* Active Arc */}
          <path 
            d="M 20 100 A 80 80 0 0 1 180 100" 
            fill="none" 
            stroke="#38bdf8" 
            strokeWidth="20" 
            strokeLinecap="butt"
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
          
          {/* Triangle Target Pointer (Points Down) */}
          <polygon points="100,10 95,2 105,2" fill="#84cc16" />
          
          {/* Dashed Line */}
          <line x1="100" y1="30" x2="100" y2="100" stroke="#84cc16" strokeWidth="1.5" strokeDasharray="3 3" />
          
          {/* Semi-circle base */}
          <path d="M 88 100 A 12 12 0 0 1 112 100" fill="#e5e7eb" />
          
          {/* Labels */}
          <text x="20" y="118" textAnchor="middle" fill="#9ca3af" fontSize="11">0</text>
          <text x="180" y="118" textAnchor="middle" fill="#9ca3af" fontSize="11">{maxScale.toLocaleString()}</text>
          
          {/* Main Value */}
          <text x="100" y="145" textAnchor="middle" fill="#374151" fontSize="36" fontWeight="500">{currentTotal.toLocaleString()}</text>
        </svg>
      </div>
    </div>
  );
}export function RagColumnGraph({ kpiId, dateRange }: { kpiId?: string, dateRange?: { start: string, end: string } }) {
  const { userActuals, kpiDefs, userTargets, users, viewLevel, viewFilter, reports } = useKPI();
  
  const targetKpi = kpiId ? kpiDefs.find(k => k.id === kpiId) : kpiDefs[0];
  if (!targetKpi) return null;

  const relevantUserIds = users
    .filter(u => {
      if (viewLevel === 'Company') return true;
      if (viewLevel === 'Department') return String(u.department) === String(viewFilter);
      if (viewLevel === 'Individual') return String(u.id) === String(viewFilter);
      return false;
    })
    .map(u => u.id);

  let targetValue = userTargets
    .filter(t => t.kpiId === targetKpi.id && relevantUserIds.includes(t.userId))
    .reduce((acc, curr) => acc + curr.targetValue, 0);
  
  if (targetValue === 0 && targetKpi.hasTarget) targetValue = Number(targetKpi.hasTarget);
  if (targetValue === 0) targetValue = 100;

  const dates = resolveDates(dateRange);

  const data = dates.map(({ date, isToday }) => {
    const dObj = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = dObj.getDate() === yesterday.getDate() && dObj.getMonth() === yesterday.getMonth() && dObj.getFullYear() === yesterday.getFullYear();
    
    let nameStr = `${dObj.getDate()} ${monthNames[dObj.getMonth()]} ${dObj.getFullYear()}`;
    if (isToday) nameStr = 'Today';
    else if (isYesterday) nameStr = 'Yesterday';

    let actual = 0;
    relevantUserIds.forEach(uId => {
      const rCount = reports ? reports.filter(r => r.kpiId === targetKpi.id && r.userId === uId && r.dateKey === date && r.isDone).length : 0;
      if (rCount > 0) {
        actual += rCount;
      } else {
        const m = userActuals.find(a => a.kpiId === targetKpi.id && a.userId === uId && a.date === date);
        if (m) actual += m.actualValue;
      }
    });
    
    // RAG Logic
    const pct = (actual / (targetValue || 1)) * 100;
    let color = '#b91c1c'; // Red
    if (pct >= 100) color = '#84cc16'; // Green
    else if (pct >= 70) color = '#f59e0b'; // Amber
    
    return {
      name: nameStr,
      actual,
      target: targetValue,
      color
    };
  });

  return (
    <div className="h-[300px] w-full pt-6">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" axisLine={true} stroke="#cbd5e1" tickLine={true} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip cursor={{ fill: '#f8f9fa' }} />
          <Legend verticalAlign="bottom" height={36} iconType="square" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
          
          <Bar dataKey="actual" name={targetKpi.name} barSize={50} radius={[0, 0, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
          <Line type="linear" dataKey="target" name="Target" stroke="#84cc16" strokeWidth={2} dot={{ r: 3, fill: '#84cc16' }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MultiKpiPieChart({ kpiIds, dateRange }: { kpiIds?: string[], dateRange?: { start: string, end: string } }) {
  const { userActuals, kpiDefs, users, viewLevel, viewFilter, reports } = useKPI();
  const ids = kpiIds || (kpiDefs.slice(0, 3).map(k => k.id));
  
  const relevantUserIds = users
    .filter(u => {
      if (viewLevel === 'Company') return true;
      if (viewLevel === 'Department') return String(u.department) === String(viewFilter);
      if (viewLevel === 'Individual') return String(u.id) === String(viewFilter);
      return false;
    })
    .map(u => u.id);

  const dates = resolveDates(dateRange);

  const pieData = ids.map(id => {
    const kpi = kpiDefs.find(k => k.id === id);
    let val = 0;
    dates.forEach(({ date }) => {
      relevantUserIds.forEach(uId => {
        const rCount = reports ? reports.filter(r => r.kpiId === id && r.userId === uId && r.dateKey === date && r.isDone).length : 0;
        if (rCount > 0) {
          val += rCount;
        } else {
          const m = userActuals.find(a => a.kpiId === id && a.userId === uId && a.date === date);
          if (m) val += m.actualValue;
        }
      });
    });
    return {
      name: kpi?.name || id,
      value: val
    };
  }).filter(d => d.value > 0);

  const total = pieData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="h-[300px] w-full pt-6 flex flex-col items-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={0}
            outerRadius={75}
            paddingAngle={0}
            dataKey="value"
            labelLine={true}
            label={({ name }) => name}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-[36px] text-[#334155] font-normal text-center mt-2 mb-6">
        {total.toLocaleString()}
      </div>
    </div>
  );
}
