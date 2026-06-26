import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ProductionIntelligenceEngine } from "@/lib/production/ProductionIntelligenceEngine";

// Next.js route cache configuration (Cache this endpoint for 60 seconds)
export const revalidate = 60;

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
      include: {
        production_script: true,
        production_storyboard: {
          include: {
            scenes: {
              include: {
                references: true,
                assets: true,
                shots: {
                  include: {
                    prompt_sets: true,
                    assets: true
                  }
                }
              }
            }
          }
        },
        production_ai_jobs: true,
        production_assets: true,
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const report = ProductionIntelligenceEngine.evaluate(project);

    return NextResponse.json({ data: report });
  } catch (error) {
    console.error("Intelligence API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
