import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runVerification() {
  console.log("Starting Verification Harness...");
  
  const mockScriptContent = `
EXT. TEMPLE - DAY
A large crowd (ആളുകൾ) gathers. Mohan (മോഹൻ) arrives on a Motorcycle (മോട്ടോർസൈക്കിൾ). 
He is wearing a Red Saree (ചുവന്ന സാരി) - wait, maybe a Red Shirt (ചുവന്ന ഷർട്ട്). 
He carries a Rice Plate (അരി പ്ലേറ്റ്). 
A Dog (നായ) barks loudly. 
Gunshot (വെടിയൊച്ച) echoes. 
Mohan runs through the Smoke (പുക). 
The Camera follows closely on a Steadicam (സ്റ്റെഡികാം). 
Low key lighting (കുറഞ്ഞ വെളിച്ചം).
Mohan performs a dangerous stunt (അപകടകരമായ സ്റ്റണ്ട്).
He checks his Watch (വാച്ച്).
`;

  console.log("Setting up mock project and script...");
  const project = await prisma.project.create({
    data: {
      id: crypto.randomUUID(),
      project_name: "Forensic Test Project",
      updated_at: new Date()
    }
  });

  const script = await prisma.productionScript.create({
    data: {
      id: crypto.randomUUID(),
      project_id: project.id,
      content: mockScriptContent,
      version: 1,
      updated_at: new Date()
    }
  });

  console.log("Triggering Extraction Engine (this may take a minute)...");
  
  const baseUrl = "http://localhost:3003";
  const analyzeRes = await fetch(`${baseUrl}/api/v1/projects/${project.id}/script/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scriptId: script.id })
  });

  const analyzeData = await analyzeRes.json();
  console.log("Analyze API Response:", analyzeData);

  console.log("Fetching Breakdown Data...");
  const breakdownRes = await fetch(`${baseUrl}/api/v1/projects/${project.id}/breakdown`);
  const breakdownData = await breakdownRes.json();

  console.log("Breakdown Data Counts:");
  console.log({
    characters: breakdownData.characters?.length,
    locations: breakdownData.locations?.length,
    props: breakdownData.props?.length,
    vehicles: breakdownData.vehicles?.length,
    animals: breakdownData.animals?.length,
    vfxs: breakdownData.vfxs?.length,
    audios: breakdownData.audios?.length,
    costumes: breakdownData.costumes?.length,
    makeups: breakdownData.makeups?.length,
    lightings: breakdownData.lightings?.length,
    cameras: breakdownData.cameras?.length,
    continuities: breakdownData.continuities?.length,
  });

  console.log("Sample Data Check (Props):", breakdownData.props);
  console.log("Sample Data Check (Characters):", breakdownData.characters);
  
  console.log("Verification Complete. Please review the output for false positives or missing categories.");
  
  await prisma.project.delete({ where: { id: project.id } }); // Cleanup
}

runVerification().catch(console.error).finally(() => prisma.$disconnect());
