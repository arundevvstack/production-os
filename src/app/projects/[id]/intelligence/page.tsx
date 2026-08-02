import React from 'react';
import prisma from "@/lib/prisma";
import { Cpu, CheckCircle2, AlertTriangle, Layers } from "lucide-react";
import { GenerateIntelligenceButton } from './GenerateIntelligenceButton';

export default async function ProductionIntelligencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      ProductionPackage: true
    }
  });

  if (!project) return <div>Project not found</div>;

  const shotCount = await prisma.productionShot.count({
    where: { ProductionScene: { ProductionStoryboard: { project_id: id } } }
  });

  const packageCount = project.ProductionPackage.length;
  const progress = shotCount > 0 ? Math.round((packageCount / shotCount) * 100) : 0;

  return (
    <div className="h-full overflow-y-auto px-8 pt-6 pb-32 space-y-6 w-full">

      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
              <Cpu className="w-8 h-8 text-emerald-400" />
              Intelligence Core
            </h2>
            <p className="text-slate-300 max-w-2xl text-sm leading-relaxed">
              The Production Intelligence Engine acts as the central brain of the OS. 
              It automatically collects, normalizes, and validates all upstream creative data (Script, Characters, Visual Bible, Shots) 
              into canonical Production Packages to guarantee zero-hallucination Prompt Generation.
            </p>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 backdrop-blur-sm">
             <div className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Engine Status</div>
             <div className="text-3xl font-black text-emerald-400">{progress}%</div>
             <div className="text-xs text-slate-400 mt-1">{packageCount} of {shotCount} Packages Compiled</div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-slate-700/50 flex items-center justify-between">
          <div className="flex gap-4">
             <div className="flex items-center gap-2 text-sm font-semibold bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20">
               <CheckCircle2 className="w-4 h-4" /> Zod Type Safety Active
             </div>
             <div className="flex items-center gap-2 text-sm font-semibold bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-lg border border-amber-500/20">
               <AlertTriangle className="w-4 h-4" /> Strict Validation Mode
             </div>
          </div>
          <GenerateIntelligenceButton projectId={id} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
         <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
           <Layers className="w-5 h-5 text-slate-400" />
           Compiled Packages
         </h3>
         
         {packageCount === 0 ? (
           <div className="text-center py-12 text-slate-500">
              No Production Packages compiled yet. Click "Compile All Packages" to generate the intelligence graph.
           </div>
         ) : (
           <div className="space-y-4">
             {project.ProductionPackage.map((pkg: any) => (
               <div key={pkg.id} className="p-4 border rounded-lg flex items-center justify-between hover:bg-slate-50 transition">
                  <div>
                    <div className="text-sm font-bold text-slate-800">Package {pkg.id.slice(0,8)}</div>
                    <div className="text-xs text-slate-500 mt-1">Shot ID: {pkg.shot_id}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded">VALIDATED</span>
                    <span className="text-xs text-slate-400">{new Date(pkg.updated_at).toLocaleDateString()}</span>
                  </div>
               </div>
             ))}
           </div>
         )}
      </div>
    </div>
  );
}
