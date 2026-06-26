import React from "react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { StageHeader } from "@/components/production/StageHeader";
import { ChecklistPanel } from "@/components/production/ChecklistPanel";
import { CommentThread } from "@/components/production/CommentThread";
import { WorkflowEngine } from "@/lib/production/WorkflowEngine";
import { GripVertical, Image as ImageIcon } from "lucide-react";

export default async function StoryboardPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { production_storyboard: { include: { scenes: { orderBy: { scene_number: 'asc' } } } }, production_script: true }
  });

  if (!project) redirect(`/production/projects`);
  
  const statusInfo = WorkflowEngine.evaluateStageStatus('storyboard', project);
  if (statusInfo.isLocked) redirect(`/production/projects/${params.id}`);

  const storyboard = project.production_storyboard;
  const scenes = storyboard?.scenes || [];

  const fakeChecklist = [
    { id: '1', content: 'All scenes blocked', is_completed: true, is_required: true },
    { id: '2', content: 'Lighting references added', is_completed: false, is_required: false },
    { id: '3', content: 'Director Approval', is_completed: storyboard?.is_completed || false, is_required: true }
  ];
  
  const fakeComments = [];

  async function completeStoryboardAction() {
    "use server";
    if (!storyboard) return;
    await prisma.productionStoryboard.update({
      where: { id: storyboard.id },
      data: { is_completed: true, completion_pct: 100, status: 'Completed' }
    });
    revalidatePath(`/production/projects/${params.id}`);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <StageHeader 
        title="Storyboard"
        status={statusInfo.status}
        progress={storyboard?.completion_pct || 0}
        commentsCount={fakeComments.length}
        attachmentsCount={0}
        onComplete={completeStoryboardAction}
        isCompleteLocked={storyboard?.is_completed || false}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {scenes.map((scene) => (
            <div key={scene.id} className="border rounded-2xl bg-white shadow-sm p-4 flex gap-4 hover:shadow-md transition">
              <div className="flex flex-col items-center justify-center cursor-move text-slate-300 hover:text-slate-500">
                <GripVertical className="h-5 w-5" />
              </div>
              
              <div className="h-24 w-32 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 border">
                <ImageIcon className="h-6 w-6 text-slate-400" />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">Scene {scene.scene_number}</span>
                    <span className="text-sm font-semibold text-black">{scene.title}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">{scene.status}</span>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2 mt-1">
                  {scene.description}
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs font-medium text-slate-500">
                  <span className="bg-slate-50 px-2 py-1 rounded border">Duration: {scene.duration || "N/A"}</span>
                </div>
              </div>
            </div>
          ))}

          {scenes.length === 0 && (
            <div className="py-20 text-center border-2 border-dashed rounded-2xl text-slate-500 bg-white">
              No scenes found.
            </div>
          )}
        </div>

        <div className="space-y-8">
          <ChecklistPanel 
            items={fakeChecklist} 
            onToggleItem={async () => { "use server"; }} 
          />
          <CommentThread 
            comments={fakeComments}
            onAddComment={async () => { "use server"; }}
          />
        </div>
      </div>
    </div>
  );
}
