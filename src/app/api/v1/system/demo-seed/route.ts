import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * PHASE 6: Executive Demo & War Room Seeder
 * Instantly spins up a massive mock enterprise workspace for investor presentations.
 * (This is deliberately unprotected/mock-auth for the hackathon/demo environment)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { company_id } = body;

    if (!company_id) {
        return NextResponse.json({ error: 'company_id required to run demo seeder' }, { status: 400 });
    }

    console.log(`[Demo Seeder] Initiating Enterprise Demo Sandbox for Tenant: ${company_id}`);

    // 1. Seed Fake Telemetry (to populate the Digital Twin)
    const metricTypes = ['RENDER_LATENCY', 'APPROVAL_DELAY', 'TEAM_EFFICIENCY', 'AI_PROVIDER_FAILOVER'];
    
    for (let i = 0; i < 50; i++) {
        await prisma.operationalTelemetry.create({
            data: {
                company_id,
                metric_type: metricTypes[Math.floor(Math.random() * metricTypes.length)],
                metric_value: Math.random() * 100,
                timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
        });
    }

    // 2. Seed Fake Infrastructure Incidents
    await prisma.infrastructureIncident.create({
        data: {
            component: 'AI_PROVIDER_OPENAI',
            error_message: 'Simulated Upstream Timeout',
            severity: 'HIGH',
            resolved: false
        }
    });

    // 3. Seed Fake Projects (At-Risk vs Healthy)
    const healthyProject = await prisma.project.create({
        data: {
            company_id,
            project_name: 'Q4 Global Launch Campaign',
            description: 'Massive rollout for the new product line.',
            project_type: 'Hybrid Production',
            status: 'active'
        }
    });

    const atRiskProject = await prisma.project.create({
        data: {
            company_id,
            project_name: 'Summer AI Lookbook',
            description: 'AI-generated fashion assets.',
            project_type: 'AI Production',
            status: 'active'
        }
    });

    // 4. Seed Health Scores
    await prisma.projectHealthScore.create({
        data: {
            project_id: healthyProject.id,
            delivery_confidence: 94.5, // Healthy
            burn_rate_status: 'NOMINAL',
            ai_recommendations: {}
        }
    });

    await prisma.projectHealthScore.create({
        data: {
            project_id: atRiskProject.id,
            delivery_confidence: 62.1, // At Risk
            burn_rate_status: 'CRITICAL',
            ai_recommendations: {
                warning: 'High workflow bottlenecks detected.',
                action: 'Re-assign assets to freelance editors.'
            }
        }
    });

    return NextResponse.json({ 
        success: true, 
        message: 'Enterprise Sandbox Seeded Successfully. Digital Twin is now live.' 
    });

  } catch (error: any) {
    console.error("Demo Seeder Error:", error);
    return NextResponse.json({ error: error.message || "Failed to seed demo" }, { status: 500 });
  }
}
