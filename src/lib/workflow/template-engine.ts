import { supabase } from "@/supabase/client";

export type ProjectTemplate = 'AI TVC' | 'Corporate Film' | 'Social Media Campaign' | 'Brand Identity';

interface TemplateStage {
  title: string;
  duration_days: number;
}

interface TemplateObjective {
  title: string;
  stage: string;
  offset_days: number; // Days after project start
  duration_days: number;
  priority: 'High' | 'Medium' | 'Low';
  department: string;
}

const templates: Record<ProjectTemplate, { stages: TemplateStage[], objectives: TemplateObjective[] }> = {
  'AI TVC': {
    stages: [
      { title: 'Pre-Production', duration_days: 7 },
      { title: 'Production', duration_days: 14 },
      { title: 'Post-Production', duration_days: 10 }
    ],
    objectives: [
      { title: 'Concept & Scripting', stage: 'Pre-Production', offset_days: 0, duration_days: 3, priority: 'High', department: 'Creative' },
      { title: 'AI Model Training & Prompting', stage: 'Pre-Production', offset_days: 2, duration_days: 5, priority: 'High', department: 'VFX / AI' },
      { title: 'Storyboard & Animatics', stage: 'Pre-Production', offset_days: 4, duration_days: 3, priority: 'Medium', department: 'Creative' },
      { title: 'Primary AI Generation', stage: 'Production', offset_days: 7, duration_days: 10, priority: 'High', department: 'VFX / AI' },
      { title: 'Upscaling & Refinement', stage: 'Production', offset_days: 15, duration_days: 6, priority: 'Medium', department: 'VFX / AI' },
      { title: 'Editing & Compositing', stage: 'Post-Production', offset_days: 21, duration_days: 5, priority: 'High', department: 'Post-Production' },
      { title: 'Color Grading', stage: 'Post-Production', offset_days: 26, duration_days: 2, priority: 'Medium', department: 'Post-Production' },
      { title: 'Sound Design & Final Mix', stage: 'Post-Production', offset_days: 28, duration_days: 3, priority: 'High', department: 'Audio' }
    ]
  },
  'Corporate Film': {
    stages: [
      { title: 'Pre-Production', duration_days: 10 },
      { title: 'Production', duration_days: 5 },
      { title: 'Post-Production', duration_days: 14 }
    ],
    objectives: [
      { title: 'Client Brief & Scripting', stage: 'Pre-Production', offset_days: 0, duration_days: 5, priority: 'High', department: 'Creative' },
      { title: 'Location Scouting', stage: 'Pre-Production', offset_days: 5, duration_days: 3, priority: 'Medium', department: 'Production' },
      { title: 'Crew & Gear Booking', stage: 'Pre-Production', offset_days: 7, duration_days: 3, priority: 'High', department: 'Production' },
      { title: 'Principal Photography', stage: 'Production', offset_days: 10, duration_days: 5, priority: 'High', department: 'Production' },
      { title: 'Offline Edit', stage: 'Post-Production', offset_days: 15, duration_days: 7, priority: 'High', department: 'Post-Production' },
      { title: 'Client Review 1', stage: 'Post-Production', offset_days: 22, duration_days: 2, priority: 'High', department: 'Creative' },
      { title: 'Online Edit, Color & Sound', stage: 'Post-Production', offset_days: 24, duration_days: 5, priority: 'Medium', department: 'Post-Production' }
    ]
  },
  'Social Media Campaign': {
    stages: [
      { title: 'Strategy', duration_days: 5 },
      { title: 'Content Creation', duration_days: 10 },
      { title: 'Distribution', duration_days: 15 }
    ],
    objectives: [
      { title: 'Content Strategy & Calendar', stage: 'Strategy', offset_days: 0, duration_days: 5, priority: 'High', department: 'Marketing' },
      { title: 'Asset Design & Video Snippets', stage: 'Content Creation', offset_days: 5, duration_days: 10, priority: 'High', department: 'Creative' },
      { title: 'Copywriting', stage: 'Content Creation', offset_days: 8, duration_days: 5, priority: 'Medium', department: 'Marketing' },
      { title: 'Scheduling & Publishing', stage: 'Distribution', offset_days: 15, duration_days: 15, priority: 'High', department: 'Marketing' },
      { title: 'Performance Analytics', stage: 'Distribution', offset_days: 25, duration_days: 5, priority: 'Medium', department: 'Marketing' }
    ]
  },
  'Brand Identity': {
    stages: [
      { title: 'Discovery', duration_days: 7 },
      { title: 'Design', duration_days: 14 },
      { title: 'Delivery', duration_days: 5 }
    ],
    objectives: [
      { title: 'Brand Workshop', stage: 'Discovery', offset_days: 0, duration_days: 2, priority: 'High', department: 'Strategy' },
      { title: 'Market Research & Positioning', stage: 'Discovery', offset_days: 2, duration_days: 5, priority: 'Medium', department: 'Strategy' },
      { title: 'Logo Concepts', stage: 'Design', offset_days: 7, duration_days: 7, priority: 'High', department: 'Creative' },
      { title: 'Typography & Color Palette', stage: 'Design', offset_days: 14, duration_days: 3, priority: 'Medium', department: 'Creative' },
      { title: 'Brand Guidelines', stage: 'Delivery', offset_days: 21, duration_days: 5, priority: 'High', department: 'Creative' }
    ]
  }
};

export const generateProjectFromTemplate = async (
  companyId: string, 
  projectId: string, 
  templateName: ProjectTemplate,
  startDate: Date = new Date()
) => {
  const template = templates[templateName];
  if (!template) throw new Error("Invalid template name");

  try {
    // 1. Generate Stages
    // We don't have a specific ProjectStage table yet, but we use the 'stage' field on Objectives.
    // So we will just map them directly to Objectives.
    
    // 2. Insert Objectives
    const objectivesToInsert = template.objectives.map(obj => {
      const objStartDate = new Date(startDate);
      objStartDate.setDate(objStartDate.getDate() + obj.offset_days);
      
      const objDueDate = new Date(objStartDate);
      objDueDate.setDate(objDueDate.getDate() + obj.duration_days);

      return {
        company_id: companyId,
        project_id: projectId,
        title: obj.title,
        stage: obj.stage,
        status: 'not_started',
        priority: obj.priority,
        department: obj.department,
        start_date: objStartDate.toISOString(),
        due_date: objDueDate.toISOString(),
        progress: 0,
      };
    });

    const { data, error } = await supabase.from('Objective').insert(objectivesToInsert).select();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Template generation error:", error);
    throw error;
  }
};
