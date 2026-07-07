import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const sb = await prisma.productionStoryboard.findUnique({ where: { project_id: projectId } });
  if (!sb) return NextResponse.json([]);
  const shots = await prisma.productionShot.findMany({
    where: { ProductionScene: { storyboard_id: sb.id } },
    include: { ProductionScene: { select: { scene_number: true, title: true } } },
    orderBy: [{ ProductionScene: { scene_number: "asc" } }, { shot_number: "asc" }]
  });
  return NextResponse.json(shots);
}

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const body = await req.json();
  if (!body.scene_id) return NextResponse.json({ error: "scene_id required" }, { status: 400 });
  const maxShot = await prisma.productionShot.findFirst({
    where: { scene_id: body.scene_id },
    orderBy: { shot_number: "desc" }
  });
  const nextNumber = (maxShot?.shot_number ?? 0) + 1;
  const shot = await prisma.productionShot.create({
    data: {
      scene_id: body.scene_id,
      shot_number: body.shot_number ?? nextNumber,
      camera: body.camera || null,
      movement: body.movement || null,
      lens: body.lens || null,
      environment: body.environment || null,
      character: body.character || null,
      lighting: body.lighting || null,
      duration: body.duration || null,
      updated_at: new Date()
    }
  });
  return NextResponse.json(shot, { status: 201 });
}
