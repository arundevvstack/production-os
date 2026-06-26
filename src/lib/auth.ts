import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function getCompanyId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { company_id: true }
    });
    
    return profile?.company_id ?? null;
  } catch (err) {
    console.error("Error fetching company ID:", err);
    return null;
  }
}
