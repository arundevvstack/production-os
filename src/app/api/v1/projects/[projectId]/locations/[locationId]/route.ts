import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ projectId: string; locationId: string }> }) {
  const { locationId } = await params;
  const body = await req.json();
  const updated = await prisma.productionLocation.update({
    where: { id: locationId },
    data: { ...body, updated_at: new Date() }
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ projectId: string; locationId: string }> }) {
  const { locationId } = await params;
  await prisma.productionLocation.delete({ where: { id: locationId } });
  return NextResponse.json({ deleted: true });
}
