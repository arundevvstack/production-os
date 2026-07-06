import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ProviderManager } from "@/lib/production/providers/ProviderManager";

export async function POST(req: Request, { params }: { params: any }) {
  try {
    const { projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        ProductionScript: {
          include: {
            Characters: true,
            Locations: true,
            Props: true,
          }
        },
        ProductionVisualBible: {
          include: {
            Versions: {
              orderBy: { version_number: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!project || !project.ProductionScript) {
      return NextResponse.json({ error: "No script found." }, { status: 404 });
    }

    const script = project.ProductionScript;
    const visualBible = project.ProductionVisualBible?.Versions?.[0];

    if (!visualBible) {
      return NextResponse.json({ error: "Visual Bible must be generated and approved before Storyboarding." }, { status: 400 });
    }

    const breakdown = {
      characters: script.Characters,
      locations: script.Locations,
      props: script.Props
    };

    // Note: In reality, we'd filter by approvedItems. 
    // Here we assume anything in the DB is approved for this workflow generation.

    const prompt = `
      You are an expert Storyboard Artist and Director of Photography.
      Generate a highly detailed storyboard breakdown for a film project.
      
      Script Content:
      ${script.content}
      
      Approved Visual Bible:
      ${JSON.stringify(visualBible, null, 2)}
      
      Approved Elements (Characters, Locations, Props):
      ${JSON.stringify(breakdown, null, 2)}
      
      Return a JSON array of scenes. Each scene MUST have:
      - scene_number (int)
      - title (string)
      - scene_summary (string)
      - visual_description (string) - CRITICAL: This field MUST ALWAYS be in English regardless of the script language, as it is used directly as an image generation prompt.
      - environment_description (string)
      - character_placement (string)
      - camera_angle (string)
      - camera_movement (string)
      - lens_suggestion (string)
      - lighting_plan (string)
      - mood (string)
      - color_palette (string)
      - ai_confidence (int 0-100)
    `;

    let provider = await prisma.productionAIProvider.findFirst({ where: { name: "Google GenAI" } });
    if (!provider) {
        throw new Error("Google GenAI provider not configured in system.");
    }

    const apiKey = await ProviderManager.getDecryptedCredentials(provider.id);
    const adapter = ProviderManager.getAdapter(provider.name);

    const systemPrompt = "You return strictly valid JSON arrays of objects. No markdown formatting or code blocks outside the JSON.";

    const response = await adapter.submitJob(apiKey, "gemini-2.5-flash", systemPrompt + "\n\n" + prompt);

    if (!response.textContent) throw new Error("No response received from AI");

    let scenesData = [];
    try {
      scenesData = JSON.parse(response.textContent.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim());
    } catch (e) {
      console.error("Failed to parse storyboard JSON", e, response.textContent);
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
    }

    // Wrap in transaction
    const storyboard = await prisma.$transaction(async (tx) => {
      // Create Storyboard root
      const sb = await tx.productionStoryboard.upsert({
        where: { project_id: projectId },
        create: {
          project_id: projectId,
          script_id: script.id
        },
        update: {}
      });

      // Save a new storyboard version
      await tx.productionStoryboardVersion.create({
        data: {
          storyboard_id: sb.id,
          content: scenesData,
          status: "Draft",
          version_number: 1
        }
      });

      return sb;
    });

    return NextResponse.json({ success: true, storyboard });

  } catch (error: any) {
    console.error("Storyboard Gen Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
