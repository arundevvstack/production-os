import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      ProductionStoryboard: {
        include: {
          ProductionScene: {
            orderBy: { scene_number: "asc" },
            include: { ProductionShot: { orderBy: { shot_number: "asc" } } }
          }
        }
      }
    }
  });
  return NextResponse.json(project?.ProductionStoryboard || null);
}

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  let script = await prisma.productionScript.findUnique({ where: { project_id: projectId } });
  if (!script) {
    script = await prisma.productionScript.create({
      data: { id: require("crypto").randomUUID(), project_id: projectId, content: "", updated_at: new Date() }
    });
  }
  const existing = await prisma.productionStoryboard.findUnique({ where: { project_id: projectId } });
  if (existing) return NextResponse.json(existing);
  const sb = await prisma.productionStoryboard.create({
    data: { project_id: projectId, script_id: script.id, updated_at: new Date() }
  });
  return NextResponse.json(sb, { status: 201 });
}
