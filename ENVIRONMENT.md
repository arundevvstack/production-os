# ENVIRONMENT — Configuration Reference

All configuration is done via environment variables in `.env` and `.env.local`.

## Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Prisma database connection string | `file:./dev.db` |
| `LOCAL_AI_URL` | URL of the FastAPI AI Gateway | `http://localhost:8000` |
| `LOCAL_AI_GATEWAY_KEY` | HMAC signing secret shared with gateway | `your-secret-key-min-32-chars` |
| `NEXT_PUBLIC_GATEWAY_URL` | Public-facing gateway URL (for browser) | `http://localhost:8000` |

## Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LOCAL_AI_DEFAULT_MODEL` | Default model ID if none selected | `nota-ai/bk-sdm-tiny` |
| `NEXT_PUBLIC_APP_URL` | Public URL of the Next.js app | `http://localhost:3000` |
| `STORAGE_PROVIDER` | Storage backend (`local` or `supabase`) | `local` |

## Supabase Storage (Optional)

If using Supabase for remote image storage:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |

## AI Gateway Variables

The following are configured in `docker/ai-gateway/.env` or as system environment variables:

| Variable | Description |
|----------|-------------|
| `AI_GATEWAY_KEY` | Must match `LOCAL_AI_GATEWAY_KEY` in Next.js |
| `HF_TOKEN` | Hugging Face token (required for gated models like FLUX) |
| `MODEL_CACHE_DIR` | Path to Hugging Face model cache |

## Example .env File

```env
# Database
DATABASE_URL="file:./dev.db"

# Local AI Gateway
LOCAL_AI_URL=http://localhost:8000
LOCAL_AI_GATEWAY_KEY=my-very-secret-hmac-key-at-least-32-chars
NEXT_PUBLIC_GATEWAY_URL=http://localhost:8000

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
