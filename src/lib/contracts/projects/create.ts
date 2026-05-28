import { z } from 'zod';

/**
 * PHASE 7: API Contract Definition
 * Defines the request and response schemas for POST /api/v1/projects/create
 */

export const CreateProjectRequestSchema = z.object({
  project_name: z.string().min(3).max(100),
  description: z.string().optional(),
  client_id: z.string().uuid().optional(),
  project_type: z.enum(['AI Production', 'Hybrid Production', 'Normal Production']),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  budget: z.number().positive().optional(),
});

export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>;

export const CreateProjectResponseSchema = z.object({
  success: z.boolean(),
  project_id: z.string().uuid().optional(),
  error: z.string().optional(),
});

export type CreateProjectResponse = z.infer<typeof CreateProjectResponseSchema>;
