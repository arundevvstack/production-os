import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    
    // Fetch all approved prompt versions for this project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        ProductionStoryboard: { 
          include: { 
            ProductionScene: {
              include: {
                ProductionShot: {
                  include: {
                    ProductionPrompt: { 
                      include: { 
                        Versions: { 
                          where: { status: "Approved" },
                          orderBy: { version_number: 'desc' }, 
                          take: 1 
                        } 
                      } 
                    }
                  }
                }
              }
            }
          } 
        }
      }
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const allShots = project.ProductionStoryboard?.ProductionScene.flatMap((s: any) => s.ProductionShot) || [];
    const approvedPrompts = allShots
      .filter((s: any) => s.ProductionPrompt.length > 0 && s.ProductionPrompt[0].Versions.length > 0)
      .map((s: any) => ({
        shot_id: s.id,
        shot_number: s.shot_number,
        prompt: s.ProductionPrompt[0].Versions[0]
      }));

    return NextResponse.json(approvedPrompts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
