import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        ProductionCharacter: { select: { id: true } },
        ProductionStoryboard: {
          include: {
            ProductionScene: {
              select: {
                id: true,
                ProductionShot: {
                  select: {
                    id: true,
                    ProductionAsset: { select: { id: true } }
                  }
                }
              }
            }
          }
        }
      }
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    
    // Calculate counts and progress
    const characterCount = project.ProductionCharacter.length;
    let sceneCount = 0;
    let shotCount = 0;
    let generatedShotCount = 0;
    
    if (project.ProductionStoryboard) {
      sceneCount = project.ProductionStoryboard.ProductionScene.length;
      for (const scene of project.ProductionStoryboard.ProductionScene) {
        shotCount += scene.ProductionShot.length;
        for (const shot of scene.ProductionShot) {
          if (shot.ProductionAsset.length > 0) {
            generatedShotCount++;
          }
        }
      }
    }
    
    const generateProgress = shotCount > 0 ? Math.round((generatedShotCount / shotCount) * 100) : 0;

    // Fetch Workflow Engine Stages
    const { WorkflowEngine } = await import("@/lib/production/WorkflowEngine");
    const workflowState = await WorkflowEngine.getWorkflowState(projectId);

    return NextResponse.json({
      ...project,
      workflowState,
      counts: {
        characters: characterCount,
        scenes: sceneCount,
        shots: shotCount,
        progress: generateProgress
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const body = await req.json();
    
    let projectRef = body.description; // fallback for old brief
    if (body.brief !== undefined || body.notes !== undefined || body.references !== undefined) {
      projectRef = JSON.stringify({
        brief: body.brief || "",
        notes: body.notes || "",
        references: body.references || ""
      });
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(body.name !== undefined && { project_name: body.name }),
        ...(projectRef !== undefined && { project_ref: projectRef })
      }
    });

    return NextResponse.json(project);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    
    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Delete project
    await prisma.project.delete({
      where: { id: projectId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete project:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
