import React from 'react';
import { BookOpen, Users, MapPin, Package, CheckCircle2, AlertCircle, Wand2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BreakdownHeader({ script, projectId }: { script: any, projectId: string }) {
  const characters = script?.Characters || [];
  const locations = script?.Locations || [];
  const props = script?.Props || [];
  
  const totalItems = characters.length + locations.length + props.length;
  const needsReview = [...characters, ...locations, ...props].filter(i => {
    const val = i.metadata?.validation || {};
    return val.low_confidence || val.spelling_changed || val.scene_header || val.prop_detected;
  }).length;

  const duplicates = [...characters, ...locations, ...props].filter(i => i.metadata?.validation?.duplicate).length;

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
      <div className="p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-bold tracking-widest uppercase border border-red-500/30">
              Enterprise Pre-Production
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" /> Extraction Complete
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Production Breakdown</h1>
          <p className="text-slate-400 max-w-xl text-sm leading-relaxed">
            AI has successfully extracted {totalItems} entities from your script. Review the metadata, merge duplicates, and approve entities to generate the Visual Bible.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-y md:divide-y-0 divide-slate-100 bg-slate-50 border-t border-slate-100">
        <div className="p-4 flex flex-col gap-1 bg-white">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Characters</span>
          <span className="text-2xl font-black text-slate-800">{characters.length}</span>
        </div>
        <div className="p-4 flex flex-col gap-1 bg-white">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Locations</span>
          <span className="text-2xl font-black text-slate-800">{locations.length}</span>
        </div>
        <div className="p-4 flex flex-col gap-1 bg-white">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> Props & More</span>
          <span className="text-2xl font-black text-slate-800">{props.length}</span>
        </div>
        <div className="p-4 flex flex-col gap-1 bg-white">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Scenes</span>
          <span className="text-2xl font-black text-slate-800">{script?.Scenes?.length || 0}</span>
        </div>
        <div className="p-4 flex flex-col gap-1 bg-red-50/50">
          <span className="text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Needs Review</span>
          <span className="text-2xl font-black text-red-600">{needsReview}</span>
        </div>
        <div className="p-4 flex flex-col gap-1 bg-amber-50/50">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">Duplicates</span>
          <span className="text-2xl font-black text-amber-600">{duplicates}</span>
        </div>
      </div>
    </div>
  );
}
