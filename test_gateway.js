require('dotenv').config();

async function checkHealth() {
  const gatewayUrl = process.env.LOCAL_AI_GATEWAY_URL;
  const proxyUrl = process.env.LOCAL_AI_URL;
  console.log(`Gateway URL: ${gatewayUrl}`);
  console.log(`Proxy URL: ${proxyUrl}`);
  
  if (!gatewayUrl) {
    console.log("Root Cause: LOCAL_AI_GATEWAY_URL missing in .env");
    return;
  }
  
  const healthUrl = `${gatewayUrl}/health`;
  console.log(`Health URL: ${healthUrl}`);
  
  const startTime = Date.now();
  try {
    const res = await fetch(healthUrl, { signal: AbortSignal.timeout(5000) });
    const latency = Date.now() - startTime;
    console.log(`HTTP status: ${res.status}`);
    console.log(`Latency: ${latency}ms`);
    
    // Auth test (mock)
    console.log(`Authentication result: Pending actual request verification`);
    
  } catch (e) {
    console.log(`Root Cause: ${e.message}`);
    if (e.cause) {
      console.log(`Connection error: ${e.cause.message}`);
    }
  }
}

checkHealth();
