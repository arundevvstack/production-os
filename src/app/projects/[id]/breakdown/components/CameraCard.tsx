import React from 'react';
import { CheckCircle2, Circle, MoreHorizontal, Video, Eye, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

export function CameraCard({ item, isSelected, onSelect, viewMode }: { item: any; isSelected: boolean; onSelect: (id: string) => void; viewMode: 'grid' | 'list' }) {
  const validation = item.metadata?.validation || {};
  const needsReview = validation.needs_review || validation.low_confidence || validation.spelling_changed;
  const isApproved = item.status === 'Approved';

  const badges = [];
  if (needsReview) badges.push(<span key="review" className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-md text-[10px] font-bold uppercase">Needs Review</span>);
  if (item.framing) badges.push(<span key="framing" className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[10px] font-bold uppercase">{item.framing}</span>);

  if (viewMode === 'list') {
    return (
      <Card onClick={() => onSelect(item.id)} className={cn("flex items-center p-3 gap-4 cursor-pointer transition-all border group", isSelected ? "border-red-500 bg-red-50/20 shadow-sm" : "border-slate-200 hover:border-slate-300 hover:shadow-sm")}>
        <div className="shrink-0 text-slate-300 group-hover:text-red-500 transition-colors">
          {isSelected ? <CheckCircle2 className="w-5 h-5 text-red-500"/> : <Circle className="w-5 h-5"/>}
        </div>
        <div className="w-10 h-10 rounded bg-slate-100 shrink-0 overflow-hidden border flex items-center justify-center text-slate-400">
          <Video className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0 grid grid-cols-5 gap-4 items-center">
          <div className="col-span-2">
            <h3 className="font-bold text-sm text-slate-800 truncate">{item.camera_style || item.name}</h3>
          </div>
          <div className="col-span-2 flex items-center gap-1 flex-wrap">
             {badges}
          </div>
          <div className="col-span-1 text-right text-xs font-semibold text-slate-500">
            {item.scene_usage ? `${item.scene_usage} Scenes` : '0 Scenes'}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("relative flex flex-col cursor-pointer transition-all border group h-full overflow-hidden bg-white", isSelected ? "border-red-500 ring-1 ring-red-500 shadow-md" : "border-slate-200 hover:border-slate-300 hover:shadow-md")}>
      <div onClick={() => onSelect(item.id)} className="absolute inset-0 z-0"></div>
      
      <div className="relative z-10 flex items-start justify-between p-4 pb-2">
        <div className="flex items-center gap-3">
          <div onClick={() => onSelect(item.id)} className="text-slate-300 group-hover:text-red-500 transition-colors cursor-pointer relative z-20">
            {isSelected ? <CheckCircle2 className="w-5 h-5 text-red-500 bg-white rounded-full"/> : <Circle className="w-5 h-5 bg-white rounded-full"/>}
          </div>
          <div className="flex items-center gap-2">
            {isApproved && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{isApproved ? 'Approved' : 'Draft'}</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative z-20 p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition">
              <MoreHorizontal className="w-5 h-5" />
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

      <div className="relative z-10 px-4 pt-2 flex flex-col gap-3 flex-1 pointer-events-none">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center text-slate-400">
            <Video className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h3 className="font-bold text-lg text-slate-800 line-clamp-1">{item.camera_style || item.name}</h3>
            <p className="text-xs text-slate-500 truncate">Camera Equipment</p>
          </div>
        </div>

        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {badges}
          </div>
        )}
      </div>

      <div className="relative z-10 mt-auto pt-3 border-t border-slate-100 p-4 bg-slate-50/50 flex items-center justify-between text-xs font-semibold pointer-events-none">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Scenes Used</span>
          <span className="text-slate-700">{item.scene_usage || 0} Scenes</span>
        </div>
      </div>
    </Card>
  );
}
