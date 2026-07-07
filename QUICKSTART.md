# QUICKSTART — Local AI Production Studio

Get from zero to your first generated image in under 10 minutes.

## Prerequisites

- NVIDIA GPU (RTX 3080+ recommended, 12 GB VRAM minimum)
- Node.js 20+ installed
- Python 3.11+ installed
- Git installed

---

## Step 1 — Clone the Repository

```bash
git clone <repo-url>
cd production-os
```

---

## Step 2 — Install Node Dependencies

```bash
npm install
```

---

## Step 3 — Set Up Environment

Copy the example environment file:

```bash
copy .env.example .env
```

Edit `.env` and set at minimum:

```env
LOCAL_AI_URL=http://localhost:8000
LOCAL_AI_GATEWAY_KEY=your-secret-hmac-key
NEXT_PUBLIC_GATEWAY_URL=http://localhost:8000
DATABASE_URL="file:./dev.db"
```

---

## Step 4 — Set Up the Database

```bash
npx prisma generate
npx prisma db push
```

---

## Step 5 — Start the AI Gateway

```bash
.\start-ai-gateway.ps1
```

Wait for the terminal to show: `INFO: Application startup complete.`

---

## Step 6 — Start the Web Application

In a new terminal:

```bash
npm run dev
```

Wait for: `✓ Ready in Xms`

---

## Step 7 — Open the Application

Navigate to: **http://localhost:3000**

---

## Step 8 — Generate Your First Image

1. Click **Projects** → **New Project**
2. Open the project → click **Generation Studio**
3. Select your model from the dropdown
4. Type a prompt (e.g. `a mountain at golden hour, photorealistic`)
5. Click **Generate**
6. Wait for the preview to appear (5–40 seconds depending on GPU)
7. Click **Asset Library** to view and download your image

---

## That's It

You are now running a fully local AI image studio with zero cloud dependencies.
