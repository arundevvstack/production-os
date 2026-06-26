const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Match the end of User model and append
content = content.replace(/model User \{[\s\S]*?\}/, match => {
  if (match.includes('creative_memories')) return match;
  return match.replace(/\}/, '  creative_memories ProductionCreativeMemory[]\n}');
});

// Match the end of ProductionShot model and append
content = content.replace(/model ProductionShot \{[\s\S]*?\}/, match => {
  if (match.includes('creative_memories')) return match;
  return match.replace(/\}/, '  creative_memories ProductionCreativeMemory[] @relation("ShotToMemory")\n}');
});

fs.writeFileSync('prisma/schema.prisma', content);
