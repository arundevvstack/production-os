import { z } from 'zod';

export const ProjectCreatedEventSchema = z.object({
  event: z.literal('PROJECT_CREATED'),
  schema_version: z.literal('1.0'),
  trace_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  timestamp: z.string().datetime(),
  payload: z.object({
    project_id: z.string().uuid(),
    project_name: z.string(),
    project_type: z.string(),
    client_id: z.string().uuid().optional()
  })
});

export type ProjectCreatedEvent = z.infer<typeof ProjectCreatedEventSchema>;
