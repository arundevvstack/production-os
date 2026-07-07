import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const script = await prisma.productionScript.findUnique({ where: { project_id: projectId } });
  if (!script) return NextResponse.json({ characters: [], locations: [], props: [], vehicles: [], costumes: [] });
  const [characters, locations, props, vehicles] = await Promise.all([
    prisma.productionCharacter.findMany({ where: { project_id: projectId }, orderBy: { created_at: "asc" } }),
    prisma.productionLocation.findMany({ where: { project_id: projectId }, orderBy: { created_at: "asc" } }),
    prisma.productionProp.findMany({ where: { project_id: projectId }, orderBy: { created_at: "asc" } }),
    prisma.productionVehicle.findMany({ where: { project_id: projectId }, orderBy: { created_at: "asc" } }),
  ]);
  return NextResponse.json({ characters, locations, props, vehicles, scriptId: script.id });
}
