import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ProviderManager } from "@/lib/production/providers/ProviderManager";

export async function POST(req: Request) {
  try {
    const { apiKey } = await req.json();

    let provider = await prisma.productionAIProvider.findFirst({
      where: { name: 'OpenAI' }
    });

    if (!provider) {
       return NextResponse.json({ error: "No OpenAI provider" }, { status: 400 });
    }

    await ProviderManager.saveCredentials(provider.id, apiKey);

    return NextResponse.json({ success: true, message: "Saved key via Next.js" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
