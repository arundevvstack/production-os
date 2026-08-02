import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Shared helper: ensures one ProductionScript record exists for the project.
// NEVER calls create() directly — uses upsert to respect the @unique constraint.
async function ensureScript(projectId: string) {
  return prisma.productionScript.upsert({
    where: { project_id: projectId },
    create: {
      id: require("crypto").randomUUID(),
      project_id: projectId,
      content: "",
      updated_at: new Date()
    },
    update: {}
  });
}

export async function GET(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const vb = await prisma.productionVisualBible.findUnique({
    where: { project_id: projectId },
    include: { Versions: { orderBy: { version_number: "desc" }, take: 1 } }
  });
  if (!vb || vb.Versions.length === 0) return NextResponse.json(null);
  const latest = vb.Versions[0];
  return NextResponse.json({ id: vb.id, content: latest.style_bible, updatedAt: vb.updated_at });
}

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const body = await req.json();

  const script = await ensureScript(projectId);

  let vb = await prisma.productionVisualBible.findUnique({ where: { project_id: projectId } });
  if (!vb) {
    vb = await prisma.productionVisualBible.create({
      data: { project_id: projectId, script_id: script.id, updated_at: new Date() }
    });
  } else {
    await prisma.productionVisualBible.update({ where: { id: vb.id }, data: { updated_at: new Date() } });
  }

  const count = await prisma.productionVisualBibleVersion.count({ where: { visual_bible_id: vb.id } });
  const version = await prisma.productionVisualBibleVersion.create({
    data: {
      visual_bible_id: vb.id,
      version_number: count + 1,
      style_bible: body.content || {}
    }
  });
  return NextResponse.json({ id: vb.id, content: version.style_bible, version: version.version_number });
}
