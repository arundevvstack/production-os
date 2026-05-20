const fs = require('fs');

let content = fs.readFileSync('src/app/(dashboard)/projects/page.tsx', 'utf8');

// 1. Add import
if (!content.includes('generateProjectFromTemplate')) {
  content = content.replace(
    'import { UnifiedClientSelector } from "@/components/unified-client-selector";',
    `import { UnifiedClientSelector } from "@/components/unified-client-selector";\nimport { generateProjectFromTemplate, ProjectTemplate } from "@/lib/workflow/template-engine";`
  );
}

// 2. Add state
if (!content.includes('selectedTemplate')) {
  content = content.replace(
    'const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);',
    `const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);\n  const [selectedTemplate, setSelectedTemplate] = useState<string>("None");`
  );
}

// 3. Update handleCreateProject
if (!content.includes('generateProjectFromTemplate(companyId, data[0].id')) {
  const insertOld = `const { error } = await supabase.from('Project').insert({
      company_id: companyId,
      project_name: newProject.project_name,
      client_name: newProject.client_name,
      budget: parseFloat(newProject.budget) || 0,
      deadline: newProject.deadline || null,
      status: 'in_progress',
      progress: 0,
      color: randomColor,
    });`;
    
  const insertNew = `const { data, error } = await supabase.from('Project').insert({
      company_id: companyId,
      project_name: newProject.project_name,
      client_name: newProject.client_name,
      budget: parseFloat(newProject.budget) || 0,
      deadline: newProject.deadline || null,
      status: 'in_progress',
      progress: 0,
      color: randomColor,
    }).select();

    if (!error && data && data.length > 0 && selectedTemplate !== "None") {
      try {
        await generateProjectFromTemplate(companyId, data[0].id, selectedTemplate as ProjectTemplate, new Date());
      } catch (tmplErr) {
        console.error("Template Gen Error:", tmplErr);
      }
    }`;
    
  content = content.replace(insertOld, insertNew);
}

// 4. Update UI form
if (!content.includes('value={selectedTemplate}')) {
  const formOld = `<div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Deadline</Label>
                    <Input 
                      id="deadline" 
                      type="date"
                      value={newProject.deadline}
                      onChange={(e) => setNewProject({...newProject, deadline: e.target.value})}
                      className="h-12 rounded-[10px] border-slate-200 bg-white shadow-sm font-bold"
                    />
                  </div>
                </div>`;
                
  const formNew = `<div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Deadline</Label>
                    <Input 
                      id="deadline" 
                      type="date"
                      value={newProject.deadline}
                      onChange={(e) => setNewProject({...newProject, deadline: e.target.value})}
                      className="h-12 rounded-[10px] border-slate-200 bg-white shadow-sm font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Roadmap Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger className="h-12 rounded-[10px] border-slate-200 bg-white shadow-sm font-bold">
                      <SelectValue placeholder="Select Template (Optional)" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[10px] bg-white border border-slate-200 shadow-xl z-[100]">
                      <SelectItem value="None" className="text-xs font-bold rounded-xl m-1">None (Blank Project)</SelectItem>
                      <SelectItem value="AI TVC" className="text-xs font-bold rounded-xl m-1">AI TVC</SelectItem>
                      <SelectItem value="Corporate Film" className="text-xs font-bold rounded-xl m-1">Corporate Film</SelectItem>
                      <SelectItem value="Social Media Campaign" className="text-xs font-bold rounded-xl m-1">Social Media Campaign</SelectItem>
                      <SelectItem value="Brand Identity" className="text-xs font-bold rounded-xl m-1">Brand Identity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>`;
                
  content = content.replace(formOld, formNew);
}

// 5. Reset selectedTemplate
if (!content.includes('setSelectedTemplate("None");')) {
  content = content.replace(
    'setNewProject({ project_name: "", client_name: "", budget: "", deadline: "", service_category: "", service: "" });',
    'setNewProject({ project_name: "", client_name: "", budget: "", deadline: "", service_category: "", service: "" });\n    setSelectedTemplate("None");'
  );
}

fs.writeFileSync('src/app/(dashboard)/projects/page.tsx', content);
console.log("Updated projects/page.tsx");
