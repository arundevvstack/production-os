import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ projectId: string; sceneId: string }> }) {
  const { sceneId } = await params;
  const body = await req.json();
  const scene = await prisma.productionScene.update({
    where: { id: sceneId },
    data: { ...body, updated_at: new Date() }
  });
  return NextResponse.json(scene);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ projectId: string; sceneId: string }> }) {
  const { sceneId } = await params;
  await prisma.productionScene.delete({ where: { id: sceneId } });
  return NextResponse.json({ deleted: true });
}
