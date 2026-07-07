# Local AI Production Studio v1.0.0

A secure, offline-first Next.js interface for managing local AI Generation via a FastAPI Diffusers Gateway. 
This application provides a comprehensive Project Workspace, Prompt Library, Generation Studio, and Asset Library tailored to run completely locally on a dedicated AI server (e.g., RTX 4070).

## Architecture
- **Frontend:** Next.js (App Router), TailwindCSS, Radix UI, Lucide React
- **Backend:** Next.js Serverless API routes securely proxying to local FastAPI.
- **Database:** Prisma ORM with PostgreSQL.
- **AI Gateway:** A decoupled FastAPI application utilizing Hugging Face Diffusers, optimized for local inference pipelines.

## Getting Started

1. **Environment Setup**
   Copy `.env.example` to `.env` (or configure your local `.env`) and ensure you have valid Postgres credentials and your `LOCAL_AI_GATEWAY_KEY` securely configured.

2. **Database Initialization**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Run the Studio**
   ```bash
   npm run dev
   ```

5. **Start the AI Gateway**
   Ensure your local Python FastAPI server is running in its virtual environment on port `8000`:
   ```bash
   uvicorn main:app --port 8000 --host 0.0.0.0
   ```

## Production Build
```bash
npm run build
npm start
```
