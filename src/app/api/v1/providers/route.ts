import { NextResponse } from "next/server";
import { ProviderManager } from "@/lib/production/providers/ProviderManager";

export async function GET() {
  try {
    const statuses = await ProviderManager.getProviderStatuses();
    return NextResponse.json(statuses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
