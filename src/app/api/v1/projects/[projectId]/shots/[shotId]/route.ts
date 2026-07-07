import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ projectId: string; shotId: string }> }) {
  const { shotId } = await params;
  const body = await req.json();
  const shot = await prisma.productionShot.update({
    where: { id: shotId },
    data: { ...body, updated_at: new Date() }
  });
  return NextResponse.json(shot);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ projectId: string; shotId: string }> }) {
  const { shotId } = await params;
  await prisma.productionShot.delete({ where: { id: shotId } });
  return NextResponse.json({ deleted: true });
}
