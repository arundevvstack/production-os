export interface ProviderModel {
  id: string;
  name: string;
  capabilities: string[]; // e.g., ["chat", "image", "video"]
}

export interface NormalizedProviderResponse {
  assetUrl?: string; // If it generated an image/video and returned a URL
  textContent?: string; // If it's a text/chat completion
  metadata: {
    provider: string;
    model: string;
    durationMs: number;
    usage?: any;
    raw_response?: any;
  };
}

export interface ProviderAdapterInterface {
  /**
   * Validates the provided API key by making a lightweight request to the provider.
   */
  validateCredentials(apiKey: string): Promise<boolean>;

  /**
   * Returns a list of models supported by this provider connection.
   */
  listModels(apiKey: string): Promise<ProviderModel[]>;

  /**
   * Submits a generation job to the provider.
   */
  submitJob(apiKey: string, model: string, prompt: string, options?: any): Promise<NormalizedProviderResponse>;

  /**
   * Submits a generation job and streams the response back.
   * Useful for chat interfaces.
   */
  submitStreamingJob?(apiKey: string, model: string, prompt: string, systemPrompt?: string, options?: any): Promise<ReadableStream>;
}
