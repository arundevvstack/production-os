"use client";
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { X, Sparkles, AlertTriangle, FileText, Activity, Tags, CheckCircle2, Clapperboard, BookOpen, Link, Database, Clock, Edit2, Combine, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EntityInspectorPanelProps {
  entityId: string | null;
  items: any[];
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
}

export function EntityInspectorPanel({ entityId, items, onClose, onUpdateStatus }: EntityInspectorPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'scenes' | 'metadata' | 'notes' | 'ai' | 'references' | 'history'>('overview');
  
  if (!entityId) return null;
  
  const entity = items.find(i => i.id === entityId);
  if (!entity) return null;

  const validation = entity.metadata?.validation || {};
  const needsReview = validation.needs_review && entity.status !== 'Approved';

  const getDepartmentFields = () => {
    const category = (entity.category || entity.importance || entity.type || '').toLowerCase();
    
    if (['vfx', 'practical fx', 'cg', 'fire', 'smoke', 'weather'].includes(category) || entity.name?.toLowerCase().includes('vfx')) {
      return (
        <>
          <MetadataField label="Type" value={entity.metadata?.type || 'Simulation'} />
          <MetadataField label="Vendor" value={entity.metadata?.vendor || 'Pending'} />
          <MetadataField label="Complexity" value={entity.metadata?.complexity || 'High'} />
        </>
      );
    }
    
    if (['music', 'score', 'songs', 'background music'].includes(category) || entity.name?.toLowerCase().includes('music')) {
      return (
        <>
          <MetadataField label="Composer/Artist" value={entity.metadata?.composer || 'TBD'} />
          <MetadataField label="Cue Type" value={entity.metadata?.cue_type || 'Source'} />
          <MetadataField label="Mood" value={entity.metadata?.mood || 'Dramatic'} />
        </>
      );
    }

    if (['sfx', 'ambient', 'foley'].includes(category)) {
      return (
        <>
          <MetadataField label="Effect Type" value={entity.category} />
          <MetadataField label="Source" value={entity.metadata?.source_type || 'Library'} />
        </>
      );
    }

    if (['prop', 'hero prop', 'weapon', 'vehicle'].includes(category)) {
      return (
        <>
          <MetadataField label="Quantity required" value={entity.metadata?.quantity || '1'} />
          <MetadataField label="Condition" value={entity.metadata?.condition || 'New'} />
          <MetadataField label="Sourcing" value={entity.metadata?.sourcing || 'Build'} />
        </>
      );
    }

    return (
      <>
        {entity.gender && <MetadataField label="Gender" value={entity.gender} />}
        {entity.time_of_day && <MetadataField label="Time of Day" value={entity.time_of_day} />}
        {entity.type && <MetadataField label="Environment Type" value={entity.type} />}
      </>
    );
  };

  return (
    <div className="w-[340px] shrink-0 bg-white border-l border-slate-200 flex flex-col h-full animate-in slide-in-from-right duration-200 shadow-xl">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex flex-col gap-4 bg-slate-50/50">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-2">
            <h2 className="text-base font-black text-slate-900 truncate tracking-tight">{entity.name}</h2>
            <div className="text-xs text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
              <span className="font-bold text-red-600 bg-red-50 px-1.5 rounded">{entity.category || entity.importance || entity.type || 'Entity'}</span>
              {entity.metadata?.latin_name && (
                <>
                  <span className="text-slate-300">&bull;</span>
                  <span className="italic font-medium">{entity.metadata.latin_name}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors" title="Edit Entity">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors shrink-0" title="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex overflow-x-auto hide-scrollbar gap-1 bg-slate-100/80 p-1 rounded-lg">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<FileText className="w-3.5 h-3.5" />} label="Overview" />
          <TabButton active={activeTab === 'scenes'} onClick={() => setActiveTab('scenes')} icon={<Clapperboard className="w-3.5 h-3.5" />} label={`Scenes (${(entity.scenes || []).length})`} />
          <TabButton active={activeTab === 'metadata'} onClick={() => setActiveTab('metadata')} icon={<Database className="w-3.5 h-3.5" />} label="Metadata" />
          <TabButton active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} icon={<BookOpen className="w-3.5 h-3.5" />} label="Notes" />
          <TabButton active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} icon={<Sparkles className="w-3.5 h-3.5 text-red-500" />} label="AI Review" hasAlert={needsReview} />
          <TabButton active={activeTab === 'references'} onClick={() => setActiveTab('references')} icon={<Link className="w-3.5 h-3.5" />} label="Refs" />
          <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<Clock className="w-3.5 h-3.5" />} label="History" />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 hide-scrollbar bg-white">
        
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {needsReview && (
               <div className="bg-amber-50 border border-amber-200/60 rounded-lg p-3 flex flex-col gap-2">
                 <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                   <AlertTriangle className="w-3.5 h-3.5" /> Action Required
                 </div>
                 <p className="text-[11px] text-amber-700 leading-tight">
                   {validation.reason || "This entity was flagged by the Intelligence Engine."}
                 </p>
               </div>
            )}

            <div>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Description</h3>
              <p className="text-slate-700 text-sm leading-relaxed">{entity.description || <span className="text-slate-400 italic">No description available.</span>}</p>
            </div>

            <div>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Quick Attributes</h3>
              <div className="flex flex-wrap gap-1.5">
                {entity.metadata?.tags?.map((t: string) => (
                  <span key={t} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[11px] font-medium border border-slate-200/60">{t}</span>
                ))}
                {(!entity.metadata?.tags || entity.metadata.tags.length === 0) && (
                   <span className="text-xs text-slate-400 italic">None generated</span>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scenes' && (
          <div className="space-y-3">
             <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Appears In</h3>
             {(!entity.scenes || entity.scenes.length === 0) ? (
               <div className="border border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-center">
                 <Clapperboard className="w-8 h-8 text-slate-200 mb-2" />
                 <p className="text-xs text-slate-500 font-medium">No scenes linked.</p>
               </div>
             ) : (
               <div className="flex flex-col gap-2">
                 {entity.scenes.map((s: any, i: number) => (
                   <div key={i} className="flex items-center gap-3 p-2.5 border border-slate-100 rounded-lg hover:border-red-100 hover:bg-red-50/50 transition-all cursor-pointer group shadow-sm">
                     <span className="w-7 h-7 shrink-0 bg-slate-100 group-hover:bg-red-100 text-slate-600 group-hover:text-red-700 rounded-md text-[11px] font-black flex items-center justify-center">{s.scene_number || i+1}</span>
                     <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 truncate">{s.scene_header || "Unknown Scene"}</span>
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}

        {activeTab === 'metadata' && (
          <div className="space-y-5">
             <div>
               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Department Data</h3>
               <div className="grid grid-cols-2 gap-y-4 gap-x-3">
                 {getDepartmentFields()}
               </div>
             </div>

             {entity.metadata?.aliases && entity.metadata.aliases.length > 0 && (
               <div className="pt-4 border-t border-slate-100">
                 <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Known Aliases</h3>
                 <div className="flex flex-wrap gap-1.5">
                   {entity.metadata.aliases.map((alias: string, i: number) => (
                     <span key={i} className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 rounded text-[11px]">{alias}</span>
                   ))}
                 </div>
               </div>
             )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-4 h-full flex flex-col">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Production Notes</h3>
            <textarea 
              className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none"
              placeholder="Add departmental notes, requirements, or restrictions here..."
              defaultValue={entity.metadata?.production_notes || ""}
            />
            <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs h-8">Save Notes</Button>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-5">
            <div>
               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Extraction Telemetry</h3>
               <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                 <div className="flex justify-between items-center">
                   <span className="text-xs font-medium text-slate-500">Confidence Score</span>
                   <span className={cn("text-xs font-black", (validation.confidence_score || 1.0) > 0.8 ? "text-emerald-600" : "text-amber-600")}>
                     {Math.round((validation.confidence_score || 1.0) * 100)}%
                   </span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-xs font-medium text-slate-500">Source Extraction</span>
                   <span className="text-xs font-bold text-slate-800 truncate max-w-[140px]" title={entity.metadata?.source?.line_text || "N/A"}>
                     {entity.metadata?.source?.line_text || "N/A"}
                   </span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-xs font-medium text-slate-500">Method</span>
                   <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded uppercase">LLM Pass 1</span>
                 </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'references' && (
          <div className="space-y-4">
             <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visual References</h3>
             <div className="border border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-slate-50">
               <ImageIcon className="w-8 h-8 text-slate-300 mb-2" />
               <p className="text-xs text-slate-500 font-medium mb-3">No references attached.</p>
               <Button variant="outline" size="sm" className="h-8 text-[11px] font-semibold bg-white flex items-center gap-1">
                 <Sparkles className="w-3 h-3 text-red-500" />
                 Generate Reference
               </Button>
             </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
             <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Audit Log</h3>
             <div className="border-l-2 border-slate-100 pl-4 space-y-4 relative ml-2 mt-4">
               <div className="relative">
                 <div className="absolute w-2 h-2 bg-slate-300 rounded-full -left-[21px] top-1"></div>
                 <p className="text-xs text-slate-700"><span className="font-bold">Extracted</span> by AI Engine</p>
                 <p className="text-[10px] text-slate-400">12:30 PM Today</p>
               </div>
             </div>
          </div>
        )}
        
      </div>
      
      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200 bg-white flex flex-col gap-2 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        <div className="flex gap-2">
          {entity.status !== 'Approved' && (
            <Button onClick={() => onUpdateStatus(entity.id, 'Approved')} className="flex-1 bg-red-600 hover:bg-red-500 text-xs font-bold shadow-sm h-9">Approve</Button>
          )}
          {entity.status === 'Approved' && (
             <Button variant="outline" onClick={() => onUpdateStatus(entity.id, 'Draft')} className="flex-1 text-slate-600 text-xs font-bold h-9">Revert to Draft</Button>
          )}
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="flex-1 text-slate-600 text-[11px] font-semibold h-8 flex gap-1.5 bg-slate-50 hover:bg-slate-100">
             <Combine className="w-3.5 h-3.5" /> Merge
           </Button>
        </div>
      </div>

    </div>
  );
}

function MetadataField({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <span className="block text-[10px] font-semibold text-slate-400 mb-0.5">{label}</span>
      <span className="text-xs font-bold text-slate-800">{value}</span>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, hasAlert }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, hasAlert?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-md transition-all relative min-w-[72px] shrink-0",
        active ? "bg-white shadow-sm ring-1 ring-slate-200/50 text-red-700" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
      )}
    >
      {hasAlert && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />}
      <div className={cn(active ? "text-red-600" : "text-slate-400")}>{icon}</div>
      <span className={cn("text-[9px] font-bold tracking-wide uppercase", active ? "text-slate-800" : "text-slate-500")}>{label}</span>
    </button>
  );
}
