import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  // --- SAAS TENANT ISOLATION (PHASE 5) ---
  // If the user tries to access /api/v1/* resources, we can validate that the 
  // company_id injected into the JWT matches the expected tenant, or simply inject
  // the company_id into the request headers for the downstream API to consume.
  
  if (user && request.nextUrl.pathname.startsWith('/api/v1/')) {
     const companyId = user.user_metadata?.company_id;
     if (companyId) {
       // Phase 8.4: Autonomous Platform Governance (QUARANTINE_TENANT)
       // Check if the tenant has been temporarily quarantined due to API abuse / error budget drops
       const isQuarantined = user.user_metadata?.is_quarantined;
       if (isQuarantined) {
           return new NextResponse(
             JSON.stringify({ error: 'Tenant Quarantined: Error budget depleted or abuse detected. Contact support.' }),
             { status: 429, headers: { 'content-type': 'application/json' } }
           );
       }
       // request.headers.set('x-tenant-id', companyId);
     }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes that don't need auth
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
