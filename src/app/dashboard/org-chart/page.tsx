'use client';

import { useKPI, User } from '@/context/KPIContext';
import { Network, User as UserIcon } from 'lucide-react';

export default function OrgChartPage() {
  const { users } = useKPI();

  // Find the single CEO manually or multiple if specified
  const ceos = users.filter(u => u.position === 'CEO' || u.department === 'Management');
  const theCEO = ceos.length > 0 ? ceos[0] : null;

  // Real configured departments
  const departmentNames = ["Admin & Kế Toán", "Sale", "AE", "FAE1", "FAE2", "PM"];
  const departmentColors = ['#10b981', '#3b82f6', '#ec4899', '#f59e0b', '#8b5cf6', '#0ea5e9']; // Distinct pastel/vibrant colors
  
  // Group users by department excluding the CEO
  const groupedUsers = users.reduce((acc, user) => {
    if (user.position === 'CEO' || user.department === 'Management') return acc;
    const dept = user.department || 'Unassigned';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(user);
    return acc;
  }, {} as Record<string, User[]>);

  // Reusable component wrapper for an Avatar Card
  const BoxWrapper = ({ member }: { member: User }) => (
    <div className="flex flex-col items-center w-[120px] relative mt-6 bg-white rounded-t-[40%] rounded-b-xl shadow-md border border-gray-100 p-2 py-4 hover:shadow-xl transition-shadow cursor-pointer z-10">
       <div className="w-[64px] h-[64px] bg-gray-100 rounded-full shadow-inner border border-gray-200 p-0.5 mb-2 relative -top-8 -mb-6 overflow-hidden">
          {member.avatar ? (
            <img src={member.avatar} alt={member.firstName} className="w-full h-full object-cover rounded-full" />
          ) : (
            <div className="w-full h-full bg-gray-200 rounded-full flex justify-center items-center"><UserIcon size={32} className="text-gray-400" /></div>
          )}
       </div>
       <div className="text-center">
          <h5 className="text-[13px] font-bold text-[#475569] leading-tight">{member.firstName} {member.lastName}</h5>
          <p className="text-[10px] text-white bg-[#555cf8] px-2 py-0.5 mt-1.5 rounded-full font-bold uppercase tracking-wider inline-block">{member.position}</p>
       </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-y-auto">
      {/* Header */}
      <div className="p-8 pb-4">
        <h3 className="text-[#64748b] font-medium mb-1">Org Chart</h3>
        <h1 className="text-3xl font-bold text-[#475569] tracking-wider uppercase mb-10 flex items-center gap-3">
          <Network size={28} className="text-[#555cf8]" />
          COMPANY HIERARCHY
        </h1>
      </div>

      <div className="p-8 w-full min-w-[1400px] overflow-x-auto pb-32 pt-2">
        <div className="flex flex-col items-center">
            
            {/* Top Node: CEO */}
            <div className="flex justify-center w-full relative mb-16">
               <div className="flex flex-col items-center">
                 <div className="w-32 h-32 rounded-full border-4 border-white shadow-[0_15px_30px_-10px_rgba(0,0,0,0.3)] bg-gray-200 z-10 overflow-hidden">
                    {theCEO ? (
                       <img src={theCEO.avatar || `https://i.pravatar.cc/150?u=1`} alt="CEO" className="w-full h-full object-cover" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center"><UserIcon size={48} className="text-gray-400" /></div>
                    )}
                 </div>
                 <div className="text-center mt-3 z-10 bg-white px-6 py-2 rounded-full shadow-md border border-gray-100 relative -top-5">
                    <h4 className="font-extrabold text-[#1e293b] text-[18px]">{theCEO ? `${theCEO.firstName} ${theCEO.lastName}` : 'Tên Giám Đốc'}</h4>
                    <p className="text-xs text-white bg-blue-600 px-3 py-1 mt-1 rounded-full font-bold shadow-sm uppercase tracking-widest inline-block">CEO</p>
                 </div>
               </div>

               {/* Central Connecting Vertical Line -> Horizontal Line */}
               {/* This pseudo-element connects the CEO to the horizontal line below */}
               <div className="absolute top-[128px] left-1/2 w-[3px] h-32 bg-[#cbd5e1] -z-0"></div>
            </div>

            {/* Horizontal Distribution Line connecting Departments */}
            {/* Total width calculated to align perfectly under the 6 department columns */}
            <div className="w-[83.33%] h-[3px] bg-[#cbd5e1] relative -top-6 mb-12 rounded-full">
               {/* Connector drops for each column */}
               {[0, 20, 40, 60, 80, 100].map(pct => (
                 <div key={pct} className={`absolute top-0 left-[${pct}%] w-[3px] h-8 bg-[#cbd5e1]`}></div>
               ))}
            </div>

            {/* Departments Row */}
            <div className="flex w-full justify-between items-start">
               {departmentNames.map((deptName, index) => {
                  const members = groupedUsers[deptName] || [];
                  const color = departmentColors[index % departmentColors.length];
                  
                  // Filter out hierarchical roles for this department
                  const teamLeaders = members.filter(m => m.position === 'Team Leader');
                  const leaders = members.filter(m => m.position === 'Leader');
                  const staffs = members.filter(m => m.position === 'Staff/Engineer');

                  return (
                     <div key={deptName} className="flex flex-col items-center w-[16.66%] relative px-2">
                        {/* Department Box */}
                        <div 
                           className="text-white font-extrabold text-sm px-4 py-3 rounded-xl mb-4 shadow-lg w-full text-center relative z-10 border-b-[4px]"
                           style={{ backgroundColor: color, borderColor: 'rgba(0,0,0,0.2)' }}
                        >
                           {deptName}
                           <div className="absolute top-[40px] left-1/2 -translate-x-1/2 w-0.5 h-[500px] bg-[#e2e8f0] -z-10"></div>
                        </div>

                        <div className="w-full flex flex-col items-center relative z-20 pb-10">
                           {/* Tier 1: Team Leaders */}
                           {teamLeaders.length > 0 && (
                             <div className="flex flex-col items-center gap-4 w-full mb-10">
                                <div className="flex justify-center gap-4 flex-wrap">
                                   {teamLeaders.map(m => <BoxWrapper key={m.id} member={m} />)}
                                </div>
                             </div>
                           )}

                           {/* Tier 2: Leaders */}
                           {leaders.length > 0 && (
                             <div className="flex flex-col items-center gap-4 w-full mb-10 mt-2">
                                {/* Horizontal connector if multiple leaders */}
                                {leaders.length > 1 && <div className="absolute w-[60%] h-0.5 bg-gray-300 mt-[10px] -z-10"></div>}
                                <div className="flex justify-center gap-4 flex-wrap pt-4">
                                   {leaders.map(m => (
                                     <div key={m.id} className="relative">
                                       <div className="absolute -top-[16px] left-1/2 w-0.5 h-4 bg-gray-300 -z-10"></div>
                                       <BoxWrapper member={m} />
                                     </div>
                                   ))}
                                </div>
                             </div>
                           )}

                           {/* Tier 3: Staff/Engineer */}
                           {staffs.length > 0 && (
                             <div className="flex flex-col items-center gap-4 w-full mt-2">
                                {staffs.length > 1 && <div className="absolute w-[80%] h-0.5 bg-gray-300 mt-[10px] -z-10"></div>}
                                <div className="flex justify-center gap-2 flex-wrap pt-4">
                                   {staffs.map(m => (
                                      <div key={m.id} className="relative">
                                         <div className="absolute -top-[16px] left-1/2 w-0.5 h-4 bg-gray-300 -z-10"></div>
                                         <BoxWrapper member={m} />
                                      </div>
                                   ))}
                                </div>
                             </div>
                           )}

                           {/* Notice if empty */}
                           {members.length === 0 && (
                              <div className="mt-8 text-xs font-bold text-gray-400 bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm">
                                 No members
                              </div>
                           )}
                        </div>
                     </div>
                  );
               })}
            </div>

        </div>
      </div>
    </div>
  );
}
