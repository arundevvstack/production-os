import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ projectId: string; characterId: string }> }) {
  const { characterId } = await params;
  const body = await req.json();
  const updated = await prisma.productionCharacter.update({
    where: { id: characterId },
    data: { ...body, updated_at: new Date() }
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ projectId: string; characterId: string }> }) {
  const { characterId } = await params;
  await prisma.productionCharacter.delete({ where: { id: characterId } });
  return NextResponse.json({ deleted: true });
}
