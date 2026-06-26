import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ProviderManager } from "@/lib/production/providers/ProviderManager";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = "c-1"; 

    // Find the provider name
    const provider = await prisma.productionAIProvider.findUnique({
      where: { id: params.id }
    });
    if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

    // Try to get credentials
    const apiKey = await ProviderManager.getDecryptedCredentials(companyId, provider.id);
    
    // Test them
    const isValid = await ProviderManager.testCredentials(provider.name, apiKey);

    // Update status
    const status = isValid ? "Online" : "Invalid";
    await prisma.productionProviderCredential.update({
      where: {
        company_id_provider_id: {
          company_id: companyId,
          provider_id: provider.id
        }
      },
      data: {
        status,
        last_tested_at: new Date()
      }
    });

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    // If getting decrypted credentials fails or any other error
    await prisma.productionProviderCredential.updateMany({
      where: { company_id: "c-1", provider_id: params.id },
      data: { status: "Offline", last_tested_at: new Date() }
    });
    return NextResponse.json({ error: error.message, status: "Offline" }, { status: 200 });
  }
}
