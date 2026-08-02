import { ProviderAdapterInterface } from "./ProviderAdapterInterface";
import { OpenRouterAdapter } from "./adapters/OpenRouterAdapter";
import { OpenAIAdapter } from "./adapters/OpenAIAdapter";
import { GeminiAdapter } from "./adapters/GeminiAdapter";
import { RunwayAdapter } from "./adapters/RunwayAdapter";
import { LumaAdapter } from "./adapters/LumaAdapter";
import { FluxAdapter } from "./adapters/FluxAdapter";
import { LocalAIGatewayAdapter } from "./adapters/LocalAIGatewayAdapter";
import prisma from "@/lib/prisma";
import { CryptoUtils } from "../CryptoUtils";
import crypto from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// ENV → PROVIDER BOOTSTRAP MAP
// Maps .env variable names to provider configurations.
// Used to auto-seed the database on first run from environment variables.
// ─────────────────────────────────────────────────────────────────────────────
const ENV_PROVIDER_BOOTSTRAP: Array<{
  envKey: string;
  name: string;
  category: string;
  supported_asset_types: string[];
  supported_models: string[];
  auth_type: string;
}> = [
  {
    envKey: "GEMINI_API_KEY",
    name: "Google GenAI",
    category: "Text & Multimodal",
    supported_asset_types: ["Text", "Image", "Video"],
    supported_models: ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"],
    auth_type: "Bearer",
  },
  {
    envKey: "OPENAI_API_KEY",
    name: "OpenAI",
    category: "Text & Image",
    supported_asset_types: ["Text", "Image"],
    supported_models: ["gpt-4o", "dall-e-3", "gpt-4o-mini"],
    auth_type: "Bearer",
  },
  {
    envKey: "OPENROUTER_API_KEY",
    name: "OpenRouter",
    category: "Text & Image",
    supported_asset_types: ["Text", "Image"],
    supported_models: ["openai/gpt-4o", "anthropic/claude-3-5-sonnet"],
    auth_type: "Bearer",
  },
  {
    envKey: "LOCAL_AI_GATEWAY_KEY",
    name: "Local AI",
    category: "Local Image",
    supported_asset_types: ["Image"],
    supported_models: [process.env.LOCAL_AI_DEFAULT_MODEL || "nota-ai/bk-sdm-tiny"],
    auth_type: "HMAC",
  },
];

// Bootstrap lock — prevent concurrent bootstrapping
let _bootstrapping = false;
let _bootstrapped = false;

export class ProviderManager {

  /**
   * Returns the correct adapter for a given provider name.
   */
  static getAdapter(providerName: string): ProviderAdapterInterface {
    switch (providerName.toLowerCase()) {
      case 'openrouter': return new OpenRouterAdapter();
      case 'openai': return new OpenAIAdapter();
      case 'google genai':
      case 'gemini': return new GeminiAdapter();
      case 'runway': return new RunwayAdapter();
      case 'luma': return new LumaAdapter();
      case 'flux': return new FluxAdapter();
      case 'local flux':
      case 'local ai': return new LocalAIGatewayAdapter();
      default:
        throw new Error(`Provider adapter not found for: ${providerName}`);
    }
  }

  /**
   * Maps a provider name to its corresponding .env variable name.
   */
  static getEnvKeyForProvider(providerName: string): string | null {
    const lower = providerName.toLowerCase();
    if (lower.includes("gemini") || lower.includes("google")) return "GEMINI_API_KEY";
    if (lower.includes("openai")) return "OPENAI_API_KEY";
    if (lower.includes("openrouter")) return "OPENROUTER_API_KEY";
    if (lower.includes("local")) return "LOCAL_AI_GATEWAY_KEY";
    if (lower.includes("hugging") || lower.includes("hf")) return "HUGGING_FACE_HUB_TOKEN";
    return null;
  }

