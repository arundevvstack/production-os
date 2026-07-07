import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ projectId: string; vehicleId: string }> }) {
  const { vehicleId } = await params;
  const body = await req.json();
  const updated = await prisma.productionVehicle.update({
    where: { id: vehicleId },
    data: { ...body, updated_at: new Date() }
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ projectId: string; vehicleId: string }> }) {
  const { vehicleId } = await params;
  await prisma.productionVehicle.delete({ where: { id: vehicleId } });
  return NextResponse.json({ deleted: true });
}
