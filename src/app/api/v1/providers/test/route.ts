import { NextResponse } from "next/server";
import { ProviderManager } from "@/lib/production/providers/ProviderManager";

export async function POST(request: Request) {
  try {
    const { companyId, providerId, apiKey } = await request.json();

    if (!companyId || !providerId || !apiKey) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Attempt a simple connection test using the provided API key
    // For OpenRouter, we can just hit the /models endpoint
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: "Failed to authenticate with provider", details: errorText }, { status: response.status });
    }

    return NextResponse.json({ success: true, message: "Connection successful" });

  } catch (error: any) {
    console.error("Provider connection test error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
