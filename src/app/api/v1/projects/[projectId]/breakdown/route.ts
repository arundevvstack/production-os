import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const script = await prisma.productionScript.findUnique({ where: { project_id: projectId } });
  if (!script) return NextResponse.json({ characters: [], locations: [], props: [], vehicles: [], costumes: [] });
  const [characters, locations, props, vehicles, animals, vfxs, audios, costumes, makeups, lightings, cameras, continuities] = await Promise.all([
    prisma.productionCharacter.findMany({ where: { project_id: projectId }, orderBy: { created_at: "asc" } }),
    prisma.productionLocation.findMany({ where: { project_id: projectId }, orderBy: { created_at: "asc" } }),
    prisma.productionProp.findMany({ where: { project_id: projectId }, orderBy: { created_at: "asc" } }),
    prisma.productionVehicle.findMany({ where: { project_id: projectId }, orderBy: { created_at: "asc" } }),
    prisma.productionAnimal.findMany({ where: { project_id: projectId }, orderBy: { created_at: "asc" } }),
    prisma.productionVFX.findMany({ where: { project_id: projectId }, orderBy: { created_at: "asc" } }),
    prisma.productionAudio.findMany({ where: { project_id: projectId }, orderBy: { created_at: "asc" } }),
    prisma.productionCostume.findMany({ where: { project_id: projectId }, orderBy: { created_at: "asc" } }),
    prisma.productionMakeup.findMany({ where: { project_id: projectId }, orderBy: { created_at: "asc" } }),
    prisma.productionLighting.findMany({ where: { project_id: projectId }, orderBy: { created_at: "asc" } }),
    prisma.productionCameraPlan.findMany({ where: { project_id: projectId }, orderBy: { created_at: "asc" } }),
    prisma.productionContinuity.findMany({ where: { project_id: projectId }, orderBy: { created_at: "asc" } }),
  ]);
  const parseMeta = (str: string | null) => {
    if (!str) return undefined;
    try { return JSON.parse(str); } catch { return undefined; }
  };

  const parsedProps = props.map((p: any) => ({ ...p, metadata: parseMeta(p.continuity_notes) }));
  const parsedVehicles = vehicles.map((v: any) => ({ ...v, metadata: parseMeta(v.description) }));
  const parsedAnimals = animals.map((a: any) => ({ ...a, metadata: parseMeta(a.description) }));
  const parsedVFXs = vfxs.map((v: any) => ({ ...v, metadata: parseMeta(v.particles) }));
  const parsedAudios = audios.map((a: any) => ({ ...a, metadata: parseMeta(a.ambience) }));
  const parsedCostumes = costumes.map((c: any) => ({ ...c, metadata: parseMeta(c.notes) }));
  const parsedMakeups = makeups.map((m: any) => ({ ...m, metadata: parseMeta(m.dirt) }));
  const parsedLightings = lightings.map((l: any) => ({ ...l, metadata: parseMeta(l.color_temp) }));
  const parsedCameras = cameras.map((c: any) => ({ ...c, metadata: parseMeta(c.framing) }));
  const parsedContinuities = continuities.map((c: any) => ({ ...c, metadata: parseMeta(c.notes) }));

  return NextResponse.json({ 
    characters, locations, 
    props: parsedProps, 
    vehicles: parsedVehicles, 
    animals: parsedAnimals, 
    vfxs: parsedVFXs, 
    audios: parsedAudios, 
    costumes: parsedCostumes, 
    makeups: parsedMakeups, 
    lightings: parsedLightings, 
    cameras: parsedCameras, 
    continuities: parsedContinuities, 
    scriptId: script.id 
  });
}
