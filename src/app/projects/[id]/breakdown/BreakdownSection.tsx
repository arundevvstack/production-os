"use client";

import React, { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreakdownSectionProps {
  title: string;
  icon: React.ReactNode;
  items: any[];
}

export function BreakdownSection({ title, icon, items }: BreakdownSectionProps) {
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());

  const toggleApprove = (id: string) => {
    setApprovedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col max-h-[500px]">
      <div className="bg-gradient-to-r from-slate-50 to-white border-b px-5 py-4 flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2.5 text-slate-800 text-lg">
          <span className="text-emerald-500 bg-emerald-50 p-1.5 rounded-lg">{icon}</span>
          {title}
        </h3>
        <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>
      
      <div className="p-5 space-y-3.5 overflow-y-auto flex-1 custom-scrollbar">
        {items.map(item => {
          const isApproved = approvedIds.has(item.id);
          return (
            <div 
              key={item.id} 
              className={cn(
                "group relative border rounded-xl p-4 transition-all duration-300 ease-out flex gap-4 cursor-pointer hover:-translate-y-0.5",
                isApproved 
                  ? "border-emerald-200 bg-emerald-50/40 shadow-sm" 
                  : "border-slate-100 bg-white shadow-sm hover:border-slate-300 hover:shadow-md"
              )}
              onClick={() => toggleApprove(item.id)}
            >
              <div className="mt-0.5 shrink-0 transition-colors">
                {isApproved ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 group-hover:text-emerald-400 transition-colors" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="font-bold text-slate-800 truncate text-base">{item.name}</h4>
                  
                  {/* Categorical Badges */}
                  {title === "Characters" && item.importance && (
                    <span className={cn(
                      "shrink-0 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border",
                      item.importance === 'Lead' ? "bg-purple-50 text-purple-700 border-purple-200" :
                      item.importance === 'Supporting' ? "bg-blue-50 text-blue-700 border-blue-200" :
                      "bg-slate-100 text-slate-600 border-slate-200"
                    )}>
                      {item.importance}
                    </span>
                  )}
                  {title === "Locations" && (item.type || item.time_of_day) && (
                    <div className="flex gap-1 shrink-0">
                      {item.type && <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">{item.type}</span>}
                      {item.time_of_day && <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{item.time_of_day}</span>}
                    </div>
                  )}
                  {title === "Props" && item.category && (
                    <span className={cn(
                      "shrink-0 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border",
                      item.is_hero ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-slate-100 text-slate-600 border-slate-200"
                    )}>
                      {item.category}
                    </span>
                  )}
                </div>
                
                {/* Description / Subtext */}
                {item.description && (
                  <p className="text-sm text-slate-500 leading-relaxed italic line-clamp-2">
                    {item.description}
                  </p>
                )}
                {item.continuity_notes && (
                  <p className="text-sm text-slate-500 leading-relaxed italic line-clamp-2">
                    {item.continuity_notes}
                  </p>
                )}
                
                {/* Fallback for other arbitrary data (vehicles, animals) */}
                {title !== "Characters" && title !== "Locations" && title !== "Props" && (
                   <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                      {Object.entries(item).map(([key, value]) => {
                        if (['id', 'project_id', 'script_id', 'created_at', 'updated_at', 'name', 'description'].includes(key)) return null;
                        if (!value) return null;
                        return (
                          <div key={key} className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{key.replace(/_/g, ' ')}</span>
                            <span className="text-xs text-slate-700 font-medium truncate">{String(value)}</span>
                          </div>
                        )
                      })}
                   </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
