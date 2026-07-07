# Troubleshooting Guide

## AI Gateway Issues

### 1. `CUDA out of memory`
**Symptom**: Gateway responds with `507 Insufficient Storage` or `OUT_OF_MEMORY` error code.
**Cause**: The GPU does not have enough VRAM to load the model or generate the image at the requested resolution.
**Solution**: 
- Close other GPU-intensive applications (e.g. video games, local LLMs).
- Reduce the image resolution (e.g., from 1024x1024 to 512x512).
- Restart the Gateway server.

### 2. `403 Invalid request signature`
**Symptom**: The Next.js application logs `Gateway Proxy Error` and the Gateway returns `403 Forbidden`.
**Cause**: The `LOCAL_AI_GATEWAY_KEY` does not match between the Next.js Vercel environment and the local PC's `.env` file, or the payload was tampered with in transit.
**Solution**: Ensure the keys match exactly in both `.env` configurations.

### 3. `403 Request expired (Replay Protection)`
**Symptom**: Requests take a long time to reach the Gateway and are rejected.
**Cause**: The Gateway blocks requests with timestamps older than 5 minutes to prevent replay attacks.
**Solution**: Ensure the clock on the Vercel server and the local PC are synchronized via NTP.

### 4. `401 Unauthorized (Gated Model)`
**Symptom**: The Gateway fails to download `FLUX.1-schnell`.
**Cause**: Missing or invalid Hugging Face token.
**Solution**: Provide a valid `HUGGING_FACE_HUB_TOKEN` in the `.env` and ensure you have accepted the license agreement on the Hugging Face website.

## Supabase Issues

### 1. `Supabase upload failed: Bucket not found`
**Symptom**: The image generates on the local PC, but Next.js fails to upload it.
**Cause**: The `assets` bucket has not been created in Supabase Storage.
**Solution**: Go to the Supabase Dashboard > Storage and create a new public bucket named `assets`.

### 2. `Invalid prisma.productionAsset.create() invocation`
**Symptom**: Generation finishes but the DB throws a Prisma error during creation.
**Cause**: Schema mismatch or database was not migrated.
**Solution**: Run `npx prisma db push` or `npx prisma migrate deploy` to ensure your Supabase database schema is up-to-date.
