import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/v1/projects/[projectId]/visual-bible/latest
// Returns the full latest Visual Bible version (all bibles) for prompt enrichment
export async function GET(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  const vb = await prisma.productionVisualBible.findUnique({
    where: { project_id: projectId },
    include: {
      Versions: {
        orderBy: { version_number: "desc" },
        take: 1
      }
    }
  });

  if (!vb || vb.Versions.length === 0) {
    return NextResponse.json(null);
  }

  const latest = vb.Versions[0];

  // Return all bible sections for full context enrichment
  return NextResponse.json({
    id: latest.id,
    visual_bible_id: vb.id,
    version_number: latest.version_number,
    status: latest.status,
    style_bible: latest.style_bible,
    character_bible: latest.character_bible,
    location_bible: latest.location_bible,
    prop_bible: latest.prop_bible,
    costume_bible: latest.costume_bible,
    cinematography_bible: latest.cinematography_bible,
    lighting_bible: latest.lighting_bible,
    art_direction_bible: latest.art_direction_bible,
    audio_bible: latest.audio_bible,
    vfx_bible: latest.vfx_bible,
    created_at: latest.created_at
  });
}
