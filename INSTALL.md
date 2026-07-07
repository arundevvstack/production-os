# INSTALL — Full Installation Guide

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| OS | Windows 10 | Windows 11 |
| GPU | RTX 3080 (10 GB) | RTX 4070 SUPER (12 GB) |
| CUDA | 12.0 | 12.1+ |
| RAM | 16 GB | 32 GB |
| Disk | 50 GB | 100 GB |
| Node.js | 20.x | 22.x |
| Python | 3.11 | 3.11 |

---

## 1. Node.js Setup

Download and install Node.js 20+ from https://nodejs.org

Verify:
```bash
node --version   # v20.x.x or higher
npm --version    # 10.x.x or higher
```

---

## 2. Python Setup

Install Python 3.11 from https://python.org

Verify:
```bash
python --version  # Python 3.11.x
```

---

## 3. CUDA Setup

Install NVIDIA CUDA Toolkit 12.x from:
https://developer.nvidia.com/cuda-downloads

Install PyTorch with CUDA:
```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
```

Verify:
```python
import torch
print(torch.cuda.is_available())   # True
print(torch.cuda.get_device_name(0))  # NVIDIA GeForce RTX XXXX
```

---

## 4. Install Application Dependencies

```bash
npm install
```

---

## 5. Install AI Gateway Dependencies

```bash
cd docker/ai-gateway
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
cd ../..
```

---

## 6. Database Setup

```bash
npx prisma generate
npx prisma db push
```

Seed the database with provider records:
```bash
node scripts/seed-workflow-templates.js
```

---

## 7. Environment Configuration

See [ENVIRONMENT.md](./ENVIRONMENT.md) for all required variables.

---

## 8. Start Services

Gateway (PowerShell terminal 1):
```powershell
.\start-ai-gateway.ps1
```

Next.js (PowerShell terminal 2):
```bash
npm run dev
```

---

## 9. First Run Verification

Visit http://localhost:3000/monitor to confirm:
- Gateway Status: Online
- GPU: Detected
- CUDA: Available

If GPU shows as offline, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).
