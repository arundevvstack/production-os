export interface ProviderModel {
  id: string;
  name: string;
  capabilities: string[]; // e.g., ["chat", "image", "video", "audio"]
}

export interface NormalizedProviderResponse {
  assetUrl?: string; // Generated image/video/audio URL
  textContent?: string; // Text/chat completion
  metadata: {
    provider: string;
    model: string;
    durationMs: number;
    usage?: any;
    raw_response?: any;
  };
}

export interface GenerationOptions {
  seed?: number;
  negativePrompt?: string;
  cfg?: number;
  steps?: number;
  aspectRatio?: string;
  duration?: number;
  [key: string]: any; // Additional provider-specific options
}

export interface ProviderAdapterInterface {
  /** Validates the provided API key */
  validateCredentials(apiKey: string): Promise<boolean>;

  /** Returns a list of models supported by this provider */
  listModels(apiKey: string): Promise<ProviderModel[]>;

  // --- Generation Methods ---
  
  generateImage(apiKey: string, model: string, prompt: string, options?: GenerationOptions): Promise<NormalizedProviderResponse>;
  
  generateVideo(apiKey: string, model: string, prompt: string, options?: GenerationOptions): Promise<NormalizedProviderResponse>;
  
  generateAudio(apiKey: string, model: string, prompt: string, options?: GenerationOptions): Promise<NormalizedProviderResponse>;
  
  generateVoice(apiKey: string, model: string, prompt: string, text: string, options?: GenerationOptions): Promise<NormalizedProviderResponse>;
  
  generateStoryboard(apiKey: string, model: string, scriptContent: string, options?: GenerationOptions): Promise<NormalizedProviderResponse>;
  
  generateVariation(apiKey: string, model: string, sourceAssetUrl: string, prompt?: string, options?: GenerationOptions): Promise<NormalizedProviderResponse>;
  
  upscale(apiKey: string, model: string, sourceAssetUrl: string, options?: GenerationOptions): Promise<NormalizedProviderResponse>;
  
  extend(apiKey: string, model: string, sourceAssetUrl: string, options?: GenerationOptions): Promise<NormalizedProviderResponse>;
  
  // --- Job Management ---
  
  cancelJob(apiKey: string, externalJobId: string): Promise<boolean>;
  
  checkStatus(apiKey: string, externalJobId: string): Promise<{ status: 'running' | 'completed' | 'failed', progress?: number, result?: NormalizedProviderResponse, error?: string }>;

  /** Legacy text submission */
  submitJob(apiKey: string, model: string, prompt: string, options?: any): Promise<NormalizedProviderResponse>;
  submitStreamingJob?(apiKey: string, model: string, prompt: string, systemPrompt?: string, options?: any): Promise<ReadableStream>;
}
