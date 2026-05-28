import { PrismaClient } from '@prisma/client';
import { createTestTenant, teardownTestTenant } from './utils';

const prisma = new PrismaClient();

async function runConcurrencyTest() {
  console.log('\\n==========================================');
  console.log('⚡ RUNNING DATABASE CONCURRENCY VALIDATION');
  console.log('==========================================\\n');

  console.log('📦 Provisioning Test Tenant C for DB Load...');
  const tenantC = await createTestTenant('Tenant C Corp');

  let passed = true;

  try {
    const BATCH_SIZE = 50; // 50 simultaneous budget increments
    console.log(`🚀 Launching ${BATCH_SIZE} concurrent budget update transactions...`);

    // We simulate 50 background workers trying to deduct budget or increment used budget simultaneously
    const promises = Array.from({ length: BATCH_SIZE }).map(async (_, i) => {
      // Small random delay to simulate network jitter
      await new Promise(res => setTimeout(res, Math.random() * 50));
      
      // Attempt to increment total_requests safely using Prisma atomic increment
      return prisma.tenantSlaMetrics.update({
        where: { company_id: tenantC.company.id },
        data: {
          total_requests: {
            increment: 1
          }
        }
      });
    });

    await Promise.all(promises);

    console.log('🔍 Validating atomic results...');
    
    const finalMetrics = await prisma.tenantSlaMetrics.findUnique({
      where: { company_id: tenantC.company.id }
    });

    if (finalMetrics?.total_requests !== BATCH_SIZE) {
      console.error(`❌ FAILED: Expected total_requests to be ${BATCH_SIZE}, but got ${finalMetrics?.total_requests}`);
      passed = false;
    } else {
      console.log(`✅ PASS: Atomic transactions held up perfectly. Metrics exactly match: ${BATCH_SIZE}`);
    }

  } catch (err: any) {
    console.error('❌ ERROR during concurrency test:', err.message);
    passed = false;
  } finally {
    console.log('\\n🧹 Tearing down test data...');
    await teardownTestTenant(tenantC.company.id, tenantC.user.id);
  }

  if (passed) {
    console.log('\\n✅ ALL CONCURRENCY CHECKS PASSED.\\n');
  } else {
    console.log('\\n❌ CONCURRENCY CHECKS FAILED.\\n');
    process.exit(1);
  }
}

runConcurrencyTest().catch(e => {
  console.error(e);
  process.exit(1);
});
