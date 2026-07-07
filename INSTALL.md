# Installation Guide

## Prerequisites
- Node.js 18+
- Python 3.10+
- NVIDIA GPU with 12GB+ VRAM (RTX 3060/4070 or better)
- Git

## 1. Web Application Setup (Next.js)
1. Clone the repository.
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in the values (see `ENVIRONMENT.md`).
4. Generate the Prisma client:
   ```bash
   npx prisma generate
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## 2. AI Gateway Setup (FastAPI)
The AI Gateway must run on the machine with the physical GPU.
1. Navigate to the Gateway directory:
   ```bash
   cd docker/ai-gateway
   ```
2. Create a virtual environment:
   ```bash
   python -m venv .venv
   ```
3. Activate the virtual environment:
   - Windows: `.venv\Scripts\activate`
   - Linux/Mac: `source .venv/bin/activate`
4. Install PyTorch with CUDA support (adjust index URL for your CUDA version):
   ```bash
   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
   ```
5. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
6. Start the Gateway:
   ```bash
   uvicorn main:app --port 8000 --host 0.0.0.0
   ```
