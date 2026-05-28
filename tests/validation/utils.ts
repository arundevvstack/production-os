import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export async function createTestTenant(name: string) {
  const company = await prisma.company.create({
    data: {
      name,
      sla_metrics: {
        create: {
          total_requests: 0,
          failed_requests: 0,
          avg_latency_ms: 0,
          uptime_pct: 100.0,
          error_budget_pct: 100.0
        }
      }
    }
  });

  const user = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: `${uuidv4()}@test.com`,
      fullName: `Test User ${name}`,
      role_id: 'ADMIN',
      company_id: company.id
    }
  });

  return { company, user };
}

export async function teardownTestTenant(companyId: string, userId: string) {
  // Delete related data first
  await prisma.project.deleteMany({ where: { company_id: companyId }});
  
  await prisma.user.delete({ where: { id: userId }});
  await prisma.company.delete({ where: { id: companyId }});
}
