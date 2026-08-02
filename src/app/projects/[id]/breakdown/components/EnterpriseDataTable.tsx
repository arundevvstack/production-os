"use client";
import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, MoreHorizontal, Image as ImageIcon } from 'lucide-react';
import { useBreakdown } from '../BreakdownContext';

export function EnterpriseDataTable() {
  const { 
    filteredItems: items, 
    activeTab, 
    selectedIds, 
    setSelectedIds, 
    toggleSelection 
  } = useBreakdown();

  const columns = [
    { id: 'thumbnail', label: 'Thumb', className: 'w-[50px]' },
    { id: 'original_name', label: 'Original Name', className: 'flex-[2] min-w-0' },
    { id: 'latin_name', label: 'Latin Name', className: 'flex-[1.5] min-w-0 hidden md:block' },
    { id: 'department', label: 'Dept', className: 'flex-1 min-w-0 hidden lg:block' },
    { id: 'category', label: 'Category', className: 'flex-1 min-w-0' },
    { id: 'description', label: 'Description', className: 'flex-[2.5] min-w-0 hidden xl:block' },
    { id: 'scenes', label: 'Scenes', className: 'w-[60px] text-center' },
    { id: 'confidence', label: 'Confidence', className: 'w-[90px] text-center' },
    { id: 'status', label: 'Status', className: 'w-[90px]' }
  ];

  const allSelected = items.length > 0 && selectedIds.size === items.length;

  const onToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i: any) => i.id)));
    }
  };

  const onRowClick = (id: string) => {
    setSelectedIds(new Set([id]));
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-hidden bg-white relative">
      <div className="flex items-center px-4 py-3 bg-white border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-20 shadow-sm">
        <div className="w-8 shrink-0 flex items-center justify-center">
          <input 
            type="checkbox" 
            checked={allSelected}
            onChange={onToggleSelectAll}
            className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
          />
        </div>
        <div className="flex-1 flex gap-3 min-w-0 items-center">
          {columns.map(col => (
            <div key={col.id} className={cn("truncate px-2 shrink-0", col.className)}>
              {col.label}
            </div>
          ))}
        </div>
        <div className="w-10 shrink-0 text-center">Action</div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="min-w-full divide-y divide-slate-100">
          {items.map((item: any) => {
            const isSelected = selectedIds.has(item.id);
            const needsReview = item.metadata?.validation?.needs_review && item.status !== 'Approved';
            const conf = Math.round((item.metadata?.validation?.confidence_score || 1.0) * 100);
            
            return (
              <div 
                key={item.id} 
                onClick={() => onRowClick(item.id)}
                className={cn(
                  "flex items-center px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors group",
                  isSelected && "bg-red-50/50 hover:bg-red-50/80"
                )}
              >
                <div className="w-8 shrink-0 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={() => toggleSelection(item.id)}
                    className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                  />
                </div>
                
                <div className="flex-1 flex gap-3 min-w-0 items-center">
                  {columns.map(col => {
                    if (col.id === 'thumbnail') {
                      return (
                        <div key={col.id} className={cn("px-2 shrink-0", col.className)}>
                          <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-300">
                            <ImageIcon className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      );
                    }
                    if (col.id === 'original_name') {
                      return (
                        <div key={col.id} className={cn("px-2 shrink-0 truncate", col.className)}>
                          <span className="text-sm font-bold text-slate-900 truncate">
                            {item.name}
                          </span>
                        </div>
                      );
                    }
                    if (col.id === 'latin_name') {
                      return (
                        <div key={col.id} className={cn("px-2 shrink-0 truncate", col.className)}>
                          <span className="text-xs font-medium text-slate-500 truncate">
                            {item.metadata?.latin_name || '-'}
                          </span>
                        </div>
                      );
                    }
                    if (col.id === 'department') {
                       return (
                         <div key={col.id} className={cn("px-2 shrink-0 truncate", col.className)}>
                           <span className="text-xs font-semibold text-red-600">
                             {activeTab}
                           </span>
                         </div>
                       );
                    }
                    if (col.id === 'category') {
                      return (
                        <div key={col.id} className={cn("px-2 shrink-0 truncate", col.className)}>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase tracking-wider">
                            {item.category || item.importance || item.metadata?.role || item.type || 'Generic'}
                          </span>
                        </div>
                      );
                    }
                    if (col.id === 'description') {
                      return (
                        <div key={col.id} className={cn("px-2 shrink-0", col.className)}>
                          <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                            {item.description || item.metadata?.description || <span className="text-slate-300 italic">No description</span>}
                          </p>
                        </div>
                      );
                    }
                    if (col.id === 'scenes') {
                      const scenesCount = item.scenes?.length || item.metadata?.scene_ids?.length || 0;
                      return (
                        <div key={col.id} className={cn("px-2 shrink-0", col.className)}>
                          <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex justify-center w-8">
                            {scenesCount}
                          </span>
                        </div>
                      );
                    }
                    if (col.id === 'confidence') {
                      return (
                         <div key={col.id} className={cn("px-2 shrink-0", col.className)}>
                           <span className={cn(
                             "text-[11px] font-black tracking-tight flex justify-center w-full",
                             conf > 85 ? "text-emerald-600" : conf > 60 ? "text-amber-500" : "text-red-500"
                           )}>
                             {conf}%
                           </span>
                         </div>
                      );
                    }
                    if (col.id === 'status') {
                      return (
                        <div key={col.id} className={cn("px-2 shrink-0", col.className)}>
                          {needsReview ? (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full w-max border border-amber-200/60">
                              <AlertTriangle className="w-3 h-3" /> Review
                            </div>
                          ) : item.status === 'Approved' ? (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full w-max border border-emerald-200/60">
                              <CheckCircle2 className="w-3 h-3" /> Approved
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full w-max border border-slate-200/60">
                              Draft
                            </div>
                          )}
                        </div>
                      );
                    }
                    return <div key={col.id} className={cn("px-2 shrink-0", col.className)} />;
                  })}
                </div>
                
                <div className="w-10 shrink-0 flex justify-center">
                  <button className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200 transition-colors opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); }}>
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
