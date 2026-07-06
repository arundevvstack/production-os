"use client";

import React, { useState } from "react";
import { Sparkles, Image as ImageIcon, Loader2 } from "lucide-react";
import { generateShotPrompts } from "@/app/projects/[id]/prompts/actions";
import { CreateJobDialog } from "@/components/production/CreateJobDialog";
import { useToast } from "@/hooks/use-toast";

interface ShotPromptCardProps {
  projectId: string;
  sceneId: string;
  shot: any;
  providers: any[];
}

export function ShotPromptCard({ projectId, sceneId, shot, providers }: ShotPromptCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const promptSet = shot.ProductionPromptSet?.[0];

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateShotPrompts(projectId, shot.id);
      toast({ title: "Success", description: "Prompts generated successfully!" });
    } catch (error: any) {
      toast({ title: "Generation Failed", description: error.message || "Failed to generate prompts.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="border rounded-xl bg-white shadow-sm overflow-hidden flex flex-col md:flex-row hover:shadow-md transition">
      <div className="bg-slate-900 text-white w-full md:w-16 flex flex-row md:flex-col items-center justify-center font-bold text-lg p-2 md:p-0 relative">
        <span className="text-[10px] text-slate-400 mr-2 md:mr-0 md:mb-1 uppercase tracking-widest">Shot</span>
        {shot.shot_number}
      </div>
      <div className="p-6 flex-1 space-y-4 relative">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {promptSet ? (
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="text-xs flex items-center gap-1 font-medium bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-200 transition disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Regenerate
            </button>
          ) : (
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="text-xs flex items-center gap-1 font-semibold bg-indigo-600 text-white px-3 py-1.5 rounded-lg border border-indigo-700 hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm"
            >
              {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Generate AI Prompts
            </button>
          )}
          <CreateJobDialog 
            projectId={projectId}
            sceneId={sceneId}
            shotId={shot.id}
            promptSetId={promptSet?.id || ''}
            providers={providers}
          />
        </div>

        {promptSet ? (
          <>
            <div className="flex items-center justify-between mb-2 pr-48">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <ImageIcon className="h-3 w-3" /> Image Prompt
              </span>
              <span className="text-xs font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                {promptSet.status}
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 font-medium border border-slate-100 leading-relaxed mr-24">
              {promptSet.image_prompt || "No image prompt defined."}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Video Prompt
                </span>
                <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 min-h-[80px]">
                  {promptSet.video_prompt || "No video prompt defined."}
                </div>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Character Prompt</span>
                <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 min-h-[80px]">
                  {promptSet.character_prompt || "No character prompt defined."}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-sm text-slate-500 py-6 italic flex items-center justify-center">
            {isGenerating ? (
              <span className="flex items-center gap-2 text-indigo-600 font-medium">
                <Loader2 className="w-4 h-4 animate-spin" /> Generating cinematic prompts...
              </span>
            ) : (
              "No prompt set created for this shot yet. Click 'Generate AI Prompts' to start."
            )}
          </div>
        )}
      </div>
    </div>
  );
}
