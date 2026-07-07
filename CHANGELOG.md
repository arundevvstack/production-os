# CHANGELOG

## v1.0.0-rc1 — 2026-07-07

### Release Candidate 1

First stable release of the Local AI Production Studio.

---

### Features

**Generation Studio**
- Full parameter control: Prompt, Negative Prompt, Model, Width, Height, Steps, CFG, Seed
- Random Seed toggle
- Reuse Last Settings button
- History panel (last 20 jobs)
- Real-time progress indicator for running jobs
- Direct link to Asset Library from preview
- Stop / Cancel running jobs
- Retry from any history entry

**Prompt Library**
- Create, edit, delete, duplicate prompts
- Tags, Favorites, Pinned
- Search and filter
- Export / Import JSON
- One-click send to Generation Studio

**Asset Library**
- Grid and List views
- Full-screen preview modal
- Complete metadata display (Prompt, Negative Prompt, Model, Seed, CFG, Steps, Scheduler, Resolution, Generation Time, Date)
- Copy Prompt, Copy Metadata (JSON), Copy Path
- Open Folder, Download
- Delete with confirmation
- Reuse in Generation Studio

**Model Manager**
- Auto-detection of locally cached models
- Display: Name, Architecture, VRAM Required, Size, Cache Size, Last Used, Status
- Refresh from gateway
- Clear Cache

**Gateway Monitor**
- Live 5-second refresh
- CPU, RAM, VRAM metrics with progress bars
- Queue status, Current model, Active generation ID, Last inference time
- GPU device details

**Settings**
- Read-only configuration dashboard
- Gateway URL, HMAC status
- Storage paths (Models, Cache, Outputs)
- Environment info: Python, PyTorch, CUDA, GPU, Connection Status

**Workspace**
- Project Brief, Notes, References with autosave
- Recent Assets and Recent Prompts feeds

---

### Bug Fixes

- Fixed: `provider_id` FK constraint when dispatching jobs with logical name `"local_gateway"`
- Fixed: Local AI providers bypass credential decryption (they use HMAC env vars)
- Fixed: `result_url` not persisted in job metadata for synchronous generations
- Fixed: Generation Studio history limited to 20 entries to prevent UI bloat
- Fixed: Settings page converted to client component to fetch live gateway data

---

### Known Limitations

- Image-to-Image: **Not implemented** (deferred to V2 — requires Gateway pipeline extension)
- Model Load/Unload controls: **Not implemented** (deferred to V2)
- Prompt Version History: **Not implemented** (deferred to V2)
- Batch Queue UI: **Not implemented** (deferred to V2)
- Side-by-Side Image Comparison: **Not implemented** (deferred to V2)
- FLUX.1-dev: Requires 24 GB VRAM — not usable on RTX 4070 SUPER (12 GB)

---

### Validated On

- Windows 11
- NVIDIA RTX 4070 SUPER (12 GB VRAM)
- CUDA 12.1
- PyTorch 2.1.2
- Node.js 20.x
- Python 3.11.x
- Next.js 16.1.6
- Prisma 6.x
- FastAPI + Uvicorn
