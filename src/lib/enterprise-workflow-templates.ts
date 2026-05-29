/**
 * Enterprise Workflow Templates — DP Media OS
 *
 * Streamlined production pipelines.
 */

export interface EnterpriseObjectiveTemplate {
  title: string;
  description: string;
  department: string;
  priority: 'High' | 'Medium' | 'Low';
  estimated_hours: number;
  offset_ratio: number;
  checklist: { task: string; done: boolean }[];
  depends_on: string[];
  is_client_visible: boolean;
  is_ai_task: boolean;
}

export interface EnterpriseStageTemplate {
  name: string;
  order: number;
  weight: number;
  objectives: EnterpriseObjectiveTemplate[];
}

export interface EnterpriseProjectTemplate {
  project_type: string;
  default_days: number;
  stages: EnterpriseStageTemplate[];
}

// ============================================================
// 1. AI PRODUCTION PIPELINE
// ============================================================
export const AIProductionTemplate: EnterpriseProjectTemplate = {
  project_type: 'AI Production',
  default_days: 21,
  stages: [
    {
      name: 'Pre-Production',
      order: 1,
      weight: 0.20,
      objectives: [
        {
          title: 'Brand Research & Prompt Design',
          description: 'Analyze brand assets and engineer master prompts for image and video generation.',
          department: 'AI',
          priority: 'High',
          estimated_hours: 8,
          offset_ratio: 0.0,
          checklist: [
            { task: 'Gather brand assets', done: false },
            { task: 'Engineer base prompts', done: false }
          ],
          depends_on: [],
          is_client_visible: false,
          is_ai_task: true,
        },
        {
          title: 'Visual Direction Approval',
          description: 'Present moodboards and initial AI-generated style frames to the client for approval.',
          department: 'Creative',
          priority: 'High',
          estimated_hours: 4,
          offset_ratio: 0.5,
          checklist: [
            { task: 'Present style frames', done: false },
            { task: 'Get client approval', done: false }
          ],
          depends_on: ['Brand Research & Prompt Design'],
          is_client_visible: true,
          is_ai_task: false,
        }
      ]
    },
    {
      name: 'AI Generation',
      order: 2,
      weight: 0.40,
      objectives: [
        {
          title: 'Asset Generation',
          description: 'Generate all character, background, and environment frames using AI.',
          department: 'AI',
          priority: 'High',
          estimated_hours: 16,
          offset_ratio: 0.0,
          checklist: [
            { task: 'Generate character frames', done: false },
            { task: 'Generate background frames', done: false },
            { task: 'Verify consistency', done: false }
          ],
          depends_on: ['Visual Direction Approval'],
          is_client_visible: false,
          is_ai_task: true,
        },
        {
          title: 'Image to Video Conversion',
          description: 'Convert approved static frames to motion video using AI video models.',
          department: 'AI',
          priority: 'High',
          estimated_hours: 16,
          offset_ratio: 0.5,
          checklist: [
            { task: 'Queue frames for video gen', done: false },
            { task: 'Review motion quality', done: false }
          ],
          depends_on: ['Asset Generation'],
          is_client_visible: false,
          is_ai_task: true,
        }
      ]
    },
    {
      name: 'Post-Production',
      order: 3,
      weight: 0.30,
      objectives: [
        {
          title: 'Editing & Cleanup',
          description: 'Edit AI footage, apply color grading, and remove AI generation artifacts.',
          department: 'Post-Production',
          priority: 'High',
          estimated_hours: 12,
          offset_ratio: 0.0,
          checklist: [
            { task: 'Assemble edit', done: false },
            { task: 'Remove artifacts', done: false },
            { task: 'Color grading', done: false }
          ],
          depends_on: ['Image to Video Conversion'],
          is_client_visible: false,
          is_ai_task: false,
        },
        {
          title: 'Audio & Voiceover',
          description: 'Integrate AI voiceover, sound effects, and background music.',
          department: 'Audio',
          priority: 'Medium',
          estimated_hours: 6,
          offset_ratio: 0.6,
          checklist: [
            { task: 'Generate AI VO', done: false },
            { task: 'Add SFX and music', done: false }
          ],
          depends_on: ['Editing & Cleanup'],
          is_client_visible: false,
          is_ai_task: false,
        }
      ]
    },
    {
      name: 'Delivery',
      order: 4,
      weight: 0.10,
      objectives: [
        {
          title: 'Final Client Review',
          description: 'Submit the completed project to the client for final feedback and approval.',
          department: 'Production',
          priority: 'High',
          estimated_hours: 4,
          offset_ratio: 0.0,
          checklist: [
            { task: 'Send review link', done: false },
            { task: 'Collect feedback', done: false }
          ],
          depends_on: ['Editing & Cleanup', 'Audio & Voiceover'],
          is_client_visible: true,
          is_ai_task: false,
        },
        {
          title: 'Export & Delivery',
          description: 'Export all deliverables in required formats and upload to delivery folder.',
          department: 'Production',
          priority: 'High',
          estimated_hours: 2,
          offset_ratio: 0.8,
          checklist: [
            { task: 'Export master files', done: false },
            { task: 'Upload to delivery portal', done: false }
          ],
          depends_on: ['Final Client Review'],
          is_client_visible: false,
          is_ai_task: false,
        }
      ]
    }
  ]
};