  /**
   * AUTO-BOOTSTRAP: Reads provider credentials from .env and seeds the database
   * if no providers are registered. Called automatically on first use.
   *
   * ROOT CAUSE FIX: The ProductionAIProvider table was empty on fresh install
   * because there is no seed file and no provider management UI.
   * This method detects that state and creates provider + credential records
   * from the .env variables (GEMINI_API_KEY, LOCAL_AI_GATEWAY_KEY, etc.).
   */
  static async ensureProvidersBootstrapped(): Promise<void> {
    if (_bootstrapped || _bootstrapping) return;
    _bootstrapping = true;

    try {
      const existingCount = await prisma.productionAIProvider.count();
      if (existingCount > 0) {
        _bootstrapped = true;
        return;
      }

      console.log('[ProviderManager] No providers in DB — auto-bootstrapping from .env variables...');

      for (const config of ENV_PROVIDER_BOOTSTRAP) {
        const envValue = process.env[config.envKey];
        if (!envValue) {
          console.log(`[ProviderManager] Skipping ${config.name}: ${config.envKey} not set in .env`);
          continue;
        }

        const providerId = crypto.randomUUID();

        await prisma.productionAIProvider.create({
          data: {
            id: providerId,
            name: config.name,
            category: config.category,
            is_enabled: true,
            supported_asset_types: config.supported_asset_types,
            supported_models: config.supported_models,
            auth_type: config.auth_type,
            status: "active",
            updated_at: new Date(),
          }
        });

        // Local AI uses HMAC — the env key is a gateway secret, not an API key.
        // The LocalAIGatewayAdapter reads LOCAL_AI_GATEWAY_KEY directly from env.
        if (config.auth_type === "HMAC") {
          console.log(`[ProviderManager] ✓ Bootstrapped: ${config.name} (HMAC — no stored credential needed)`);
          continue;
        }

        const encrypted = CryptoUtils.encrypt(envValue);
        await prisma.productionProviderCredential.create({
          data: {
            id: crypto.randomUUID(),
            provider_id: providerId,
            api_key_encrypted: encrypted,
            status: "Online",
            last_tested_at: new Date(),
            updated_at: new Date(),
          }
        });

        console.log(`[ProviderManager] ✓ Bootstrapped: ${config.name} (credential seeded from ${config.envKey})`);
      }

      _bootstrapped = true;
      console.log('[ProviderManager] Auto-bootstrap complete.');
    } catch (e: any) {
      console.error('[ProviderManager] Bootstrap error:', e.message);
    } finally {
      _bootstrapping = false;
    }
  }

  /**
   * Retrieves and decrypts the API key for a specific provider.
   *
   * ROOT CAUSE FIX: Falls back to .env vars if the DB credential is missing,
   * then auto-seeds the credential row so future calls use the DB directly.
   * Previously threw "No credentials configured" on every call because the
   * DB was empty (no seed, no UI).
   */
  static async getDecryptedCredentials(providerId: string): Promise<string> {
    const provider = await prisma.productionAIProvider.findUnique({ where: { id: providerId } });
    const creds = await prisma.productionProviderCredential.findMany({
      where: { provider_id: providerId }
    });

    const cred = creds[0];

    // Local providers (Local FLUX, Local AI) use HMAC env vars, not stored credentials.
    if (!cred || !cred.api_key_encrypted) {
      const isLocal = provider?.name?.toLowerCase().includes("local");
      if (isLocal) return "";

      // ── ENV-VAR FALLBACK ──────────────────────────────────────────────────
      // DB credential is missing. Check .env directly.
      // This fires on fresh installs before bootstrap has run.
      const envKey = this.getEnvKeyForProvider(provider?.name || "");
      const envValue = envKey ? process.env[envKey] : null;

      if (envValue) {
        console.log(`[ProviderManager] DB credential missing for "${provider?.name}" — reading ${envKey} from .env and auto-seeding DB`);
        // Auto-seed so next call is a pure DB read
        try {
          const encrypted = CryptoUtils.encrypt(envValue);
          await prisma.productionProviderCredential.create({
            data: {
              id: crypto.randomUUID(),
              provider_id: providerId,
              api_key_encrypted: encrypted,
              status: "Online",
              last_tested_at: new Date(),
              updated_at: new Date(),
            }
          });
        } catch (_) {
          // Silently ignore if a concurrent call already inserted the row
        }
        return envValue;
      }

      // Also try to find the key by matching provider name to env vars
      // (for cases where provider was created by generation/route.ts without a credential)
      const nameBasedKey = this.getEnvKeyForProvider(provider?.name || "");
      const nameBasedValue = nameBasedKey ? process.env[nameBasedKey] : null;
      if (nameBasedValue) return nameBasedValue;

      throw new Error(
        `No credentials configured for provider "${provider?.name || providerId}". ` +
        `Set ${this.getEnvKeyForProvider(provider?.name || "") || "the API key env variable"} in your .env file.`
      );
    }

    try {
      return CryptoUtils.decrypt(cred.api_key_encrypted);
    } catch (e) {
      // If decryption fails (e.g. key rotation), check env as fallback
      const envKey = this.getEnvKeyForProvider(provider?.name || "");
      const envValue = envKey ? process.env[envKey] : null;
      if (envValue) return envValue;

      const isLocal = provider?.name?.toLowerCase().includes("local");
      if (isLocal) return "";
      throw new Error("Failed to decrypt credentials. The encryption key may have changed.");
    }
  }

