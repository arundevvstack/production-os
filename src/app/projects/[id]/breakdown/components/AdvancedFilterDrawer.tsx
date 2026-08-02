import React from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FilterCategory {
  id: string;
  label: string;
  options: string[];
}

interface AdvancedFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: FilterCategory[];
  activeFilters: Record<string, string[]>;
  onFilterChange: (categoryId: string, option: string) => void;
  onClearFilters: () => void;
}

export function AdvancedFilterDrawer({ isOpen, onClose, categories, activeFilters, onFilterChange, onClearFilters }: AdvancedFilterDrawerProps) {
  if (!isOpen) return null;

  const totalActive = Object.values(activeFilters).reduce((acc, curr) => acc + curr.length, 0);

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-red-500" />
            <h3 className="text-sm font-bold text-slate-800">Advanced Filters</h3>
            {totalActive > 0 && (
               <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                 {totalActive}
               </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {categories.map(category => (
            <div key={category.id} className="space-y-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{category.label}</h4>
              <div className="flex flex-col gap-1.5">
                {category.options.map(option => {
                  const isActive = activeFilters[category.id]?.includes(option);
                  return (
                    <label key={option} className="flex items-center gap-2 cursor-pointer group" onClick={(e) => { e.preventDefault(); onFilterChange(category.id, option); }}>
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0",
                        isActive ? "bg-red-500 border-red-500 text-white" : "border-slate-300 group-hover:border-red-400 bg-white"
                      )}>
                        {isActive && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3"><path d="M3.5 7L6 9.5L10.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <span className={cn(
                        "text-xs select-none font-medium",
                        isActive ? "text-slate-900" : "text-slate-600 group-hover:text-slate-900"
                      )}>{option}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3 shrink-0">
          <Button variant="outline" className="flex-1 text-xs h-9 bg-white" onClick={onClearFilters}>
            Clear All
          </Button>
          <Button className="flex-1 text-xs font-bold h-9 bg-red-600 hover:bg-red-500 text-white shadow-sm" onClick={onClose}>
            Apply Filters
          </Button>
        </div>
      </div>
    </>
  );
}
