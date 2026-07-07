import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const script = await prisma.productionScript.findUnique({ where: { project_id: projectId } });
    
    if (!script || !script.content) {
      return NextResponse.json({ error: "Script not found or empty" }, { status: 404 });
    }

    const lines = script.content.split("\n");
    const extractedCharacters = new Set<string>();
    const extractedLocations = new Set<string>();
    
    lines.forEach((line) => {
      const trimmed = line.trim();
      
      // Extract Scene Headings (Locations and Time of Day)
      if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/i.test(trimmed)) {
        const parts = trimmed.split("-");
        let location = parts[0].replace(/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/i, "").trim();
        if (location) {
          extractedLocations.add(location);
        }
      }
      
      // Extract Characters
      if (
        /^[A-Z0-9 ]+$/.test(trimmed) && 
        trimmed.length > 1 && 
        !/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/i.test(trimmed) &&
        !/^(FADE IN|FADE OUT|CUT TO:|DISSOLVE TO:|TRANSITION)/i.test(trimmed)
      ) {
         if (trimmed !== "DAY" && trimmed !== "NIGHT") {
           extractedCharacters.add(trimmed);
         }
      }
    });

    const existingChars = await prisma.productionCharacter.findMany({ where: { project_id: projectId } });
    const existingCharNames = new Set(existingChars.map(c => c.name.toUpperCase()));

    for (const charName of extractedCharacters) {
      if (!existingCharNames.has(charName)) {
        await prisma.productionCharacter.create({
          data: {
            id: crypto.randomUUID(),
            project_id: projectId,
            script_id: script.id,
            name: charName
          }
        });
      }
    }

    const existingLocs = await prisma.productionLocation.findMany({ where: { project_id: projectId } });
    const existingLocNames = new Set(existingLocs.map(l => l.name.toUpperCase()));

    for (const locName of extractedLocations) {
      if (!existingLocNames.has(locName.toUpperCase())) {
        await prisma.productionLocation.create({
          data: {
            id: crypto.randomUUID(),
            project_id: projectId,
            script_id: script.id,
            name: locName
          }
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      parsed: { characters: Array.from(extractedCharacters), locations: Array.from(extractedLocations) } 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
