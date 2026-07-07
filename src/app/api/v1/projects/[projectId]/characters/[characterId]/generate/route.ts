import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ProviderManager } from "@/lib/production/providers/ProviderManager";

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string, characterId: string }> }) {
  try {
    const { projectId, characterId } = await params;
    const character = await prisma.productionCharacter.findUnique({ where: { id: characterId } });
    if (!character) return NextResponse.json({ error: "Character not found" }, { status: 404 });

    const prompt = `Character reference sheet for ${character.name}. ${character.age ? character.age + " years old." : ""} ${character.gender ? character.gender + "." : ""} ${character.description || ""} ${character.first_appearance ? "Appearance: " + character.first_appearance + "." : ""} ${character.last_appearance ? "Costume: " + character.last_appearance + "." : ""} Photorealistic, highly detailed, cinematic lighting, multiple angles.`;

    let assetUrl = `https://picsum.photos/seed/${character.id}-${Date.now()}/512/512`;

    // Try to use a real provider if configured
    try {
      const provider = await prisma.productionAIProvider.findFirst({ where: { is_enabled: true, supported_asset_types: { has: "Image" } } });
      if (provider) {
        const apiKey = await ProviderManager.getDecryptedCredentials(provider.id);
        const adapter = ProviderManager.getAdapter(provider.name);
        const response = await adapter.generateImage(apiKey, provider.supported_models[0] || "dall-e-3", prompt);
        if (response.assetUrl) {
           assetUrl = response.assetUrl;
        }
      }
    } catch (e) {
      console.warn("AI Image Gen failed, using mock placeholder", e);
    }

    const updated = await prisma.productionCharacter.update({
      where: { id: characterId },
      data: { reference_image_url: assetUrl }
    });

    return NextResponse.json({ success: true, character: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
