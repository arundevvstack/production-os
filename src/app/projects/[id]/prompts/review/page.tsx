import React from "react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Database } from "lucide-react";
import { PromptCard } from "../PromptCard";

export default async function PromptReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  // Verify project exists
  const project = await prisma.project.findUnique({
    where: { id: resolvedParams.id }
  });

  if (!project) redirect(`/projects`);

  // Direct, flat query for approved prompts linked to this project
  const approvedPrompts = await prisma.productionPrompt.findMany({
    where: {
      ProductionShot: {
        ProductionScene: {
          ProductionStoryboard: {
            project_id: resolvedParams.id
          }
        }
      },
      Versions: {
        some: {
          status: "Approved"
        }
      }
    },
    include: {
      ProductionShot: true,
      Versions: {
        where: { status: "Approved" },
        orderBy: { version_number: 'desc' },
        take: 1
      }
    }
  });

  return (
    <div className="w-full space-y-6 pb-20">
      
      <div className="grid gap-6">
        <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="text-indigo-500 w-5 h-5" />
            <span className="font-bold">Approved Prompts Repository</span>
          </div>
        </div>

        {approvedPrompts.length === 0 ? (
          <div className="p-12 text-center border rounded-xl bg-slate-50 text-slate-500">
            No approved prompts yet. Go back to Prompt Studio to approve them.
          </div>
        ) : (
          <div className="space-y-8">
            {approvedPrompts.map((prompt: any) => {
              const v = prompt.Versions[0];
              const shot = prompt.ProductionShot;
              if (!v || !shot) return null;
              
              return (
                <PromptCard 
                  key={prompt.id} 
                  version={v} 
                  shot={shot} 
                  projectId={resolvedParams.id} 
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}