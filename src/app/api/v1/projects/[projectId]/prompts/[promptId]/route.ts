import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ projectId: string, promptId: string }> }) {
  try {
    const { promptId } = await params;
    const body = await req.json();

    const preset = await prisma.productionGenerationPreset.update({
      where: { id: promptId },
      data: {
        name: body.name,
        category: body.category,
        parameters: body.parameters
      }
    });

    return NextResponse.json(preset);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ projectId: string, promptId: string }> }) {
  try {
    const { promptId } = await params;

    await prisma.productionGenerationPreset.delete({
      where: { id: promptId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
