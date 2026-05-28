import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all verified plugins from the global marketplace
    const plugins = await prisma.marketplacePlugin.findMany({
        where: { is_verified: true },
        orderBy: { name: 'asc' }
    });

    return NextResponse.json({ success: true, data: plugins });
  } catch (error: any) {
    console.error("Marketplace Fetch Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch plugins" }, { status: 500 });
  }
}

export async function POST(req: Request) {
    try {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
  
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
  
      const dbUser = await prisma.user.findUnique({ where: { id: user.id }});
  
      if (dbUser?.role_id !== 'SUPER_ADMIN' && dbUser?.role_id !== 'ADMIN') {
          return NextResponse.json({ error: 'Forbidden. Admin access required to install plugins.' }, { status: 403 });
      }
  
      if (!dbUser.company_id) {
          return NextResponse.json({ error: 'Tenant context missing.' }, { status: 400 });
      }
  
      const body = await req.json();
      const { plugin_id, config_json } = body;
  
      if (!plugin_id) {
        return NextResponse.json({ error: 'Missing plugin_id' }, { status: 400 });
      }
  
      const installation = await prisma.companyPluginInstallation.create({
        data: {
          company_id: dbUser.company_id,
          plugin_id,
          config_json: config_json || {}
        }
      });
  
      return NextResponse.json({ success: true, data: installation });
  
    } catch (error: any) {
      console.error("Plugin Installation Error:", error);
      return NextResponse.json({ error: error.message || "Failed to install plugin" }, { status: 500 });
    }
}