  /**
   * Saves or updates provider credentials. Encrypts the key before saving.
   */
  static async saveCredentials(providerId: string, rawApiKey: string): Promise<void> {
    const encrypted = CryptoUtils.encrypt(rawApiKey);

    const providerObj = await prisma.productionAIProvider.findUnique({ where: { id: providerId } });
    if (!providerObj) throw new Error("Provider not found in registry");

    let status = "Offline";
    try {
      const adapter = this.getAdapter(providerObj.name);
      const isValid = await adapter.validateCredentials(rawApiKey);
      status = isValid ? "Online" : "Invalid";
    } catch (e) {
      status = "Offline";
    }

    const existingCreds = await prisma.productionProviderCredential.findMany({
      where: { provider_id: providerId }
    });

    if (existingCreds.length > 0) {
      await prisma.productionProviderCredential.update({
        where: { id: existingCreds[0].id },
        data: {
          api_key_encrypted: encrypted,
          status,
          last_tested_at: new Date(),
          updated_at: new Date()
        }
      });
    } else {
      await prisma.productionProviderCredential.create({
        data: {
          id: crypto.randomUUID(),
          provider_id: providerId,
          api_key_encrypted: encrypted,
          status,
          last_tested_at: new Date(),
          updated_at: new Date()
        }
      });
    }
  }

  /**
   * List all providers with their current credential status and supported models.
   * Auto-bootstraps from .env on first call.
   */
  static async getProviderStatuses(): Promise<any[]> {
    await this.ensureProvidersBootstrapped();

    const providers = await prisma.productionAIProvider.findMany({
      include: { ProductionProviderCredential: true }
    });

    const results = [];
    for (const p of providers) {
      let models: any[] = [];
      const status = p.ProductionProviderCredential[0]?.status || "Unconfigured";

      if (p.is_enabled) {
        try {
          const adapter = this.getAdapter(p.name);
          const apiKey = status === "Online" && p.ProductionProviderCredential[0]
            ? CryptoUtils.decrypt(p.ProductionProviderCredential[0].api_key_encrypted)
            : "dummy-key-for-local-models";

          models = await adapter.listModels(apiKey);
        } catch (e) {
          console.error(`Failed to fetch models for ${p.name}:`, e);
        }
      }

      results.push({
        id: p.id,
        name: p.name,
        category: p.category,
        is_enabled: p.is_enabled,
        status,
        last_tested_at: p.ProductionProviderCredential[0]?.last_tested_at || null,
        models
      });
    }

    return results;
  }

  /**
   * Used by UI to quickly test an API key before saving
   */
  static async testCredentials(providerName: string, rawApiKey: string): Promise<boolean> {
    const adapter = this.getAdapter(providerName);
    return adapter.validateCredentials(rawApiKey);
  }
}
