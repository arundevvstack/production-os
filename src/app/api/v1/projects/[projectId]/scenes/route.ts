import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

async function ensureStoryboard(projectId: string) {
  let sb = await prisma.productionStoryboard.findUnique({ where: { project_id: projectId } });
  if (!sb) {
    let script = await prisma.productionScript.findUnique({ where: { project_id: projectId } });
    if (!script) {
      script = await prisma.productionScript.create({
        data: { id: require("crypto").randomUUID(), project_id: projectId, content: "", updated_at: new Date() }
      });
    }
    sb = await prisma.productionStoryboard.create({
      data: { project_id: projectId, script_id: script.id, updated_at: new Date() }
    });
  }
  return sb;
}

export async function GET(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const sb = await prisma.productionStoryboard.findUnique({ where: { project_id: projectId } });
  if (!sb) return NextResponse.json([]);
  const scenes = await prisma.productionScene.findMany({
    where: { storyboard_id: sb.id },
    include: { 
      ProductionShot: { 
        orderBy: { shot_number: "asc" },
        include: {
          ProductionAsset: {
            where: { status: "Active", type: "Shot" },
            include: { ProductionAssetVersion: { where: { is_current: true } } },
            take: 1
          }
        }
      } 
    },
    orderBy: { scene_number: "asc" }
  });
  return NextResponse.json(scenes);
}

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const sb = await ensureStoryboard(projectId);
  const body = await req.json();
  const maxScene = await prisma.productionScene.findFirst({
    where: { storyboard_id: sb.id },
    orderBy: { scene_number: "desc" }
  });
  const nextNumber = (maxScene?.scene_number ?? 0) + 1;
  const scene = await prisma.productionScene.create({
    data: {
      storyboard_id: sb.id,
      scene_number: body.scene_number ?? nextNumber,
      title: body.title || `Scene ${nextNumber}`,
      description: body.description || null,
      mood: body.mood || null,
      objective: body.objective || null,
      duration: body.duration || null,
      status: "draft",
      updated_at: new Date()
    }
  });
  return NextResponse.json(scene, { status: 201 });
}
