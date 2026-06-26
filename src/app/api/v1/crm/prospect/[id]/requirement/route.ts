import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!profile || !profile.company_id) {
      return NextResponse.json({ error: 'Forbidden: Tenant company association missing.' }, { status: 403 });
    }
    const { id } = await params;

    let requirement = await prisma.requirementChart.findFirst({
      where: { prospect_id: id, company_id: profile.company_id },
      include: { versions: { orderBy: { created_at: 'desc' }, take: 10 } }
    });

    if (!requirement) {
      const prospect = await prisma.prospect.findUnique({
        where: { id: id },
        include: { client: true }
      });

      const clientDetails = {
        company_name: prospect?.company_name || prospect?.client?.name || "",
        contact_person: prospect?.contact_person || prospect?.client?.contact_person || "",
        email: prospect?.email || prospect?.client?.email || "",
        phone: prospect?.phone || prospect?.client?.phone || "",
        whatsapp: prospect?.whatsapp || "",
        industry: prospect?.industry || prospect?.client?.industry || "",
        billing_address: prospect?.client?.billing_address || "",
        gst_number: prospect?.client?.gstin || "",
        priority: prospect?.priority || "Medium",
        closing_date: prospect?.next_follow_up ? prospect.next_follow_up.toISOString().split('T')[0] : ""
      };

      const projectDetails = {
        project_category: prospect?.project_category || "",
        project_type: prospect?.service_vertical || prospect?.sub_vertical || "",
        budget: prospect?.deal_value?.toString() || ""
      };

      requirement = await prisma.requirementChart.create({
        data: {
          company_id: profile.company_id,
          prospect_id: id,
          status: "draft",
          client_details: clientDetails as any,
          project_details: projectDetails as any,
          objective: "",
          deliverables: [],
          creative_requirements: {},
          technical_specs: {},
          production_requirements: {},
          assets: {},
          timeline: {},
          notes: prospect?.notes || "",
          scope_of_work: "",
          deliverables_summary: "",
          completeness_score: 0
        },
        include: { versions: true }
      });
      // Set Prospect to in_progress if it was not started
      await prisma.prospect.update({
        where: { id: id },
        data: { requirement_status: 'in_progress' }
      });
    }

    return NextResponse.json({ requirement });
  } catch (error: any) {
    console.error("Requirement GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!profile || !profile.company_id) {
      return NextResponse.json({ error: 'Forbidden: Tenant company association missing.' }, { status: 403 });
    }
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.requirementChart.findFirst({
      where: { prospect_id: id, company_id: profile.company_id }
    });

    if (!existing) return NextResponse.json({ error: "Requirement not found" }, { status: 404 });

    const updated = await prisma.requirementChart.update({
      where: { id: existing.id },
      data: {
        client_details: body.client_details,
        project_details: body.project_details,
        objective: body.objective,
        deliverables: body.deliverables,
        creative_requirements: body.creative_requirements,
        technical_specs: body.technical_specs,
        production_requirements: body.production_requirements,
        assets: body.assets,
        timeline: body.timeline,
        notes: body.notes,
        scope_of_work: body.scope_of_work,
        deliverables_summary: body.deliverables_summary,
        status: body.completeness_score >= 80 ? 'approved' : 'draft',
        completeness_score: body.completeness_score
      }
    });
    
    // Sync Prospect requirement status
    const newStatus = body.completeness_score >= 80 ? 'completed' : 'in_progress';
    await prisma.prospect.update({
      where: { id: id },
      data: { requirement_status: newStatus }
    });

    if (body.create_version) {
      await prisma.requirementVersion.create({
        data: {
          requirement_chart_id: updated.id,
          version_number: (await prisma.requirementVersion.count({ where: { requirement_chart_id: updated.id } })) + 1,
          changed_by: user.id,
          changed_fields: body.changed_fields || [],
          reason: body.version_reason || "Auto-saved revision",
          data_snapshot: updated as any
        }
      });
    }

    return NextResponse.json({ requirement: updated });
  } catch (error: any) {
    console.error("Requirement POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
