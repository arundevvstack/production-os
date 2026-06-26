import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ProviderManager } from "@/lib/production/providers/ProviderManager";

export async function GET(req: Request) {
  try {
    // In a real app, this comes from auth session
    const companyId = "c-1"; 

    const providers = await prisma.productionAIProvider.findMany({
      include: {
        credentials: {
          where: { company_id: companyId }
        }
      }
    });

    const formatted = providers.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      is_enabled: p.is_enabled,
      status: p.credentials[0]?.status || "Unconfigured",
      last_tested_at: p.credentials[0]?.last_tested_at || null,
      is_configured: !!p.credentials[0]
    }));

    return NextResponse.json({ data: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { provider_id, api_key } = body;
    const companyId = "c-1"; 

    if (!provider_id || !api_key) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await ProviderManager.saveCredentials(companyId, provider_id, api_key);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
