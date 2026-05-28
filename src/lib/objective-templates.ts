export interface ObjectiveTemplate {
  title: string;
  department: string;
  estimated_hours: number;
  priority: 'Low' | 'Medium' | 'High';
  checklist: { task: string; done: boolean }[];
  depends_on?: string[]; // Titles of objectives this depends on
}

export const AIFashionFilmTemplates: Record<string, ObjectiveTemplate[]> = {
  PRE_PRODUCTION: [
    {
      title: 'Prompt Styling & Lookbook',
      department: 'AI',
      estimated_hours: 4,
      priority: 'High',
      checklist: [
        { task: 'Define negative prompts', done: false },
        { task: 'Establish lighting style', done: false },
        { task: 'Generate 10 concept frames', done: false }
      ]
    },
    {
      title: 'Character Consistency Setup',
      department: 'AI',
      estimated_hours: 6,
      priority: 'High',
      checklist: [
        { task: 'Train LoRA/Face ID', done: false },
        { task: 'Verify multi-angle consistency', done: false }
      ],
      depends_on: ['Prompt Styling & Lookbook']
    }
  ],
  PRODUCTION: [
    {
      title: 'AI Video Generation (Raw)',
      department: 'AI',
      estimated_hours: 12,
      priority: 'High',
      checklist: [
        { task: 'Generate base shots', done: false },
        { task: 'Fix morphing artifacts', done: false }
      ]
    },
    {
      title: 'Motion Interpolation',
      department: 'Motion',
      estimated_hours: 4,
      priority: 'Medium',
      checklist: [
        { task: 'Smooth 12fps to 24fps', done: false }
      ],
      depends_on: ['AI Video Generation (Raw)']
    }
  ],
  POST_PRODUCTION: [
    {
      title: 'Upscaling (4K)',
      department: 'AI',
      estimated_hours: 8,
      priority: 'Medium',
      checklist: [
        { task: 'Run Topaz/Magnific', done: false },
        { task: 'Color pass', done: false }
      ]
    }
  ]
};

export const NormalProductionTemplates: Record<string, ObjectiveTemplate[]> = {
  PRE_PRODUCTION: [
    {
      title: 'Script & Storyboard',
      department: 'Creative',
      estimated_hours: 8,
      priority: 'High',
      checklist: [
        { task: 'Finalize Script', done: false },
        { task: 'Draw Storyboards', done: false }
      ]
    },
    {
      title: 'Location Scouting',
      department: 'Production',
      estimated_hours: 8,
      priority: 'Medium',
      checklist: [
        { task: 'Find 3 options', done: false },
        { task: 'Secure permits', done: false }
      ]
    }
  ],
  PRODUCTION: [
    {
      title: 'Principal Photography',
      department: 'Production',
      estimated_hours: 24,
      priority: 'High',
      checklist: [
        { task: 'Shoot Day 1', done: false },
        { task: 'Shoot Day 2', done: false },
        { task: 'Data wrangling', done: false }
      ]
    }
  ],
  POST_PRODUCTION: [
    {
      title: 'Offline Edit',
      department: 'Editing',
      estimated_hours: 16,
      priority: 'High',
      checklist: [
        { task: 'Assemble cut', done: false },
        { task: 'Director review', done: false }
      ]
    }
  ]
};

export const TemplateMapper: Record<string, Record<string, ObjectiveTemplate[]>> = {
  'AI Production': AIFashionFilmTemplates,
  'Normal Production': NormalProductionTemplates,
  'Hybrid Production': {
    PRE_PRODUCTION: [...NormalProductionTemplates.PRE_PRODUCTION, ...AIFashionFilmTemplates.PRE_PRODUCTION],
    PRODUCTION: [...NormalProductionTemplates.PRODUCTION, ...AIFashionFilmTemplates.PRODUCTION],
    POST_PRODUCTION: [...NormalProductionTemplates.POST_PRODUCTION, ...AIFashionFilmTemplates.POST_PRODUCTION]
  }
};
