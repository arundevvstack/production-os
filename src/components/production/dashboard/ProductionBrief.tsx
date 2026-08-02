import React, { useState, useEffect } from 'react';
import { FileText, Save, Loader2, ChevronDown, ChevronRight, Paperclip, Link } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ProductionBriefProps {
  project: any;
  onSave: (data: { brief: string; notes: string; references: string }) => Promise<void>;
  isSaving: boolean;
}

export function ProductionBrief({ project, onSave, isSaving }: ProductionBriefProps) {
  const [brief, setBrief] = useState('');
  const [notes, setNotes] = useState('');
  const [references, setReferences] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ brief: true, notes: true, refs: true });

  useEffect(() => {
    if (!project) return;
    try {
      const parsed = JSON.parse(project.project_ref || '{}');
      setBrief(parsed.brief || '');
      setNotes(parsed.notes || '');
      setReferences(parsed.references || '');
    } catch (e) {
      setBrief(project.project_ref || '');
    }
  }, [project]);

  useEffect(() => {
    let currentSavedBrief = "";
    let currentSavedNotes = "";
    let currentSavedRefs = "";
    try {
      const parsed = JSON.parse(project?.project_ref || "{}");
      currentSavedBrief = parsed.brief || "";
      currentSavedNotes = parsed.notes || "";
      currentSavedRefs = parsed.references || "";
    } catch(e) {
      currentSavedBrief = project?.project_ref || "";
    }

    if (currentSavedBrief === brief && currentSavedNotes === notes && currentSavedRefs === references) return;

    const timeout = setTimeout(() => {
      onSave({ brief, notes, references });
    }, 1000);
    return () => clearTimeout(timeout);
  }, [brief, notes, references]);

  const toggle = (section: string) => setExpanded(prev => ({ ...prev, [section]: !prev[section] }));

  return (
    <Card className="bg-white shadow-sm border-slate-200">
      <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between py-4">
        <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
          <FileText className="w-5 h-5 text-slate-400" /> Production Brief
        </CardTitle>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          {isSaving ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" /> Saving...</>
          ) : (
            <><Save className="w-3.5 h-3.5 text-slate-400" /> Auto-saved</>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        
        {/* Brief */}
        <div className="border-b border-slate-100 last:border-0">
          <button onClick={() => toggle('brief')} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
            <span className="font-bold text-sm text-slate-700 uppercase tracking-wider">Brief & Requirements</span>
            {expanded.brief ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </button>
          {expanded.brief && (
            <div className="px-4 pb-4">
              <textarea 
                className="w-full min-h-[120px] p-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-y transition-all"
                placeholder="Describe the production goals, core requirements, and creative vision..."
                value={brief}
                onChange={e => setBrief(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="border-b border-slate-100 last:border-0">
          <button onClick={() => toggle('notes')} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
            <span className="font-bold text-sm text-slate-700 uppercase tracking-wider">Director's Notes</span>
            {expanded.notes ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </button>
          {expanded.notes && (
            <div className="px-4 pb-4">
              <textarea 
                className="w-full min-h-[100px] p-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-y transition-all"
                placeholder="Logistics, casting notes, location ideas, or feedback..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* References */}
        <div className="border-b border-slate-100 last:border-0">
          <button onClick={() => toggle('refs')} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
            <span className="font-bold text-sm text-slate-700 uppercase tracking-wider flex items-center gap-2"><Link className="w-4 h-4"/> References & Links</span>
            {expanded.refs ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </button>
          {expanded.refs && (
            <div className="px-4 pb-4">
              <textarea 
                className="w-full min-h-[80px] p-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-y transition-all"
                placeholder="Paste moodboard links, reference videos, or attachment URLs..."
                value={references}
                onChange={e => setReferences(e.target.value)}
              />
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  );
}
