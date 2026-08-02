import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const script = await prisma.productionScript.findUnique({ where: { project_id: projectId } });
  return NextResponse.json(script || null);
}

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const body = await req.json();

  // ARCHITECTURE: one ProductionScript per project — always upsert
  const script = await prisma.productionScript.upsert({
    where: { project_id: projectId },
    create: {
      id: require("crypto").randomUUID(),
      project_id: projectId,
      content: body.content || "",
      updated_at: new Date()
    },
    update: {
      content: body.content,
      updated_at: new Date()
    }
  });

  return NextResponse.json(script);
}
