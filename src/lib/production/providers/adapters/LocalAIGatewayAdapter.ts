import { ProviderAdapterInterface, ProviderModel, NormalizedProviderResponse, GenerationOptions } from "../ProviderAdapterInterface";
import { StorageManager } from "../../storage/StorageManager";

export class LocalAIGatewayAdapter implements ProviderAdapterInterface {
  
  private getBaseUrl(): string {
    return process.env.LOCAL_AI_URL || "http://localhost:8000";
  }

  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/health`, { method: "GET" });
      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels(apiKey: string): Promise<ProviderModel[]> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/models`, { method: "GET" });
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.error("LocalFluxAdapter listModels error:", e);
    }
    
    // Fallback if the gateway is temporarily down
    return [
      { id: "black-forest-labs/FLUX.1-schnell", name: "FLUX.1-schnell", capabilities: ["image"] },
      { id: "black-forest-labs/FLUX.1-dev", name: "FLUX.1-dev", capabilities: ["image"] }
    ];
  }

  async submitJob(apiKey: string, model: string, prompt: string, options?: any): Promise<NormalizedProviderResponse> {
    const payload = {
      prompt,
      model: model || process.env.LOCAL_AI_DEFAULT_MODEL || "black-forest-labs/FLUX.1-schnell",
      // Image/Video args
      width: options?.width || 1024,
      height: options?.height || 1024,
      steps: options?.steps || 4,
      cfg: options?.cfg || 3.5,
      seed: options?.seed,
      negative_prompt: options?.negativePrompt,
      // Audio/Voice args
      duration: options?.duration,
      voice_id: options?.voiceId
    };

    const response = await fetch(`${this.getBaseUrl()}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`AI Gateway Error: ${await response.text()}`);
    }

    const data = await response.json();
    
    // In Native V1 Mode, the gateway processes synchronously and returns the completed data
    if (data.status === "completed") {
      const storageAdapter = StorageManager.getAdapter();
      const publicUrl = storageAdapter.getPublicUrl(data.url_path);
      
      return {
        assetUrl: publicUrl,
        metadata: {
          provider: "Local AI Gateway",
          model: payload.model,
          durationMs: data.metadata?.durationMs || 0,
          raw_response: data
        }
      };
    }
    
    return {
      metadata: {
        provider: "Local AI Gateway",
        model: payload.model,
        durationMs: 0,
        raw_response: data
      }
    };
  }

  async checkStatus(apiKey: string, externalJobId: string): Promise<{ status: "running" | "completed" | "failed"; progress?: number; result?: NormalizedProviderResponse; error?: string; }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/job/${externalJobId}`);
      if (!response.ok) {
        return { status: "failed", error: `Job not found: ${externalJobId}` };
      }
      
      const data = await response.json();
      const st = data.status; // rq status: queued, started, finished, failed, canceled
      
      if (st === "finished") {
        const result = data.result; // contains file_path, url_path, metadata
        const storageAdapter = StorageManager.getAdapter();
        // Result provides url_path which maps directly to the local storage API route
        const publicUrl = storageAdapter.getPublicUrl(result.url_path);

        return {
          status: "completed",
          result: {
            assetUrl: publicUrl,
            metadata: {
              ...result.metadata,
              provider: "Local AI Gateway"
            }
          }
        };
      } else if (st === "failed") {
        return {
          status: "failed",
          error: data.error || "Unknown error during generation"
        };
      }
      
      // Still running or queued
      return { status: "running" };

    } catch (e: any) {
      return { status: "failed", error: e.message };
    }
  }

  // --- Deprecated / Unsupported Methods ---
  async generateImage(apiKey: string, model: string, prompt: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> {
    throw new Error("generateImage is deprecated. Use submitJob instead for async generation.");
  }
  async generateVideo(apiKey: string, model: string, prompt: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> { throw new Error("generateVideo not supported."); }
  async generateAudio(apiKey: string, model: string, prompt: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> { throw new Error("generateAudio not supported."); }
  async generateVoice(apiKey: string, model: string, prompt: string, text: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> { throw new Error("generateVoice not supported."); }
  async generateStoryboard(apiKey: string, model: string, scriptContent: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> { throw new Error("generateStoryboard not supported."); }
  async generateVariation(apiKey: string, model: string, sourceAssetUrl: string, prompt?: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> { throw new Error("generateVariation not supported."); }
  async upscale(apiKey: string, model: string, sourceAssetUrl: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> { throw new Error("upscale not supported."); }
  async extend(apiKey: string, model: string, sourceAssetUrl: string, options?: GenerationOptions): Promise<NormalizedProviderResponse> { throw new Error("extend not supported."); }
  async cancelJob(apiKey: string, externalJobId: string): Promise<boolean> { throw new Error("cancelJob not natively supported yet."); }
}
