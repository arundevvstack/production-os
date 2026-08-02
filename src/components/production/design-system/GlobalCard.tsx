import React, { ReactNode } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface GlobalCardProps {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
  status?: string;
  badges?: ReactNode[];
  thumbnail?: string;
  footer?: ReactNode;
  viewMode?: 'grid' | 'list';
}

export function GlobalCard({
  id, title, subtitle, description, isSelected, onSelect, status, badges = [], thumbnail, footer, viewMode = 'grid'
}: GlobalCardProps) {
  
  if (viewMode === 'list') {
    return (
      <Card 
        onClick={() => onSelect(id)}
        className={cn(
          "flex items-center p-3 gap-4 cursor-pointer transition-all border group",
          isSelected ? "border-emerald-500 bg-emerald-50/20 shadow-sm" : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
        )}
      >
        <div className="shrink-0 text-slate-300 group-hover:text-emerald-500 transition-colors">
          {isSelected ? <CheckCircle2 className="w-5 h-5 text-emerald-500"/> : <Circle className="w-5 h-5"/>}
        </div>
        {thumbnail && (
          <div className="w-10 h-10 rounded-md bg-slate-100 shrink-0 overflow-hidden border">
            <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-800 truncate">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
             {badges.map((b, i) => <div key={i}>{b}</div>)}
          </div>
        </div>
      </Card>
    );
  }

  // GRID MODE
  return (
    <Card 
      onClick={() => onSelect(id)}
      className={cn(
        "relative p-4 flex flex-col gap-3 cursor-pointer transition-all border group h-full",
        isSelected ? "border-emerald-500 ring-1 ring-emerald-500 shadow-md" : "border-slate-200 hover:border-slate-300 hover:shadow-md"
      )}
    >
      <div className="absolute top-4 right-4 z-10 text-slate-300 group-hover:text-emerald-500 transition-colors">
        {isSelected ? <CheckCircle2 className="w-5 h-5 text-emerald-500 bg-white rounded-full"/> : <Circle className="w-5 h-5 bg-white rounded-full"/>}
      </div>

      {thumbnail && (
        <div className="w-full aspect-video rounded-lg bg-slate-100 overflow-hidden border border-slate-200 mb-2">
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        </div>
      )}

      <div>
        <h3 className="font-bold text-base text-slate-800 pr-8 line-clamp-1">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>}
      </div>

      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {badges.map((b, i) => <div key={i}>{b}</div>)}
        </div>
      )}

      {description && (
        <p className="text-sm text-slate-600 line-clamp-2 mt-1">{description}</p>
      )}

      <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-400">
        <span className="uppercase tracking-wider">{status || 'Draft'}</span>
        {footer}
      </div>
    </Card>
  );
}
