import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function ClientPortalLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/client/login');
  }

  // Fetch client portal settings to apply white-labeling
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { company_id: true, role_id: true }
  });

  if (dbUser?.role_id !== 'CLIENT') {
     // Optional: Redirect them back to main dashboard if they aren't a client
     // redirect('/dashboard');
  }

  // In a full implementation, you would fetch `ClientPortalSetting` here 
  // and inject CSS variables (e.g., brand_color) into the DOM.

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-muted w-full overflow-hidden">
        {/* Client Sidebar Component would go here */}
        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
