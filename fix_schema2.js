const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Ensure we have User relation
if (!content.includes('assistant_threads    ProductionAssistantThread[]')) {
  content = content.replace(/model User \{[\s\S]*?\}/, match => {
    return match.replace(/\}/, '  assistant_threads    ProductionAssistantThread[]\n}');
  });
}

// Ensure we have Project relation
if (!content.includes('assistant_threads ProductionAssistantThread[]')) {
  content = content.replace(/model Project \{[\s\S]*?\}/, match => {
    return match.replace(/\}/, '  assistant_threads ProductionAssistantThread[]\n}');
  });
}

// Ensure ProductionAssistantThread exists
const phase7Models = `
model ProductionAssistantThread {
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
}
`;

if (!content.includes('model ProductionAssistantThread')) {
  content += phase7Models;
}

fs.writeFileSync('prisma/schema.prisma', content);
console.log('Fixed relations via regex');
