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
  const existing = await prisma.productionScript.findUnique({ where: { project_id: projectId } });
  if (existing) {
    const updated = await prisma.productionScript.update({
      where: { project_id: projectId },
      data: { content: body.content, updated_at: new Date() }
    });
    return NextResponse.json(updated);
  }
  const created = await prisma.productionScript.create({
    data: {
      id: require("crypto").randomUUID(),
      project_id: projectId,
      content: body.content || "",
      updated_at: new Date()
    }
  });
  return NextResponse.json(created, { status: 201 });
}
