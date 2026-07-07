# Environment Variables

The following environment variables are required for the full hybrid architecture to function.

## Supabase (Next.js)
Required for database connections and Storage uploads.
```env
NEXT_PUBLIC_SUPABASE_URL="https://<project-id>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<public-anon-key>"
SUPABASE_SERVICE_ROLE_KEY="<secret-service-role-key>"
DATABASE_URL="postgresql://postgres.<project-id>:<password>@<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<project-id>:<password>@<region>.pooler.supabase.com:5432/postgres"
```

## Hybrid AI Gateway Configuration (Next.js & Gateway)
```env
# Enables Next.js to route AI generation to the Gateway Proxy
LOCAL_AI_ENABLED=true

# Next.js specific: URL of the Gateway Proxy (Use Vercel Absolute URL in production)
LOCAL_AI_URL=http://localhost:3003/api/v1/gateway-proxy

# The actual remote URL of your local PC running the FastAPI Gateway (e.g. Ngrok)
LOCAL_AI_GATEWAY_URL=http://localhost:8000

# The secure cryptographic key used for HMAC request signing (Must match on Vercel and Local PC)
LOCAL_AI_GATEWAY_KEY=your_secure_random_key_here

# Timeout in milliseconds before Next.js aborts the request
LOCAL_AI_TIMEOUT=60000

# Default fallback model ID
LOCAL_AI_DEFAULT_MODEL=nota-ai/bk-sdm-tiny
```

## AI Gateway Specific (Local PC Only)
These variables should only be set in the `.env` on your local physical machine.
```env
# Hugging Face token required to download gated models (like FLUX.1)
HUGGING_FACE_HUB_TOKEN="hf_your_token_here"

# Path where the models are cached
MODEL_CACHE_DIR="C:/Users/<Username>/.cache/huggingface"

# Whether to fallback to a default model if a model is missing
ALLOW_MODEL_FALLBACK="false"
```
