import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const body = await req.json();
  const location = await prisma.productionLocation.create({
    data: {
      project_id: projectId,
      script_id: body.script_id,
      name: body.name,
      updated_at: new Date()
    }
  });
  return NextResponse.json(location, { status: 201 });
}
