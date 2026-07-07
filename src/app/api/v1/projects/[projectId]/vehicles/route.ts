import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const body = await req.json();
  const vehicle = await prisma.productionVehicle.create({
    data: {
      project_id: projectId,
      script_id: body.script_id,
      name: body.name,
      updated_at: new Date()
    }
  });
  return NextResponse.json(vehicle, { status: 201 });
}
