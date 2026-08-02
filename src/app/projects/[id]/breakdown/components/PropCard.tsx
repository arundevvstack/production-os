import React from 'react';
import { CheckCircle2, Circle, MoreHorizontal, Package, Eye, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

export function PropCard({ item, isSelected, onSelect, viewMode }: { item: any; isSelected: boolean; onSelect: (id: string) => void; viewMode: 'grid' | 'list' }) {
  const validation = item.metadata?.validation || {};
  const needsReview = validation.needs_review || validation.low_confidence || validation.spelling_changed || validation.prop_detected;
  const isApproved = item.status === 'Approved';

  const badges = [];
  if (needsReview) badges.push(<span key="review" className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-md text-[10px] font-bold uppercase">Needs Review</span>);
  if (item.category) badges.push(<span key="cat" className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[10px] font-bold uppercase">{item.category}</span>);
  if (item.is_hero) badges.push(<span key="hero" className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[10px] font-bold uppercase">Hero Prop</span>);
  else badges.push(<span key="bg" className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-200 rounded-md text-[10px] font-bold uppercase">BG Prop</span>);

  if (viewMode === 'list') {
    return (
      <div onClick={() => onSelect(item.id)} className={cn("flex items-center px-3 py-2 gap-4 cursor-pointer transition-all border-b group hover:bg-slate-50", isSelected ? "bg-red-50/40" : "")}>
        <div className="shrink-0 w-5 text-slate-300 group-hover:text-red-500 transition-colors">
          {isSelected ? <CheckCircle2 className="w-4 h-4 text-red-500"/> : <Circle className="w-4 h-4"/>}
        </div>
        <div className="w-8 h-8 rounded bg-slate-100 shrink-0 overflow-hidden border flex items-center justify-center text-slate-400">
          <Package className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
          <div className="col-span-4 flex flex-col min-w-0">
            <span className="font-bold text-[13px] text-slate-800 truncate">{item.name}</span>
            {item.metadata?.latin_name && item.metadata.latin_name !== item.name && (
              <span className="text-[10px] text-slate-500 truncate">{item.metadata.latin_name}</span>
            )}
          </div>
          <div className="col-span-3 flex flex-col min-w-0">
             <span className="text-[12px] text-slate-700 truncate">{item.category || 'Prop'}</span>
             {needsReview && <span className="text-[10px] text-amber-600 font-bold">Needs Review</span>}
          </div>
          <div className="col-span-3 flex items-center gap-1 flex-wrap">
             {badges}
          </div>
          <div className="col-span-2 text-right text-[12px] font-semibold text-slate-500">
            {item.scene_usage || 0} Scenes
          </div>
        </div>
        <div className="w-8 shrink-0 text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 text-xs">
              <DropdownMenuItem><Eye className="w-3.5 h-3.5 mr-2"/> Preview</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-emerald-600 font-medium">Approve</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600 font-medium">Reject</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("relative flex items-stretch cursor-pointer transition-all border group bg-white", isSelected ? "border-red-500 shadow-sm ring-1 ring-red-500" : "border-slate-200 hover:border-slate-300 hover:shadow-sm")}>
      <div onClick={() => onSelect(item.id)} className="absolute inset-0 z-0"></div>
      
      {/* Left Thumbnail */}
      <div className="relative z-10 w-16 bg-slate-50 border-r border-slate-100 flex flex-col items-center justify-center p-2 shrink-0 pointer-events-none">
        <div className="w-10 h-10 rounded bg-slate-200 overflow-hidden flex items-center justify-center text-slate-400 mb-1">
          <Package className="w-5 h-5" />
        </div>
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{isApproved ? 'APRV' : 'DRFT'}</div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-2.5 py-1.5 pointer-events-none min-w-0">
        <div className="flex items-center justify-between mb-0.5 gap-2">
          <div className="flex-1 min-w-0 flex items-center gap-1.5">
            <h3 className="font-bold text-[13px] text-slate-800 truncate">{item.name}</h3>
            {item.metadata?.latin_name && item.metadata.latin_name !== item.name && (
              <span className="text-[9px] text-slate-500 truncate bg-slate-100 px-1 rounded">{item.metadata.latin_name}</span>
            )}
          </div>
          {needsReview && (
            <span className="px-1 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[9px] font-bold uppercase shrink-0">Review</span>
          )}
        </div>
        
        {item.category && <p className="text-[10px] font-medium text-red-600 truncate">{item.category}</p>}
        <p className="text-[10px] text-slate-500 line-clamp-1 leading-tight">{item.continuity_notes || item.description}</p>
        
        <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-50">
          <div className="flex items-center gap-1 overflow-hidden">
            {badges}
          </div>
          <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap shrink-0">{item.scene_usage || 0} Sc</span>
        </div>
      </div>
      
      {/* Selection & Actions */}
      <div className="relative z-20 flex flex-col justify-between items-center p-2 border-l border-slate-50 shrink-0">
        <div onClick={() => onSelect(item.id)} className="text-slate-300 group-hover:text-red-500 transition-colors cursor-pointer">
          {isSelected ? <CheckCircle2 className="w-4 h-4 text-red-500"/> : <Circle className="w-4 h-4"/>}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition mt-auto">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 text-sm">
            <DropdownMenuItem><Eye className="w-4 h-4 mr-2"/> Quick Preview</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-emerald-600 font-medium">Approve</DropdownMenuItem>
            <DropdownMenuItem className="font-medium">Merge</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600 font-medium">Reject</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
