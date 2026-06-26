import React from "react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StageHeader } from "@/components/production/StageHeader";
import { WorkflowEngine } from "@/lib/production/WorkflowEngine";
import { ChecklistPanel } from "@/components/production/ChecklistPanel";
import { CommentThread } from "@/components/production/CommentThread";
import { ActivityTimeline } from "@/components/production/ActivityTimeline";
import { StatusBadge } from "@/components/production/StatusBadge";
import Link from "next/link";
import { Video, Sparkles, Image as ImageIcon, Music, User, Mic, Layout, FileText, ExternalLink, Paperclip, CheckSquare } from "lucide-react";

function getAssetIcon(type: string) {
  switch (type) {
    case 'Video': return <Video className="h-4 w-4" />;
    case 'Image': return <ImageIcon className="h-4 w-4" />;
    case 'Voice': return <Mic className="h-4 w-4" />;
    case 'Music':
    case 'SFX': return <Music className="h-4 w-4" />;
    case 'Character': return <User className="h-4 w-4" />;
    default: return <Layout className="h-4 w-4" />;
  }
}

function getReferenceIcon(type: string) {
  switch (type) {
    case 'Video': return <Video className="h-5 w-5" />;
    case 'Image': return <ImageIcon className="h-5 w-5" />;
    case 'PDF': return <FileText className="h-5 w-5" />;
    case 'Link': return <ExternalLink className="h-5 w-5" />;
    default: return <Layout className="h-5 w-5" />;
  }
}

