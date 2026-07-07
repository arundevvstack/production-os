import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Use ProductionGenerationPreset to act as the Prompt Library

export async function GET(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const presets = await prisma.productionGenerationPreset.findMany({
      where: { project_id: projectId },
      orderBy: { created_at: "desc" }
    });
    return NextResponse.json(presets);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const body = await req.json();

    // Since user_id is required on ProductionGenerationPreset, we'll use a dummy or first admin user
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "No user found" }, { status: 400 });

    const preset = await prisma.productionGenerationPreset.create({
      data: {
        project_id: projectId,
        user_id: user.id,
        name: body.name || "Untitled Prompt",
        category: body.category || "General",
        parameters: body.parameters || {}
      }
    });

    return NextResponse.json(preset);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
