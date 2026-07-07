import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const characters = await prisma.productionCharacter.findMany({
    where: { project_id: projectId },
    include: { Costumes: true, Makeup: true },
    orderBy: { created_at: "asc" }
  });
  return NextResponse.json(characters);
}

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const body = await req.json();
  let script = await prisma.productionScript.findUnique({ where: { project_id: projectId } });
  if (!script) {
    script = await prisma.productionScript.create({
      data: { id: require("crypto").randomUUID(), project_id: projectId, content: "", updated_at: new Date() }
    });
  }
  const character = await prisma.productionCharacter.create({
    data: {
      project_id: projectId,
      script_id: script.id,
      name: body.name,
      age: body.age || null,
      gender: body.gender || null,
      description: body.description || null,
      personality: body.personality || null,
      reference_prompt: body.reference_prompt || null,
      reference_image_url: body.reference_image_url || null,
      updated_at: new Date()
    }
  });
  return NextResponse.json(character, { status: 201 });
}