// ============================================================
// 2. HYBRID PRODUCTION PIPELINE
// ============================================================
export const HybridProductionTemplate: EnterpriseProjectTemplate = {
  project_type: 'Hybrid Production',
  default_days: 28,
  stages: [
    {
      name: 'Pre-Production',
      order: 1,
      weight: 0.25,
      objectives: [
        {
          title: 'Scripting & Storyboarding',
          description: 'Develop the core narrative and visual sequence, planning for both live-action and AI segments.',
          department: 'Creative',
          priority: 'High',
          estimated_hours: 12,
          offset_ratio: 0.0,
          checklist: [
            { task: 'Draft script', done: false },
            { task: 'Create storyboards', done: false },
            { task: 'Client approval', done: false }
          ],
          depends_on: [],
          is_client_visible: true,
          is_ai_task: false,
        },
        {
          title: 'Shoot Logistics',
          description: 'Coordinate locations, equipment, and talent for the live-action shoot days.',
          department: 'Production',
          priority: 'High',
          estimated_hours: 8,
          offset_ratio: 0.5,
          checklist: [
            { task: 'Book locations and equipment', done: false },
            { task: 'Confirm talent schedule', done: false }
          ],
          depends_on: ['Scripting & Storyboarding'],
          is_client_visible: false,
          is_ai_task: false,
        }
      ]
    },
    {
      name: 'Production Shoot',
      order: 2,
      weight: 0.20,
      objectives: [
        {
          title: 'Principal Photography',
          description: 'Execute the live-action shoot based on the approved storyboards.',
          department: 'Production',
          priority: 'High',
          estimated_hours: 16,
          offset_ratio: 0.0,
          checklist: [
            { task: 'Execute shoot', done: false },
            { task: 'Capture clean plates for VFX/AI', done: false },
            { task: 'Backup footage', done: false }
          ],
          depends_on: ['Shoot Logistics'],
          is_client_visible: false,
          is_ai_task: false,
        }
      ]
    },
    {
      name: 'AI Augmentation',
      order: 3,
      weight: 0.25,
      objectives: [
        {
          title: 'VFX & AI Enhancement',
          description: 'Use AI models to enhance live-action footage, add elements, or generate complementary scenes.',
          department: 'AI',
          priority: 'High',
          estimated_hours: 12,
          offset_ratio: 0.0,
          checklist: [
            { task: 'Generate AI B-roll', done: false },
            { task: 'Run AI enhancements on live footage', done: false }
          ],
          depends_on: ['Principal Photography'],
          is_client_visible: false,
          is_ai_task: true,
        },
        {
          title: 'Asset Integration',
          description: 'Integrate generated AI assets seamlessly with the live-action footage.',
          department: 'Post-Production',
          priority: 'High',
          estimated_hours: 8,
          offset_ratio: 0.5,
          checklist: [
            { task: 'Composite AI assets', done: false },
            { task: 'Match lighting and grain', done: false }
          ],
          depends_on: ['VFX & AI Enhancement'],
          is_client_visible: false,
          is_ai_task: false,
        }
      ]
    },
    {
      name: 'Post-Production',
      order: 4,
      weight: 0.20,
      objectives: [
        {
          title: 'Offline Edit & Color',
          description: 'Assemble the final cut, locking the edit and applying the final color grade.',
          department: 'Post-Production',
          priority: 'High',
          estimated_hours: 16,
          offset_ratio: 0.0,
          checklist: [
            { task: 'Lock edit', done: false },
            { task: 'Final color grade', done: false }
          ],
          depends_on: ['Asset Integration'],
          is_client_visible: false,
          is_ai_task: false,
        },
        {
          title: 'Audio Mix',
          description: 'Mix dialogue, SFX, and music for the final delivery.',
          department: 'Audio',
          priority: 'Medium',
          estimated_hours: 8,
          offset_ratio: 0.6,
          checklist: [
            { task: 'Clean dialogue', done: false },
            { task: 'Final mixdown', done: false }
          ],
          depends_on: ['Offline Edit & Color'],
          is_client_visible: false,
          is_ai_task: false,
        }
      ]
    },
    {
      name: 'Delivery',
      order: 5,
      weight: 0.10,
      objectives: [
        {
          title: 'Final Client Review',
          description: 'Submit the completed hybrid project to the client for final feedback and approval.',
          department: 'Production',
          priority: 'High',
          estimated_hours: 4,
          offset_ratio: 0.0,
          checklist: [
            { task: 'Send review link', done: false },
            { task: 'Collect feedback', done: false }
          ],
          depends_on: ['Offline Edit & Color', 'Audio Mix'],
          is_client_visible: true,
          is_ai_task: false,
        },
        {
          title: 'Export & Delivery',
          description: 'Export all deliverables in required formats and upload to delivery folder.',
          department: 'Production',
          priority: 'High',
          estimated_hours: 2,
          offset_ratio: 0.8,
          checklist: [
            { task: 'Export master files', done: false },
            { task: 'Upload to delivery portal', done: false }
          ],
          depends_on: ['Final Client Review'],
          is_client_visible: false,
          is_ai_task: false,
        }
      ]
    }
  ]
};

