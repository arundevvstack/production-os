import React from "react";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { GraphEngine } from "@/lib/production/intelligence/GraphEngine";
import { Search, Compass, Activity, Database, Clock, ChevronRight, User, Image as ImageIcon, Video, MoreHorizontal, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default async function CreativeExplorerPage({ params, searchParams }: { params: { id: string }, searchParams: { q?: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id }
  });

  if (!project) return notFound();

  // Graph Engine Integrations
  const stats = await GraphEngine.getStatistics(project.id);
  const timeline = await GraphEngine.getCreativeTimeline(project.id);
  const searchResults = searchParams.q ? await GraphEngine.universalSearch(project.id, searchParams.q) : [];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header & Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="col-span-1 md:col-span-4 flex items-end justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <Compass className="h-8 w-8 text-blue-600" />
              Creative Explorer
            </h1>
            <p className="text-slate-500 mt-1">Universal Search and Production Relationship Graph.</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Memory Profiles</div>
          <div className="text-3xl font-bold text-slate-900">{stats.memoryCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Assets Generated</div>
          <div className="text-3xl font-bold text-slate-900">{stats.assetCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">AI Jobs Executed</div>
          <div className="text-3xl font-bold text-slate-900">{stats.jobCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Approval Rate</div>
          <div className="text-3xl font-bold text-emerald-600">{stats.approvalRate.toFixed(1)}%</div>
        </div>
      </div>

      {/* Main Grid: Search & Explorer on left, Timeline on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Universal Search & Explorer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Search className="h-5 w-5 text-slate-400" /> Universal Search
            </h2>
            <form className="relative" action={`/production/projects/${project.id}/explorer`}>
              <Search className="h-5 w-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                name="q"
                defaultValue={searchParams.q || ""}
                type="text" 
                placeholder="Search Characters, Scenes, Prompts..." 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition font-medium"
              />
            </form>

            {/* Search Results / Dependency Visualizer */}
            {searchParams.q && (
              <div className="mt-6 space-y-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Graph Results for "{searchParams.q}"</div>
                {searchResults.length === 0 ? (
                  <div className="text-slate-500 text-sm italic">No matching nodes found in the creative graph.</div>
                ) : (
                  searchResults.map((res: any) => (
                    <div key={res.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition group">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-blue-600">
                          {res.type === 'Character' ? <User className="h-5 w-5" /> : <Database className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm group-hover:text-blue-700">{res.label}</div>
                          <div className="text-xs text-slate-500">{res.type}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition">View Dependencies</span>
                        <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Creative Timeline */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-[600px] flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Activity className="h-5 w-5 text-pink-500" /> Creative Timeline
          </h2>
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {timeline.length === 0 ? (
              <div className="text-center text-slate-500 mt-10 space-y-3">
                <Clock className="h-8 w-8 mx-auto text-slate-300" />
                <p className="text-sm">No activity recorded yet.</p>
              </div>
            ) : (
              timeline.map(event => (
                <div key={event.id} className="relative pl-6">
                  {/* Timeline Line */}
                  <div className="absolute left-[11px] top-6 bottom-[-24px] w-0.5 bg-slate-100 last:hidden" />
                  
                  {/* Timeline Dot */}
                  <div className={`absolute left-0 top-1.5 h-[22px] w-[22px] rounded-full border-4 border-white shadow-sm flex items-center justify-center
                    ${event.action === 'CREATED' ? 'bg-blue-500' : 
                      event.action === 'GENERATED' ? 'bg-purple-500' : 
                      event.action === 'APPROVED' ? 'bg-emerald-500' : 'bg-slate-500'}`} 
                  />

                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                      {format(new Date(event.created_at), 'MMM d, h:mm a')}
                    </div>
                    <div className="text-sm font-bold text-slate-800">
                      {event.entity_type} {event.action.toLowerCase()}
                    </div>
                    {event.user && (
                      <div className="text-xs text-slate-500 mt-1">by {event.user.name}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
