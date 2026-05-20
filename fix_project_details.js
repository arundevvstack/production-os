const fs = require('fs');

let content = fs.readFileSync('src/app/(dashboard)/projects/[projectId]/page.tsx', 'utf8');

// 1. Add Import
if (!content.includes('TimelineEngine')) {
  content = content.replace(
    'import { UnifiedClientSelector } from "@/components/unified-client-selector";',
    `import { UnifiedClientSelector } from "@/components/unified-client-selector";\nimport { TimelineEngine } from "@/components/gantt/TimelineEngine";`
  );
  // Just in case the above import is missing in this file:
  if (!content.includes('TimelineEngine')) {
    content = content.replace(
      'import { useTenant } from "@/hooks/use-tenant";',
      `import { TimelineEngine } from "@/components/gantt/TimelineEngine";\nimport { useTenant } from "@/hooks/use-tenant";`
    );
  }
}

// 2. Add TabsTrigger
if (!content.includes('value="timeline"')) {
  content = content.replace(
    '<TabsTrigger key={tab} value={tab}',
    `<TabsTrigger value="timeline" className="rounded-xl px-5 py-2.5 gap-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[10px] uppercase tracking-wider">\n              <Calendar className="h-3.5 w-3.5" /> Timeline\n            </TabsTrigger>\n            <TabsTrigger key={tab} value={tab}`
  );
}

// 3. Add TabsContent
if (!content.includes('<TimelineEngine')) {
  // Find where finances tab content ends or assets tab content ends
  const insertContent = `
        <TabsContent value="timeline" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <TimelineEngine objectives={objectives || []} startDate={project?.created_at} />
        </TabsContent>
  `;
  content = content.replace(
    '</Tabs>',
    `${insertContent}\n      </Tabs>`
  );
}

fs.writeFileSync('src/app/(dashboard)/projects/[projectId]/page.tsx', content);
console.log("Updated projects/[projectId]/page.tsx with Timeline tab");