// ============================================================
// 3. NORMAL PRODUCTION PIPELINE
// ============================================================
export const NormalProductionTemplate: EnterpriseProjectTemplate = {
  project_type: 'Normal Production',
  default_days: 30,
  stages: [
    {
      name: 'Pre-Production',
      order: 1,
      weight: 0.30,
      objectives: [
        {
          title: 'Concept & Scripting',
          description: 'Develop the creative concept, script, and storyboards for the traditional production.',
          department: 'Creative',
          priority: 'High',
          estimated_hours: 16,
          offset_ratio: 0.0,
          checklist: [
            { task: 'Develop concept', done: false },
            { task: 'Draft script and storyboard', done: false },
            { task: 'Client approval', done: false }
          ],
          depends_on: [],
          is_client_visible: true,
          is_ai_task: false,
        },
        {
          title: 'Logistics & Prep',
          description: 'Book locations, hire crew, cast talent, and secure equipment for the shoot.',
          department: 'Production',
          priority: 'High',
          estimated_hours: 12,
          offset_ratio: 0.5,
          checklist: [
            { task: 'Cast talent', done: false },
            { task: 'Secure locations and permits', done: false },
            { task: 'Book crew and equipment', done: false },
            { task: 'Publish call sheet', done: false }
          ],
          depends_on: ['Concept & Scripting'],
          is_client_visible: false,
          is_ai_task: false,
        }
      ]
    },
    {
      name: 'Production',
      order: 2,
      weight: 0.30,
      objectives: [
        {
          title: 'Shoot Execution',
          description: 'Conduct the live-action production shoot according to schedule.',
          department: 'Production',
          priority: 'High',
          estimated_hours: 24,
          offset_ratio: 0.0,
          checklist: [
            { task: 'Execute shoot days', done: false },
            { task: 'Capture audio', done: false },
            { task: 'Backup all media to hard drives', done: false }
          ],
          depends_on: ['Logistics & Prep'],
          is_client_visible: false,
          is_ai_task: false,
        }
      ]
    },
    {
      name: 'Post-Production',
      order: 3,
      weight: 0.30,
      objectives: [
        {
          title: 'Offline Edit & Color',
          description: 'Assemble footage, refine edit, and apply color correction and grading.',
          department: 'Post-Production',
          priority: 'High',
          estimated_hours: 16,
          offset_ratio: 0.0,
          checklist: [
            { task: 'Sync media', done: false },
            { task: 'Assemble rough cut', done: false },
            { task: 'Apply color grade', done: false }
          ],
          depends_on: ['Shoot Execution'],
          is_client_visible: false,
          is_ai_task: false,
        },
        {
          title: 'Audio Mix & Graphics',
          description: 'Mix audio tracks, add music, and overlay any motion graphics or lower thirds.',
          department: 'Audio',
          priority: 'High',
          estimated_hours: 8,
          offset_ratio: 0.6,
          checklist: [
            { task: 'Mix audio', done: false },
            { task: 'Add motion graphics', done: false }
          ],
          depends_on: ['Offline Edit & Color'],
          is_client_visible: false,
          is_ai_task: false,
        }
      ]
    },
    {
      name: 'Delivery',
      order: 4,
      weight: 0.10,
      objectives: [
        {
          title: 'Final Client Review',
          description: 'Present the final cut to the client for approval.',
          department: 'Production',
          priority: 'High',
          estimated_hours: 4,
          offset_ratio: 0.0,
          checklist: [
            { task: 'Upload for review', done: false },
            { task: 'Address final revisions', done: false }
          ],
          depends_on: ['Offline Edit & Color', 'Audio Mix & Graphics'],
          is_client_visible: true,
          is_ai_task: false,
        },
        {
          title: 'Export & Delivery',
          description: 'Generate master files and required formats for delivery.',
          department: 'Production',
          priority: 'High',
          estimated_hours: 2,
          offset_ratio: 0.8,
          checklist: [
            { task: 'Export masters', done: false },
            { task: 'Upload deliverables', done: false }
          ],
          depends_on: ['Final Client Review'],
          is_client_visible: false,
          is_ai_task: false,
        }
      ]
    }
  ]
};

// ============================================================
// MASTER TEMPLATE REGISTRY
// ============================================================
export const ENTERPRISE_TEMPLATES: Record<string, EnterpriseProjectTemplate> = {
  'AI Production': AIProductionTemplate,
  'Hybrid Production': HybridProductionTemplate,
  'Normal Production': NormalProductionTemplate,
};

export const DEFAULT_TIMELINE_DAYS: Record<string, number> = {
  'AI Production': 21,
  'Hybrid Production': 28,
  'Normal Production': 30,
};
