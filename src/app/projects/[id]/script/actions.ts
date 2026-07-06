"use server";

import prisma from "@/lib/prisma";
import { PermissionEngine } from "@/lib/production/PermissionEngine";
import { WorkflowEngine } from "@/lib/production/WorkflowEngine";
import { revalidatePath } from "next/cache";

export async function createScriptVersion(projectId: string, content: string) {
  const latestScript = await prisma.productionScript.findFirst({
    where: { project_id: projectId },
    orderBy: { version: 'desc' }
  });

  const nextVersion = (latestScript?.version || 0) + 1;

  const newScript = await prisma.productionScript.create({
    data: {
      id: require('crypto').randomUUID(),
      updated_at: new Date(),
      project_id: projectId,
      version: nextVersion,
      content,
      is_locked: false,
      is_approved: false
    }
  });

  revalidatePath(`/projects/${projectId}/script`);
  return newScript;
}

export async function autoSaveScript(scriptId: string, content: string) {
  if (!scriptId) return;
  try {
    await prisma.productionScript.update({
      where: { id: scriptId },
      data: { content, updated_at: new Date() }
    });
  } catch (error) {
    console.error("Auto-save failed:", error);
  }
}

export async function verifyScript(scriptId: string, projectId: string) {
  const role = await PermissionEngine.getCurrentUserRole();
  if (!PermissionEngine.can(role, 'approve_script')) return;

  await prisma.productionScript.update({
    where: { id: scriptId },
    data: { is_locked: true, is_approved: true, updated_at: new Date() }
  });
  
  revalidatePath(`/projects/${projectId}/script`);
}

export async function duplicateVerifiedScript(projectId: string, content: string) {
    return createScriptVersion(projectId, content);
}

export async function parseUploadedScript(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file uploaded");

  const buffer = Buffer.from(await file.arrayBuffer());
  let extractedText = "";

  if (file.name.endsWith('.pdf')) {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    extractedText = data.text;
  } else if (file.name.endsWith('.docx')) {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    extractedText = result.value;
  } else {
    // txt, md, fountain
    extractedText = buffer.toString('utf-8');
  }

  // Basic markdown to HTML conversion for the TipTap editor
  let html = extractedText
    .split('\n\n')
    .map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');

  return html;
}

export async function generateScriptWithAI(projectId: string, params: Record<string, string>) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error("Project not found");

  const provider = await prisma.productionAIProvider.findFirst({ where: { name: "Google GenAI" } });
  if (!provider) throw new Error("Google GenAI provider not configured in system.");

  const { ProviderManager } = await import("@/lib/production/providers/ProviderManager");
  const { ContextBuilder } = await import("@/lib/production/assistant/ContextBuilder");
  
  const apiKey = await ProviderManager.getDecryptedCredentials(provider.id);
  const adapter = ProviderManager.getAdapter(provider.name);
  
  const systemPrompt = await ContextBuilder.buildSystemPrompt({ projectId });

  const userPrompt = `
Generate a professional script formatted in HTML (using semantic tags like <h1>, <h2>, <p>, <strong>, <em>, <blockquote>, etc. suitable for TipTap). Do not output markdown, ONLY valid HTML that can be directly inserted into an editor.

Script Parameters:
- Project Type: ${params.projectType}
- Objective: ${params.objective}
- Target Audience: ${params.audience}
- Duration: ${params.duration}
- Language: ${params.language}
- Tone: ${params.tone}
- Brand Name: ${params.brandName}
- Key Message: ${params.keyMessage}
- Call To Action: ${params.cta}
- Reference Style: ${params.referenceStyle}
- Additional Notes: ${params.notes}

Please provide the full script now.
  `;

  // Submit Job
  const fullPrompt = systemPrompt + "\n\n" + userPrompt;
  const response = await adapter.submitJob(apiKey, "gemini-2.5-flash", fullPrompt);

  if (!response.textContent) throw new Error("No response received from AI");

  // Remove potential markdown fences from the response if the AI ignores instructions
  let html = response.textContent;
  if (html.startsWith("```html")) html = html.replace("```html", "");
  if (html.startsWith("```")) html = html.replace("```", "");
  if (html.endsWith("```")) html = html.slice(0, -3);

  // Create new version
  return createScriptVersion(projectId, html.trim());
}

export async function rewriteScriptWithAI(projectId: string, selectedText: string, actionType: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error("Project not found");

  const provider = await prisma.productionAIProvider.findFirst({ where: { name: "Google GenAI" } });
  if (!provider) throw new Error("Google GenAI provider not configured in system.");

  const { ProviderManager } = await import("@/lib/production/providers/ProviderManager");
  const { ContextBuilder } = await import("@/lib/production/assistant/ContextBuilder");
  
  const apiKey = await ProviderManager.getDecryptedCredentials(provider.id);
  const adapter = ProviderManager.getAdapter(provider.name);
  
  const systemPrompt = await ContextBuilder.buildSystemPrompt({ projectId });

  let instruction = "Rewrite the following text.";
  switch (actionType) {
    case 'Rewrite': instruction = "Rewrite the following text to flow better and sound more professional."; break;
    case 'Expand': instruction = "Expand the following text with more descriptive details and depth."; break;
    case 'Shorten': instruction = "Shorten and concisely summarize the following text."; break;
    case 'Improve Dialogue': instruction = "Improve the dialogue in the following text to sound more natural and engaging."; break;
    case 'Improve Narrative': instruction = "Improve the narrative flow and descriptive language in the following text."; break;
    case 'Convert Tone': instruction = "Convert the tone of the following text to match the overall project context."; break;
    case 'Grammar Fix': instruction = "Fix any grammar, spelling, or punctuation errors in the following text."; break;
    case 'Translate': instruction = "Translate the following text to English if it is not, or refine the translation."; break;
    case 'Continue Writing': instruction = "Continue writing the next logical sentences following this text."; break;
  }

  const userPrompt = `
You are an AI Script Editor. 
Instruction: ${instruction}

Please output ONLY the raw resulting text. If the input has HTML tags, preserve them. Do not include markdown formatting or explanations.

Input Text:
${selectedText}
  `;

  const fullPrompt = systemPrompt + "\n\n" + userPrompt;
  const response = await adapter.submitJob(apiKey, "gemini-2.5-flash", fullPrompt);

  if (!response.textContent) throw new Error("No response received from AI");

  return response.textContent.trim();
}
