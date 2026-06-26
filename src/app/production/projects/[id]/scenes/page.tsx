import React from "react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StageHeader } from "@/components/production/StageHeader";
import { WorkflowEngine } from "@/lib/production/WorkflowEngine";
import { StatusBadge } from "@/components/production/StatusBadge";
import Link from "next/link";
import { ArrowRight, Clapperboard, Video, MessageSquare, Paperclip } from "lucide-react";

export default async function SceneWorkspacePage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { 
      production_script: true,
      production_storyboard: { 
        include: { 
          scenes: { 
            include: { 
              shots: true,
              assets: true,
              references: true 
            },
            orderBy: { scene_number: 'asc' }
          } 
        } 
      }
    }
  });

  if (!project) redirect(`/production/projects`);

  const statusInfo = WorkflowEngine.evaluateStageStatus('scene_workspace', project);
  if (statusInfo.isLocked) redirect(`/production/projects/${params.id}`);

  const scenes = project.production_storyboard?.scenes || [];

  return (
    <div className="max-w-6xl mx-auto">
      <StageHeader 
        title="Scene Workspace"
        status={statusInfo.status}
        progress={0}
      />

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenes.map((scene) => (
          <Link 
            key={scene.id}
            href={`/production/projects/${project.id}/scenes/${scene.id}`}
            className="block border rounded-2xl p-6 bg-white shadow-sm hover:shadow-md transition cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-slate-900 text-white font-bold text-sm">
                S{scene.scene_number.toString().padStart(2, '0')}
              </div>
              <StatusBadge status={scene.status} />
            </div>
            
            <h3 className="font-bold text-lg mb-1 line-clamp-1">{scene.title}</h3>
            <p className="text-sm text-slate-500 mb-4">{scene.duration || "N/A"}</p>
            
            <div className="mt-4 flex items-center justify-between text-xs font-medium text-slate-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><Video className="h-4 w-4" /> {scene.shots.length}</span>
                <span className="flex items-center gap-1"><Paperclip className="h-4 w-4" /> {scene.assets.length + scene.references.length}</span>
                <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" /> 0</span>
              </div>
              <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                {scene.assigned_to ? scene.assigned_to.charAt(0) : "?"}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex-1 mr-4">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1">
                  <span>Progress</span>
                  <span>{scene.completion_pct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${scene.completion_pct}%` }} />
                </div>
              </div>
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>
        ))}

        {scenes.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed rounded-2xl text-slate-500 bg-white">
            No scenes available. Complete Storyboard stage first.
          </div>
        )}
      </div>
    </div>
  );
}
