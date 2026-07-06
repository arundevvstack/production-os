import React from "react";
import prisma from "@/lib/prisma";
import { Users, MapPin, Package, Tag, Sparkles, BookOpen, Film, Aperture, Sun, Music, Zap } from "lucide-react";
import { BreakdownSection } from "./BreakdownSection";
import { ApproveBreakdownButton } from "./ApproveBreakdownButton";

export default async function ProductionBreakdownPage({ params }: { params: any }) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      ProductionScript: {
        include: {
          Characters: true,
          Locations: true,
          Props: true,
          Vehicles: true,
          Animals: true,
          ArtDirections: true,
          CameraPlans: true,
          Lightings: true,
          Audios: true,
          VFXs: true,
          BrandAssets: true,
          Analyses: true
        }
      }
    }
  });

  if (!project) return <div>Project not found</div>;

  const script = project.ProductionScript;
  if (!script) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center min-h-[50vh] bg-slate-50/50 rounded-3xl border border-slate-100">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
          <BookOpen className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-slate-800">No Script Available</h2>
        <p className="text-slate-500 max-w-md">Please upload or generate a script in the script editor first to extract the production breakdown.</p>
      </div>
    );
  }

  // Check if we have any items extracted
  const hasItems = script.Characters?.length > 0 || script.Locations?.length > 0 || script.Props?.length > 0;

  return (
    <div className="w-full h-full flex flex-col space-y-6 pb-12">
      {/* Compact Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Production Breakdown</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-emerald-500" /> AI Extracted
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Review and approve extracted elements for downstream pipelines.
            </p>
          </div>
        </div>
        
        {hasItems && <ApproveBreakdownButton projectId={id} />}
      </div>

      {!hasItems ? (
        <div className="p-12 text-center flex flex-col items-center justify-center min-h-[40vh] bg-white rounded-3xl border border-slate-200 border-dashed">
          <h2 className="text-xl font-bold mb-2 text-slate-800">No Breakdown Elements Found</h2>
          <p className="text-slate-500 max-w-md">Return to the script editor and click "Extract Breakdown" to populate these items.</p>
        </div>
      ) : (
        /* Grid Layout - Full Width */
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
          <BreakdownSection title="Characters" icon={<Users />} items={script.Characters} />
          <BreakdownSection title="Locations" icon={<MapPin />} items={script.Locations} />
          <BreakdownSection title="Props" icon={<Package />} items={script.Props} />
          <BreakdownSection title="Vehicles" icon={<Tag />} items={script.Vehicles} />
          <BreakdownSection title="Animals" icon={<Tag />} items={script.Animals} />
          <BreakdownSection title="Art Direction" icon={<Aperture />} items={script.ArtDirections} />
          <BreakdownSection title="Camera & Lenses" icon={<Film />} items={script.CameraPlans} />
          <BreakdownSection title="Lighting" icon={<Sun />} items={script.Lightings} />
          <BreakdownSection title="Audio & Sound" icon={<Music />} items={script.Audios} />
          <BreakdownSection title="VFX & SFX" icon={<Zap />} items={script.VFXs} />
          <BreakdownSection title="Brand Assets" icon={<Tag />} items={script.BrandAssets} />
        </div>
      )}

      {script.Analyses && script.Analyses.length > 0 && (
        <div className="mt-8 border-t pt-8">
          <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2">
            <Clock className="h-6 w-6 text-blue-600" />
            AI Intelligence & Insights
          </h2>
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <pre className="text-xs whitespace-pre-wrap text-slate-600 font-mono overflow-auto max-h-96">
              {JSON.stringify(script.Analyses[0], null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
