# MODELS — Supported AI Models

## Currently Supported

### Validation / Development Model

| Field | Value |
|-------|-------|
| ID | `nota-ai/bk-sdm-tiny` |
| Name | Validation Model (Small SD) |
| Architecture | Stable Diffusion (tiny) |
| VRAM Required | ~2 GB |
| Status | ✅ Cached & Ready |
| HF Auth Required | No |

Best for: rapid testing, pipeline validation, low-VRAM machines.

---

### Production Models

| ID | Name | VRAM | Auth Required |
|----|------|------|---------------|
| `black-forest-labs/FLUX.1-schnell` | FLUX.1-schnell | 12 GB | Yes (HF Token) |
| `black-forest-labs/FLUX.1-dev` | FLUX.1-dev | 24 GB | Yes (HF Token + License) |

---

## Downloading Models

Models are downloaded automatically from Hugging Face on first use.

To pre-download a model, start the AI Gateway and navigate to:
**Model Manager** → select a model → it will download on first generation.

For gated models (FLUX), you must:
1. Create a Hugging Face account at https://huggingface.co
2. Accept the model license on the model page
3. Create an access token at https://huggingface.co/settings/tokens
4. Set `HF_TOKEN=your_token` in your gateway environment

---

## Adding Custom Models

Custom Stable Diffusion compatible models can be added by:
1. Downloading the model to your Hugging Face cache directory
2. Adding the model ID to `model_registry.py` in `docker/ai-gateway/`
3. Restarting the AI Gateway

---

## Cache Location

Default: `C:\Users\<username>\.cache\huggingface\`

Current cache size can be viewed in the **Gateway Monitor** or **Settings** pages.
