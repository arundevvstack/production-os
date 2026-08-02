import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const body = await req.json();
    const { entityId, currentType, targetType } = body;

    if (!entityId || !currentType || !targetType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let sourceEntity = null;

    if (currentType === "Character") {
      sourceEntity = await prisma.productionCharacter.findUnique({ where: { id: entityId } });
      if (sourceEntity) await prisma.productionCharacter.delete({ where: { id: entityId } });
    } else if (currentType === "Location") {
      sourceEntity = await prisma.productionLocation.findUnique({ where: { id: entityId } });
      if (sourceEntity) await prisma.productionLocation.delete({ where: { id: entityId } });
    } else if (currentType === "Prop") {
      sourceEntity = await prisma.productionProp.findUnique({ where: { id: entityId } });
      if (sourceEntity) await prisma.productionProp.delete({ where: { id: entityId } });
    }

    if (!sourceEntity) {
      return NextResponse.json({ error: "Source entity not found" }, { status: 404 });
    }

    let newEntity = null;

    // Convert metadata safely
    const metadata = ((sourceEntity as any).metadata || {}) as any;
    if (!metadata.validation) metadata.validation = {};
    metadata.validation.converted_from = currentType;
    metadata.validation.low_confidence = false;

    const sourceDescription = (sourceEntity as any).description || (sourceEntity as any).continuity_notes || "";

    if (targetType === "Character") {
      newEntity = await prisma.productionCharacter.create({
        data: {
          project_id: projectId,
          script_id: sourceEntity.script_id,
          name: sourceEntity.name,
          description: sourceDescription,
          importance: "Supporting",
          metadata: metadata
        }
      });
    } else if (targetType === "Location") {
      newEntity = await prisma.productionLocation.create({
        data: {
          project_id: projectId,
          script_id: sourceEntity.script_id,
          name: sourceEntity.name,
          description: sourceDescription,
          type: "INT",
          time_of_day: "DAY",
          metadata: metadata
        }
      });
    } else if (targetType === "Prop") {
      newEntity = await prisma.productionProp.create({
        data: {
          project_id: projectId,
          script_id: sourceEntity.script_id,
          name: sourceEntity.name,
          category: "Set Dressing",
          continuity_notes: sourceDescription,
          is_hero: false,
          // Prop does not have metadata in Prisma schema, stringify into continuity notes for now
          // or just omit it to prevent Prisma crash
        }
      });
    }

    revalidatePath(`/projects/${projectId}/breakdown`);
    revalidatePath(`/projects/${projectId}/characters`);
    revalidatePath(`/projects/${projectId}/locations`);
    revalidatePath(`/projects/${projectId}/props`);

    return NextResponse.json({ success: true, entity: newEntity });
  } catch (error: any) {
    console.error("[BreakdownConvert] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
