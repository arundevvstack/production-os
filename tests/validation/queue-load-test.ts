import { createTestTenant, teardownTestTenant } from './utils';

async function runQueueLoadTest() {
  console.log('\\n==========================================');
  console.log('🚀 RUNNING QUEUE RESILIENCE & LOAD VALIDATION');
  console.log('==========================================\\n');

  console.log('📦 Provisioning Test Tenant D for Queue Spam...');
  const tenantD = await createTestTenant('Tenant D LoadTesting');

  let passed = true;

  try {
    const REQUESTS = 100; // Simulated webhook blasts
    console.log(`🌪️  Blasting queue with ${REQUESTS} concurrent webhook events...`);

    const promises = Array.from({ length: REQUESTS }).map(async (_, i) => {
      // Small random delay
      await new Promise(res => setTimeout(res, Math.random() * 100));
      
      try {
        const res = await fetch('http://localhost:9003/api/v1/queue/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer dev-secret'
          },
          body: JSON.stringify({
            tenantId: tenantD.company.id,
            eventType: 'AI_RENDER_REQUEST',
            payload: { test_index: i }
          })
        });
        
        if (!res.ok) {
          throw new Error(`Queue rejected request: ${res.status}`);
        }
        return true;
      } catch (err: any) {
        console.error(`Request ${i} failed: ${err.message}`);
        return false;
      }
    });

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r).length;

    console.log(`\n📊 Queue Results: ${successCount} / ${REQUESTS} accepted.`);

    if (successCount !== REQUESTS) {
      console.error(`❌ FAILED: Queue dropped ${REQUESTS - successCount} requests under load.`);
      passed = false;
    } else {
      console.log('✅ PASS: Queue handled concurrency spike flawlessly.');
    }

  } catch (err: any) {
    console.error('❌ ERROR during queue load test:', err.message);
    passed = false;
  } finally {
    console.log('\\n🧹 Tearing down test data...');
    await teardownTestTenant(tenantD.company.id, tenantD.user.id);
  }

  if (passed) {
    console.log('\\n✅ ALL QUEUE CHECKS PASSED.\\n');
  } else {
    console.log('\\n❌ QUEUE CHECKS FAILED.\\n');
    process.exit(1);
  }
}

runQueueLoadTest().catch(e => {
  console.error(e);
  process.exit(1);
});
