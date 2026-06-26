# DP Creative OS — Deployment Guide

The recommended deployment stack for DP Creative OS is **Vercel** (Hosting) + **Supabase** (PostgreSQL).

## Supabase Setup
1. Create a new project in Supabase.
2. Copy the Transaction Connection Pooler string.
3. In your `.env`, set this string as the `DATABASE_URL`.
   *(Ensure you append `?pgbouncer=true` if required by Prisma).*

## Vercel Deployment
1. Connect your GitHub repository to Vercel.
2. In the Vercel Project Settings, configure the Build Command:
   ```bash
   npx prisma generate && next build
   ```
3. Set the following Environment Variables in Vercel:
   - `DATABASE_URL`
   - `OPENROUTER_API_KEY`

## Post-Deployment Validation
Once deployed, verify the following:
1. **Prisma Client**: Ensure the Vercel logs show `Generated Prisma Client successfully`.
2. **Database Connection**: Login to the dashboard and create a test project.
3. **External Providers**: Attempt an AI Generation in the Generation Studio to verify that the Vercel Edge/Serverless functions can successfully communicate with OpenRouter.
