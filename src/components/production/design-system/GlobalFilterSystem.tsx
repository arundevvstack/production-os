import React from 'react';
import { cn } from '@/lib/utils';

export interface FilterCategory {
  id: string;
  label: string;
  options: string[];
}

interface GlobalFilterSystemProps {
  categories: FilterCategory[];
  activeFilters: Record<string, string[]>;
  onChange: (categoryId: string, option: string) => void;
  onClearAll: () => void;
}

export function GlobalFilterSystem({ categories, activeFilters, onChange, onClearAll }: GlobalFilterSystemProps) {
  
  const totalActive = Object.values(activeFilters).flat().length;

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-5 sticky top-28">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Filters</h4>
        {totalActive > 0 && (
          <button onClick={onClearAll} className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase transition-colors">
            Clear All ({totalActive})
          </button>
        )}
      </div>

      <div className="space-y-6">
        {categories.map(category => (
          <div key={category.id}>
            <h5 className="text-[11px] font-bold text-slate-800 uppercase mb-2.5">{category.label}</h5>
            <div className="flex flex-wrap gap-2">
              {category.options.map(opt => {
                const isActive = activeFilters[category.id]?.includes(opt);
                return (
                  <button 
                    key={opt} 
                    onClick={() => onChange(category.id, opt)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border",
                      isActive 
                        ? "bg-slate-800 text-white border-slate-800 shadow-sm" 
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                    )}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
