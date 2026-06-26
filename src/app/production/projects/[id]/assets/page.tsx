import React from "react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FolderOpen, Search, Filter, Image as ImageIcon, Video, Mic, Music, User, Layout, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default async function AssetLibraryPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id }
  });

  if (!project) redirect(`/production/projects`);

  const assets = await prisma.productionAsset.findMany({
    where: { project_id: params.id },
    include: {
      scene: true,
      shot: true,
      versions: {
        where: { is_current: true },
        take: 1
      }
    },
    orderBy: { created_at: 'desc' }
  });

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'Image': return <ImageIcon className="h-4 w-4" />;
      case 'Video': return <Video className="h-4 w-4" />;
      case 'Voice': return <Mic className="h-4 w-4" />;
      case 'Music': return <Music className="h-4 w-4" />;
      case 'Character': return <User className="h-4 w-4" />;
      default: return <Layout className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-end justify-between border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-blue-600" />
            Asset Library
          </h1>
          <p className="text-slate-500">Global repository for all generated production assets.</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by asset name, tags, or type..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-black outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50 transition text-sm font-medium">
            <Filter className="h-4 w-4" /> Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {assets.map((asset) => {
          const currentVersion = asset.versions[0];
          return (
            <Link 
              key={asset.id} 
              href={`/production/projects/${project.id}/assets/${asset.id}`}
              className="group border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition flex flex-col"
            >
              <div className="aspect-square bg-slate-100 relative flex items-center justify-center overflow-hidden">
                {currentVersion?.thumbnail_url ? (
                  <img src={currentVersion.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                ) : (
                  <div className="text-slate-300">
                    {getAssetIcon(asset.type)}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-white/90 text-black px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 backdrop-blur-sm shadow-sm">
                    <Eye className="h-3 w-3" /> View Asset
                  </div>
                </div>
                <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded backdrop-blur-sm">
                  {asset.type}
                </div>
              </div>
              <div className="p-3 border-t">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold text-sm line-clamp-1 text-slate-900">
                    {asset.scene ? `S${asset.scene.scene_number.toString().padStart(2, '0')}` : 'General'}
                    {asset.shot ? ` - Shot ${asset.shot.shot_number}` : ''}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">v{currentVersion?.version_number || 1}</div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs text-slate-500">{formatDistanceToNow(asset.created_at, { addSuffix: true })}</div>
                  <div className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${asset.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500'}`}>
                    {asset.status}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
        {assets.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl text-slate-500 bg-white">
            No assets generated yet.
          </div>
        )}
      </div>
    </div>
  );
}
