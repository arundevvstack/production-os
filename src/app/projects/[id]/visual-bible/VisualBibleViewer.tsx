"use client";

import React, { useState } from "react";
import { Camera, Film, Users, MapPin, Zap, Music, Sun, PenTool, CheckCircle2, Edit3, X, Save, Loader2, Copy } from "lucide-react";
import { updateVisualBibleVersion, approveVisualBible } from "./actions";
import { useToast } from "@/hooks/use-toast";

function formatKey(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

function DataCard({ data }: { data: any }) {
  if (!data) return <div className="text-sm text-slate-400 p-4 italic">No data extracted yet.</div>;
  
  if (Array.isArray(data)) {
    return (
      <div className="flex flex-col gap-4 p-4">
        {data.map((item, idx) => (
          <div key={idx} className="bg-slate-50 border border-slate-100 rounded-lg p-4 shadow-sm">
            {Object.entries(item).map(([key, value]) => (
              <div key={key} className="mb-2 last:mb-0">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{formatKey(key)}</span>
                <p className="text-sm text-slate-800 mt-0.5 leading-relaxed">{String(value)}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (typeof data === "object") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">{formatKey(key)}</span>
            <p className="text-sm text-slate-900 leading-relaxed font-medium">
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </p>
          </div>
        ))}
      </div>
    );
  }

  return <div className="p-4">{String(data)}</div>;
}

export function VisualBibleViewer({ projectId, version, readOnly = false }: { projectId: string, version: any, readOnly?: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [editJson, setEditJson] = useState("");
  const { toast } = useToast();

  const handleEditClick = () => {
    // Exclude metadata fields to only edit the bible content
    const { id, visual_bible_id, version_number, status, created_at, updated_at, ...editableData } = version;
    setEditJson(JSON.stringify(editableData, null, 2));
    setIsEditing(true);
  };

  const handleCopyClick = () => {
    const { id, visual_bible_id, version_number, status, created_at, updated_at, ...copyData } = version;
    navigator.clipboard.writeText(JSON.stringify(copyData, null, 2));
    toast({ title: "Copied!", description: "Visual Bible JSON copied to clipboard." });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const parsed = JSON.parse(editJson);
      const res = await updateVisualBibleVersion(projectId, version.id, parsed);
      if (res.success) {
        toast({ title: "Saved successfully", description: "Visual Bible has been updated." });
        setIsEditing(false);
      } else {
        throw new Error(res.error);
      }
    } catch (e: any) {
      toast({ title: "Invalid JSON", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    const res = await approveVisualBible(projectId, version.id);
    if (res.success) {
      toast({ title: "Approved!", description: "Visual Bible is approved. You can now move to the next stage." });
    } else {
      toast({ title: "Error", description: res.error, variant: "destructive" });
    }
    setIsApproving(false);
  };

  const Section = ({ title, icon: Icon, data, color }: any) => (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      <div className="bg-slate-50/80 backdrop-blur-sm border-b px-5 py-3.5 font-bold flex items-center gap-2.5">
        <Icon className={`w-5 h-5 ${color}`} /> 
        <span className="text-slate-800">{title}</span>
      </div>
      <div className="flex-1 overflow-auto max-h-[500px]">
        <DataCard data={data} />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Creative Directives {readOnly && <span className="text-sm font-normal text-slate-400 ml-2">(Read Only)</span>}
        </h2>
        
        {!readOnly && (
          <div className="flex gap-3">
            <button 
              onClick={handleCopyClick}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 transition-all shadow-sm"
            >
              <Copy className="w-4 h-4" /> Copy JSON
            </button>
            
            <button 
              onClick={handleEditClick}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 transition-all shadow-sm"
            >
              <Edit3 className="w-4 h-4" /> Edit JSON
            </button>
            
            {version.status !== "Approved" && (
              <button 
                onClick={handleApprove}
                disabled={isApproving}
                className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 flex items-center gap-2 transition-all shadow-sm shadow-emerald-600/20 disabled:opacity-50"
              >
                {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} 
                Approve Bible
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <Section title="Style Bible" icon={Film} color="text-indigo-500" data={version.style_bible} />
        <Section title="Cinematography" icon={Camera} color="text-emerald-500" data={version.cinematography_bible} />
        <Section title="Characters" icon={Users} color="text-purple-500" data={version.character_bible} />
        <Section title="Locations" icon={MapPin} color="text-blue-500" data={version.location_bible} />
        <Section title="Lighting" icon={Sun} color="text-orange-500" data={version.lighting_bible} />
        <Section title="Art Direction & Costumes" icon={PenTool} color="text-pink-500" data={{ art_direction: version.art_direction_bible, costumes: version.costume_bible, props: version.prop_bible }} />
        <Section title="Audio & Sound" icon={Music} color="text-yellow-500" data={version.audio_bible} />
        <Section title="VFX & Elements" icon={Zap} color="text-cyan-500" data={version.vfx_bible} />
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Edit Creative Directives</h3>
                <p className="text-xs text-slate-500 mt-0.5">Edit the raw JSON schema generated by the AI.</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 p-0 bg-slate-900 overflow-hidden relative">
              <textarea 
                value={editJson}
                onChange={(e) => setEditJson(e.target.value)}
                className="w-full h-full p-6 bg-transparent text-emerald-400 font-mono text-sm leading-relaxed outline-none resize-none"
                spellCheck={false}
              />
            </div>
            
            <div className="px-6 py-4 border-t bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}