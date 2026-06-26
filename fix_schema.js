const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Phase 5 Company
if (!content.includes('production_provider_credentials')) {
  content = content.replace('  margin_forecast     TenantMarginForecast?\n}', '  margin_forecast     TenantMarginForecast?\n  production_provider_credentials ProductionProviderCredential[]\n}');
}

// Phase 5 Provider
if (!content.includes('credentials     ProductionProviderCredential[]')) {
  content = content.replace('  jobs            ProductionAIJob[]\n}', '  jobs            ProductionAIJob[]\n  credentials     ProductionProviderCredential[]\n}');
}

const phase5Models = `model ProductionProviderCredential {
  id              String   @id @default(uuid())
  company_id      String
  provider_id     String
  api_key_encrypted String
  status          String   @default("Offline")
  last_tested_at  DateTime?
  last_used_at    DateTime?
  default_models  Json?
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  company         Company  @relation(fields: [company_id], references: [id], onDelete: Cascade)
  provider        ProductionAIProvider @relation(fields: [provider_id], references: [id], onDelete: Cascade)
  
  @@unique([company_id, provider_id])
}`;

if (!content.includes('model ProductionProviderCredential')) {
  content += '\n' + phase5Models + '\n';
}


// Phase 7 User
if (!content.includes('assistant_threads    ProductionAssistantThread[]')) {
  content = content.replace('  client_portal_settings ClientPortalSetting[]\n}', '  client_portal_settings ClientPortalSetting[]\n  assistant_threads    ProductionAssistantThread[]\n}');
}

// Phase 7 Project
if (!content.includes('assistant_threads ProductionAssistantThread[]')) {
  content = content.replace('  assets          ProductionAsset[]\n}', '  assets          ProductionAsset[]\n  assistant_threads ProductionAssistantThread[]\n}');
}

const phase7Models = `model ProductionAssistantThread {
  id              String   @id @default(uuid())
  project_id      String
  user_id         String
  title           String?
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  project         Project  @relation(fields: [project_id], references: [id], onDelete: Cascade)
  user            User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  messages        ProductionAssistantMessage[]
}

model ProductionAssistantMessage {
  id              String   @id @default(uuid())
  thread_id       String
  role            String   // "user" or "assistant"
  content         String
  created_at      DateTime @default(now())

  thread          ProductionAssistantThread @relation(fields: [thread_id], references: [id], onDelete: Cascade)
}`;

if (!content.includes('model ProductionAssistantThread')) {
  content += '\n' + phase7Models + '\n';
}

fs.writeFileSync('prisma/schema.prisma', content);
console.log('Restored and updated schema!');
