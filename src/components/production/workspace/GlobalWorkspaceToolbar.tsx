"use client";

import React from 'react';
import { Search, Download, Users, MapPin, Package, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkspace } from './WorkspaceContext';

export function GlobalWorkspaceToolbar() {
  const { 
    searchQuery, setSearchQuery, 
    selectedIds, kpi, bulkActions 
  } = useWorkspace();

  // If a module explicitly doesn't want a toolbar (e.g. settings page?), we could conditionally hide it
  // But for now, we render it globally.

  return (
    <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 bg-white px-8 py-2 border-b border-slate-200 sticky top-0 z-30 shrink-0">
      
      {/* LEFT: Search & KPIs */}
      <div className="flex flex-1 items-center gap-4 min-w-0">
        <div className="relative w-64 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search entities, metadata..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all h-9" 
          />
        </div>

        {kpi && (
          <div className="hidden 2xl:flex items-center gap-4 text-[11px] font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded border border-slate-200 shrink-0">
             {kpi.characters !== undefined && <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-indigo-500" /> <span className="font-bold text-slate-800">{kpi.characters}</span></div>}
             {kpi.locations !== undefined && <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4"><MapPin className="w-3.5 h-3.5 text-blue-500" /> <span className="font-bold text-slate-800">{kpi.locations}</span></div>}
             {kpi.props !== undefined && <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4"><Package className="w-3.5 h-3.5 text-orange-500" /> <span className="font-bold text-slate-800">{kpi.props}</span></div>}
             {(kpi.needsReview ?? 0) > 0 && (
               <div className="flex items-center gap-1.5 border-l border-amber-200 pl-4 text-amber-700 bg-amber-50/50 -my-1.5 py-1.5 px-2 rounded-r">
                 <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> <span className="font-bold">{kpi.needsReview}</span> Review
               </div>
             )}
          </div>
        )}
      </div>

      {/* RIGHT: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 pr-3 border-r border-slate-200 mr-1 animate-in slide-in-from-right-4">
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">{selectedIds.size} selected</span>
            {bulkActions}
          </div>
        )}
        
        {/* Module specific extra tools (like Filters) */}
        {/* Wait, we don't have children mapped in WorkspaceContext. We'll use a specific extraActions state if needed. 
            For now, the advanced filter will be universally triggered here. */}
        
        <div className="w-px h-6 bg-slate-200 mx-1"></div>
        
        <Button variant="outline" size="sm" className="h-9 px-3 gap-1.5 text-xs font-semibold text-slate-600">
          <Download className="w-3.5 h-3.5" /> Export
        </Button>
      </div>
    </div>
  );
}
