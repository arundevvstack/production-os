import React from "react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Info, Download, History, Tag, Share2, MessageSquare, Image as ImageIcon, Video, Mic, Music, Layout } from "lucide-react";
import { format } from "date-fns";
import { AssetReviewBar } from "@/components/production/AssetReviewBar";

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string, assetId: string }> }) {
  const resolvedParams = await params;
  const asset = await prisma.productionAsset.findUnique({
    where: { id: resolvedParams.assetId },
    include: {
      ProductionScene: true,
      ProductionShot: true,
      ProductionAssetVersion: {
        orderBy: { version_number: 'desc' },
        include: {
          ProductionAIJob: {
            include: { ProductionAIProvider: true }
          }
        }
      }
    }
  });

  if (!asset || asset.ProductionAssetVersion.length === 0) redirect(`/projects/${resolvedParams.id}/assets`);

  const currentVersion = asset.ProductionAssetVersion[0];
  const previousVersions = asset.ProductionAssetVersion.slice(1);

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'Image': return <ImageIcon className="h-6 w-6" />;
      case 'Video': return <Video className="h-6 w-6" />;
      case 'Voice': return <Mic className="h-6 w-6" />;
      case 'Music': return <Music className="h-6 w-6" />;
      default: return <Layout className="h-6 w-6" />;
    }
  };

  // Safe extraction of text content if this was a text generation
  let textContent = null;
  if (asset.type === 'Text' && currentVersion.metadata) {
    const meta: any = currentVersion.metadata;
    if (meta.raw_response?.choices?.[0]?.message?.content) {
      textContent = meta.raw_response.choices[0].message.content;
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b pb-6">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${resolvedParams.id}/assets`} className="h-10 w-10 rounded-full border bg-white flex items-center justify-center hover:bg-slate-50 transition text-slate-500">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1 flex items-center gap-3">
              {asset.ProductionScene ? `S${asset.ProductionScene.scene_number.toString().padStart(2, '0')}` : 'General'}
              
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">v{currentVersion.version_number}</span>
            </h1>
            <p className="text-slate-500 text-sm">{asset.type} • Created {format(currentVersion.created_at, 'MMM d, yyyy')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50 transition text-sm font-medium bg-white">
            <Share2 className="h-4 w-4" /> Share
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50 transition text-sm font-medium bg-white">
            <Download className="h-4 w-4" /> Download
          </button>
        </div>
      </div>

      <AssetReviewBar projectId={resolvedParams.id} assetId={asset.id} currentStatus={asset.status} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center min-h-[500px] relative">
            {textContent ? (
              <div className="w-full h-full p-8 overflow-y-auto max-h-[700px] bg-slate-800 text-slate-100 font-mono text-sm whitespace-pre-wrap">
                {textContent}
              </div>
            ) : currentVersion.file_url ? (
              asset.type === 'Video' ? (
                <video src={currentVersion.file_url} controls className="w-full h-full object-contain max-h-[700px]" />
              ) : (
                <img src={currentVersion.file_url} alt="Asset preview" className="w-full h-full object-contain max-h-[700px]" />
              )
            ) : (
              <div className="text-slate-700 flex flex-col items-center gap-4">
                {getAssetIcon(asset.type)}
                <span className="text-sm font-medium">No preview available for this version</span>
              </div>
            )}
          </div>

          <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
            <div className="border-b p-4 bg-slate-50 flex items-center gap-2">
              <Info className="h-4 w-4 text-slate-400" />
              <h3 className="font-bold text-sm">Generation Parameters</h3>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Provider</div>
                <div className="font-medium">{currentVersion.provider_id || currentVersion.ProductionAIJob?.ProductionAIProvider.name || 'Unknown'}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Model</div>
                <div className="font-medium">{currentVersion.model_name || 'Unknown'}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Status</div>
                <div className="font-medium text-green-600">{currentVersion.status}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Source Job</div>
                {currentVersion.job_id ? (
                  <Link href={`/projects/${resolvedParams.id}/jobs/${currentVersion.job_id}`} className="font-mono text-blue-600 hover:underline">
                    {currentVersion.job_id.substring(0, 8)}...
                  </Link>
                ) : (
                  <div className="font-medium text-slate-500">Manual Upload</div>
                )}
              </div>
            </div>
            {currentVersion.metadata && Object.keys(currentVersion.metadata).length > 0 && (
              <div className="p-4 border-t bg-slate-50/50">
                <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Extended Metadata</div>
                <pre className="text-xs font-mono text-slate-700 bg-white p-3 rounded border">
                  {JSON.stringify(currentVersion.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Versions & Details */}
        <div className="space-y-6">
          <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
            <div className="border-b p-4 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-slate-400" />
                <h3 className="font-bold text-sm">Version History</h3>
              </div>
              <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{asset.ProductionAssetVersion.length}</span>
            </div>
            <div className="divide-y">
              {/* Current Version */}
              <div className="p-4 bg-blue-50/50 border-l-2 border-blue-500">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-sm">Version {currentVersion.version_number}</div>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase">Current</span>
                </div>
                <div className="text-xs text-slate-500 mb-2">{format(currentVersion.created_at, 'MMM d, yyyy HH:mm')}</div>
                <div className="text-xs line-clamp-2 text-slate-600 italic">
                  {currentVersion.notes || "No notes provided."}
                </div>
              </div>
              
              {/* Previous Versions */}
              {previousVersions.map(version => (
                <div key={version.id} className="p-4 hover:bg-slate-50 transition cursor-pointer group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-sm group-hover:text-blue-600 transition">Version {version.version_number}</div>
                    <button className="text-[10px] font-bold bg-white border text-slate-600 hover:bg-slate-100 px-2 py-0.5 rounded uppercase opacity-0 group-hover:opacity-100 transition">
                      Restore
                    </button>
                  </div>
                  <div className="text-xs text-slate-500 mb-2">{format(version.created_at, 'MMM d, yyyy HH:mm')}</div>
                  <div className="text-xs line-clamp-2 text-slate-500 italic">
                    {version.notes || "No notes provided."}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
            <div className="border-b p-4 bg-slate-50 flex items-center gap-2">
              <Tag className="h-4 w-4 text-slate-400" />
              <h3 className="font-bold text-sm">Tags</h3>
            </div>
            <div className="p-4 flex flex-wrap gap-2">
              {asset.tags.length > 0 ? (
                asset.tags.map(tag => (
                  <span key={tag} className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-medium border">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500 italic">No tags added.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
