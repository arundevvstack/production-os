# Deployment Guide

The Production OS platform utilizes a **Hybrid Deployment Architecture**:
1. **Cloud Web Application**: The Next.js frontend and database are deployed to Vercel and Supabase.
2. **Local AI Server**: The AI Gateway runs locally on your Windows machine with an RTX GPU.

## 1. Web Application Deployment (Vercel)
1. Push your repository to GitHub.
2. Import the project into Vercel.
3. Configure the **Environment Variables** in Vercel (see `ENVIRONMENT.md`).
4. Ensure `LOCAL_AI_ENABLED=true` is set in Vercel to route traffic to the proxy.
5. Deploy.

## 2. Supabase Configuration
1. Create a new Supabase project.
2. Create an `assets` bucket in Supabase Storage. Set it to **Public**.
3. Run Prisma migrations to set up the database schema:
   ```bash
   npx prisma migrate deploy
   ```

## 3. Secure AI Gateway (Local PC)
To allow the Vercel app to communicate with your local GPU securely, you must expose the Gateway via a secure tunnel.
1. Start the FastAPI Gateway locally:
   ```bash
   uvicorn main:app --port 8000
   ```
2. Start an Ngrok tunnel (or Cloudflare Tunnel) to expose port 8000:
   ```bash
   ngrok http 8000
   ```
3. Copy the Ngrok HTTPS URL.
4. Go to Vercel Environment Variables and set `LOCAL_AI_GATEWAY_URL` to your Ngrok URL.
5. Ensure both Vercel and your local `.env` share the exact same `LOCAL_AI_GATEWAY_KEY` for secure HMAC validation.

> [!IMPORTANT]
> Never expose your Gateway without `LOCAL_AI_GATEWAY_KEY` configured. The middleware protects your GPU from unauthorized access and replay attacks.
