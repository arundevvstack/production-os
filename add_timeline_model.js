const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

const newModel = `
model ProductionTimelineEvent {
  id              String   @id @default(uuid())
  project_id      String
  user_id         String
  entity_type     String   // "Scene", "Shot", "Asset", "Memory", "Project"
  entity_id       String
  action          String   // "CREATED", "UPDATED", "APPROVED", "GENERATED"
  metadata        Json?
  created_at      DateTime @default(now())

  project         Project  @relation(fields: [project_id], references: [id], onDelete: Cascade)
  user            User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
}
`;

if (!content.includes('model ProductionTimelineEvent {')) {
  content += newModel;
}

// Inject relations into User
content = content.replace(/model User \{[\s\S]*?\}/, match => {
  if (match.includes('timeline_events')) return match;
  return match.replace(/\}/, '  timeline_events ProductionTimelineEvent[]\n}');
});

// Inject relations into Project
content = content.replace(/model Project \{[\s\S]*?\}/, match => {
  if (match.includes('timeline_events')) return match;
  return match.replace(/\}/, '  timeline_events ProductionTimelineEvent[]\n}');
});

fs.writeFileSync('prisma/schema.prisma', content);
console.log('Timeline Event model added!');
