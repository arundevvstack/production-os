import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ projectId: string; propId: string }> }) {
  const { propId } = await params;
  const body = await req.json();
  const updated = await prisma.productionProp.update({
    where: { id: propId },
    data: { ...body, updated_at: new Date() }
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ projectId: string; propId: string }> }) {
  const { propId } = await params;
  await prisma.productionProp.delete({ where: { id: propId } });
  return NextResponse.json({ deleted: true });
}
