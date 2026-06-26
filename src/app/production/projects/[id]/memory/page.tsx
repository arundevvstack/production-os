import React from "react";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Search, Plus, Filter, User, Map, Paintbrush, Camera, Video, MoreHorizontal } from "lucide-react";

export default async function MemoryLibraryPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      creative_memories: {
        orderBy: { created_at: 'desc' }
      }
    }
  });

  if (!project) return notFound();

  const getIconForType = (type: string) => {
    switch (type) {
      case "Character": return <User className="h-4 w-4" />;
      case "Environment": return <Map className="h-4 w-4" />;
      case "Brand": return <Paintbrush className="h-4 w-4" />;
      case "Style": return <Camera className="h-4 w-4" />;
      default: return <Video className="h-4 w-4" />;
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case "Character": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Environment": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Brand": return "bg-purple-100 text-purple-700 border-purple-200";
      case "Style": return "bg-orange-100 text-orange-700 border-orange-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Creative Memory</h1>
          <p className="text-slate-500 mt-1">Maintain production continuity with reusable profiles.</p>
        </div>
        <button className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:scale-105 transition-transform">
          <Plus className="h-4 w-4" />
          Create Profile
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search characters, environments, brands..." 
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black transition"
          />
        </div>
        <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition">
          <Filter className="h-4 w-4" />
          Filter
        </button>
      </div>

      {/* Profiles Grid */}
      {project.creative_memories.length === 0 ? (
        <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-12 text-center">
          <div className="h-16 w-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Memories Found</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">Create profiles for characters, locations, or brand guidelines so they can be injected into your prompts automatically.</p>
          <button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow hover:bg-black transition">
            Create First Profile
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {project.creative_memories.map((memory) => (
            <div key={memory.id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl transition-shadow cursor-pointer group">
              <div className="flex items-start justify-between mb-4">
                <div className={`px-2.5 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 ${getColorForType(memory.type)}`}>
                  {getIconForType(memory.type)}
                  {memory.type}
                </div>
                <button className="text-slate-400 hover:text-black opacity-0 group-hover:opacity-100 transition">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-1">{memory.name}</h3>
              <p className="text-sm text-slate-500 line-clamp-2">{memory.description || "No description provided."}</p>
              
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-400">
                <span>Updated recently</span>
                <span className="text-blue-600 hover:underline">Edit Profile &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