export default async function SceneDashboardPage({ params }: { params: { id: string, sceneId: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id }
  });

  if (!project) redirect(`/production/projects`);

  const statusInfo = WorkflowEngine.evaluateStageStatus('scene_workspace', project);
  if (statusInfo.isLocked) redirect(`/production/projects/${params.id}`);

  const scene = await prisma.productionScene.findUnique({
    where: { id: params.sceneId },
    include: {
      shots: { include: { prompt_sets: true, assets: true }, orderBy: { shot_number: 'asc' } },
      references: true,
      assets: true
    }
  });

  if (!scene) redirect(`/production/projects/${params.id}/scenes`);

  const totalShots = scene.shots.length;
  const completedShots = scene.shots.filter(s => s.status === 'Completed').length;
  const promptsDefined = scene.shots.filter(s => s.prompt_sets.length > 0).length;

  const fakeChecklist = [
    { id: '1', content: 'Storyboard Approved', is_completed: true, is_required: true },
    { id: '2', content: 'Shots Completed', is_completed: completedShots === totalShots && totalShots > 0, is_required: true },
    { id: '3', content: 'Prompts Reviewed', is_completed: false, is_required: false },
    { id: '4', content: 'References Added', is_completed: scene.references.length > 0, is_required: true },
    { id: '5', content: 'Scene Ready', is_completed: scene.status === 'Completed', is_required: true }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="border-b pb-6 mb-6">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <Link href={`/production/projects/${params.id}/scenes`} className="hover:text-black">Scenes</Link>
          <span>/</span>
          <span className="text-black">Scene {scene.scene_number.toString().padStart(2, '0')}</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">S{scene.scene_number.toString().padStart(2, '0')}: {scene.title}</h1>
            <p className="text-slate-500 max-w-2xl">{scene.description || "No description provided."}</p>
          </div>
          <div className="flex items-center gap-4">
            <StatusBadge status={scene.status} />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-6 text-sm">
          {scene.mood && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Mood:</span>
              <span className="font-medium bg-slate-100 px-2 py-0.5 rounded border">{scene.mood}</span>
            </div>
          )}
          {scene.objective && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Objective:</span>
              <span className="font-medium bg-slate-100 px-2 py-0.5 rounded border">{scene.objective}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Duration:</span>
            <span className="font-medium text-slate-900">{scene.duration || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Progress:</span>
            <span className="font-bold text-slate-900">{scene.completion_pct}%</span>
          </div>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="border rounded-xl bg-white p-4 shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase mb-1">Total Shots</div>
          <div className="text-2xl font-bold">{totalShots}</div>
        </div>
        <div className="border rounded-xl bg-white p-4 shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase mb-1">Completed Shots</div>
          <div className="text-2xl font-bold">{completedShots}</div>
        </div>
        <div className="border rounded-xl bg-white p-4 shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase mb-1">Prompts Set</div>
          <div className="text-2xl font-bold">{promptsDefined}</div>
        </div>
        <div className="border rounded-xl bg-white p-4 shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase mb-1">References</div>
          <div className="text-2xl font-bold">{scene.references.length}</div>
        </div>
        <div className="border rounded-xl bg-white p-4 shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase mb-1">Scene Assets</div>
          <div className="text-2xl font-bold">{scene.assets.length}</div>
        </div>
        <div className="border rounded-xl bg-white p-4 shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase mb-1 flex items-center gap-1">
            <CheckSquare className="h-3 w-3" /> Checklist
          </div>
          <div className="text-2xl font-bold">{fakeChecklist.filter(c => c.is_completed).length}/{fakeChecklist.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Production Content */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Shot Manager */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Video className="h-5 w-5 text-slate-400" /> Shot Manager
            </h2>
            <div className="space-y-4">
              {scene.shots.map((shot) => {
                const promptSet = shot.prompt_sets[0];
                return (
                  <div key={shot.id} className="border rounded-xl bg-white shadow-sm overflow-hidden flex flex-col md:flex-row hover:shadow-md transition">
                    <div className="bg-slate-900 text-white w-full md:w-16 flex flex-row md:flex-col items-center justify-center font-bold text-lg p-2 md:p-0">
                      <span className="text-[10px] text-slate-400 mr-2 md:mr-0 md:mb-1 uppercase tracking-widest">Shot</span>
                      {shot.shot_number}
                    </div>
                    <div className="p-4 flex-1">
                      <div className="flex items-center justify-between mb-3 border-b pb-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 text-sm">
                          <div><div className="text-slate-400 text-xs font-semibold uppercase">Camera</div><div className="font-medium">{shot.camera || "—"}</div></div>
                          <div><div className="text-slate-400 text-xs font-semibold uppercase">Movement</div><div className="font-medium">{shot.movement || "—"}</div></div>
                          <div><div className="text-slate-400 text-xs font-semibold uppercase">Lens</div><div className="font-medium">{shot.lens || "—"}</div></div>
                          <div><div className="text-slate-400 text-xs font-semibold uppercase">Duration</div><div className="font-medium">{shot.duration || "—"}</div></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex gap-4">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-slate-400" />
                            <span className="font-medium">Prompt:</span>
                            {promptSet ? (
                              <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs font-bold uppercase">{promptSet.status}</span>
                            ) : (
                              <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-xs font-bold uppercase">Missing</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4 text-slate-400" />
                            <span className="font-medium">Assets:</span>
                            <span className="text-slate-600 font-bold">{shot.assets.length}</span>
                          </div>
                        </div>
                        {promptSet && (
                          <Link 
                            href={`/production/projects/${project.id}/prompts`}
                            className="text-xs font-medium text-blue-600 hover:underline"
                          >
                            View Prompt
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {scene.shots.length === 0 && (
                <div className="p-8 text-center border-2 border-dashed rounded-xl text-slate-500 bg-white">
                  No shots defined for this scene.
                </div>
              )}
            </div>
          </section>

          {/* Reference Library */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-slate-400" /> Reference Library
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {scene.references.map(ref => (
                <div key={ref.id} className="border rounded-xl bg-white shadow-sm overflow-hidden flex flex-col group cursor-pointer hover:shadow-md transition">
                  <div className="h-24 bg-slate-100 flex items-center justify-center text-slate-300 group-hover:text-slate-400 transition border-b relative">
                    {ref.thumbnail_url ? (
                      <img src={ref.thumbnail_url} alt={ref.title} className="w-full h-full object-cover" />
                    ) : (
                      getReferenceIcon(ref.type)
                    )}
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold uppercase px-1.5 py-0.5 rounded backdrop-blur-sm">
                      {ref.type}
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-semibold text-sm line-clamp-1">{ref.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">Uploaded {ref.created_at.toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              <div className="border-2 border-dashed rounded-xl bg-slate-50 flex flex-col items-center justify-center text-slate-500 h-[158px] cursor-pointer hover:bg-slate-100 transition">
                <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center shadow-sm text-black font-bold mb-2">+</div>
                <span className="text-xs font-semibold uppercase tracking-wider">Add Reference</span>
              </div>
            </div>
          </section>

          {/* Asset Placeholders */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Layout className="h-5 w-5 text-slate-400" /> Scene Assets
            </h2>
            <div className="space-y-3">
              {scene.assets.map(asset => (
                <div key={asset.id} className="border rounded-xl bg-white shadow-sm p-4 flex items-center justify-between hover:shadow-md transition">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                      {getAssetIcon(asset.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{asset.type} Placeholder</span>
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 text-[10px] uppercase font-bold rounded">v{asset.version}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{asset.notes || "No notes."}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={asset.status} />
                    {asset.assigned_to && (
                      <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0" title={asset.assigned_to}>
                        {asset.assigned_to.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {scene.assets.length === 0 && (
                <div className="p-8 text-center border-2 border-dashed rounded-xl text-slate-500 bg-white">
                  No asset placeholders defined for this scene.
                </div>
              )}
            </div>
          </section>
          
        </div>

        {/* Sidebar Tools */}
        <div className="space-y-8">
          <ChecklistPanel 
            items={fakeChecklist} 
            onToggleItem={async () => { "use server"; }} 
          />
          <CommentThread 
            comments={[]}
            onAddComment={async () => { "use server"; }}
          />
          <ActivityTimeline 
            events={[
              { id: '1', eventType: 'SCENE_CREATED', description: 'Scene extracted from storyboard', actorName: 'System', created_at: scene.created_at.toISOString() }
            ]} 
          />
        </div>
      </div>
    </div>
  );
}
