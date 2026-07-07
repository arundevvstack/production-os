# Local AI Production Studio

A desktop-grade, single-user AI image generation studio powered by your local GPU.
No cloud. No subscriptions. No API keys. Your RTX runs everything.

## What It Is

A complete creative application that lets you:
- Generate AI images using locally downloaded models
- Manage prompts, projects, and assets
- Monitor your GPU in real time
- Export your work

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 |
| Database | SQLite via Prisma |
| AI Gateway | FastAPI + Hugging Face Diffusers |
| Storage | Local filesystem / Supabase Storage |
| GPU | NVIDIA RTX (CUDA 12.x) |

## Quick Start

See [QUICKSTART.md](./QUICKSTART.md) for the fastest path to your first generated image.

## Full Installation

See [INSTALL.md](./INSTALL.md) for complete environment setup.

## Requirements

- Windows 10/11
- Node.js 20+
- Python 3.11+
- NVIDIA GPU with CUDA 12.x
- 12 GB VRAM minimum (RTX 3080 / RTX 4070 or better)
- 50 GB free disk space for models

## Modules

| Module | Description |
|--------|-------------|
| Dashboard | Overview of recent projects and generations |
| Projects | Create and manage creative projects |
| Generation Studio | Generate images with full parameter control |
| Prompt Library | Create, tag, favorite, and reuse prompts |
| Asset Library | Browse, preview, and manage generated images |
| Model Manager | View and manage locally downloaded AI models |
| Gateway Monitor | Real-time GPU, VRAM, and queue monitoring |
| Settings | Read-only configuration status view |

## License

See [LICENSE.md](./LICENSE.md)
