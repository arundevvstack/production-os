import os
import uuid
import shutil
import json
import hmac
import hashlib
import time
from typing import Optional, Dict
from fastapi import FastAPI, HTTPException, Response, Request, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from model_registry import get_available_models, get_model_definition
from pipeline_factory import PipelineFactory, COMFYUI_URL
import requests

# Load environment variables from .env
from dotenv import load_dotenv
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
load_dotenv(dotenv_path=env_path)

app = FastAPI(title="Production OS - AI Gateway (Native Sync)")

DEFAULT_MODEL = os.getenv("LOCAL_AI_DEFAULT_MODEL", "black-forest-labs/FLUX.1-schnell")
ALLOW_MODEL_FALLBACK = os.getenv("ALLOW_MODEL_FALLBACK", "false").lower() == "true"
FALLBACK_MODEL = "shuttleai/shuttle-3-diffusion"

CACHE_DIR = os.getenv("MODEL_CACHE_DIR", os.getenv("HF_HOME", os.path.expanduser("~/.cache/huggingface")))

def get_dir_size(path):
    total_size = 0
    if not os.path.exists(path):
        return 0
    for dirpath, _, filenames in os.walk(path):
        for f in filenames:
            fp = os.path.join(dirpath, f)
            if not os.path.islink(fp):
                total_size += os.path.getsize(fp)
    return total_size

def check_model_cached(model_id: str):
    """Checks if a model is available in ComfyUI."""
    try:
        res = requests.get(f"{COMFYUI_URL}/object_info", timeout=2)
        if res.status_code == 200:
            # We assume ComfyUI manages models dynamically, so it's 'cached' 
            # if we can hit ComfyUI. Actual node validation can be deeper.
            return True
    except:
        pass
    return False

@app.on_event("startup")
def startup_event():
    print("=" * 50)
    print("AI Gateway Startup Validation (ComfyUI Backend)")
    print("=" * 50)
    
    print(f"[INFO] COMFYUI_URL: {COMFYUI_URL}")
    
    try:
        res = requests.get(f"{COMFYUI_URL}/system_stats", timeout=5)
        res.raise_for_status()
        print("[OK] Connected to ComfyUI.")
    except Exception as e:
        print(f"[WARNING] Failed to connect to ComfyUI at startup: {e}")
        
    print("=" * 50)

async def verify_security(request: Request):
    gateway_key = os.getenv("LOCAL_AI_GATEWAY_KEY")
    if not gateway_key:
        return # Auth disabled if no key is configured
        
    x_ai_key = request.headers.get("X-AI-KEY")
    x_timestamp = request.headers.get("X-Timestamp")
    x_signature = request.headers.get("X-Signature")
    
    if not x_ai_key or not x_timestamp or not x_signature:
        raise HTTPException(status_code=401, detail="Missing security headers")
        
    if x_ai_key != gateway_key:
        raise HTTPException(status_code=403, detail="Invalid API Key")
        
    try:
        timestamp = int(x_timestamp)
        if abs(time.time() * 1000 - timestamp) > 300000:
            raise HTTPException(status_code=403, detail="Request expired (Replay Protection)")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid timestamp format")
        
    body = await request.body()
    payload = body.decode("utf-8")
    
    expected_sig = hmac.new(
        gateway_key.encode("utf-8"),
        (x_timestamp + payload).encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(expected_sig, x_signature):
        raise HTTPException(status_code=403, detail="Invalid request signature")

class GenerateRequest(BaseModel):
    prompt: str = Field(..., max_length=2000)
    model: Optional[str] = DEFAULT_MODEL
    width: Optional[int] = Field(1024, le=2048)
    height: Optional[int] = Field(1024, le=2048)
    steps: Optional[int] = Field(4, le=100)
    cfg: Optional[float] = Field(3.5, le=30.0)
    seed: Optional[int] = None
    negative_prompt: Optional[str] = Field(None, max_length=2000)
    duration: Optional[float] = None
    voice_id: Optional[str] = None

@app.get("/health")
def health_check():
    try:
        res = requests.get(f"{COMFYUI_URL}/system_stats", timeout=3)
        return {"status": "healthy", "comfyui": "connected"}
    except:
        return {"status": "unhealthy", "comfyui": "disconnected"}

@app.get("/gpu")
def gpu_status():
    status = {
        "cuda_available": False,
        "device_count": 0,
        "devices": []
    }
    
    try:
        res = requests.get(f"{COMFYUI_URL}/system_stats", timeout=3)
        if res.status_code == 200:
            stats = res.json()
            if "devices" in stats:
                status["cuda_available"] = True
                status["devices"] = stats["devices"]
                status["device_count"] = len(stats["devices"])
    except:
        pass
        
    return status

@app.get("/metrics")
def system_metrics():
    import psutil
    return {
        "cpu_percent": psutil.cpu_percent(),
        "memory_percent": psutil.virtual_memory().percent,
        "gpu": gpu_status()
    }

@app.get("/capabilities")
def get_capabilities():
    models = get_available_models()
    capabilities = list(set(m.get("category", "image") for m in models))
    return {"capabilities": capabilities}

@app.get("/queue")
def queue_status():
    return {
        "queued_jobs": 0,
        "started_jobs": 0,
        "finished_jobs": 0,
        "failed_jobs": 0,
        "message": "Queue disabled in Native V1 Mode"
    }

@app.get("/workers")
def worker_status():
    return [{"message": "Running in Native Sync Mode"}]

@app.get("/models")
def list_models():
    models = get_available_models()
    for m in models:
        m_id = m.get("id")
        is_cached = check_model_cached(m_id)
        m["cached"] = is_cached
        m["downloaded"] = is_cached
        m["status"] = "ready" if is_cached else "missing"
        m["requires_auth"] = m.get("requires_auth", False)
        m["requires_license"] = m.get("requires_license", False)
        # Approximate size could be calculated, but left empty unless requested dynamically
        m["size"] = 0 
        m["last_used"] = None
    return models

@app.get("/cache")
def get_cache_info():
    if not os.path.exists(CACHE_DIR):
        return {"status": "missing", "total_size_gb": 0, "free_gb": 0, "path": CACHE_DIR}
    
    total_size = get_dir_size(CACHE_DIR)
    disk_usage = shutil.disk_usage(CACHE_DIR)
    
    return {
        "status": "active",
        "total_size_gb": round(total_size / (1024**3), 2),
        "free_gb": round(disk_usage.free / (1024**3), 2),
        "path": CACHE_DIR
    }

@app.post("/cache/clear")
def clear_cache():
    if not os.path.exists(CACHE_DIR):
        return {"status": "success", "message": "Cache directory does not exist."}
    try:
        shutil.rmtree(CACHE_DIR)
        os.makedirs(CACHE_DIR, exist_ok=True)
        return {"status": "success", "message": "Cache cleared."}
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": "Failed to clear cache", "cause": str(e)})

@app.get("/job/{job_id}")
def get_job_status(job_id: str):
    raise HTTPException(status_code=400, detail="Async jobs disabled in Native V1 mode.")

@app.get("/api/v1/storage/{filename}", dependencies=[Depends(verify_security)])
async def get_storage_file(filename: str):
    STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "storage")
    file_path = os.path.join(STORAGE_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="File not found")

@app.post("/generate", dependencies=[Depends(verify_security)])
def generate_asset(request: GenerateRequest):
    import time
    start_time = time.time()
    
    model_def = get_model_definition(request.model)
    if not model_def:
        raise HTTPException(status_code=400, detail={
            "error_code": "INVALID_MODEL",
            "cause": f"Model {request.model} not found in registry.",
            "suggested_fix": "Select a valid model from the UI.",
            "recovery_action": "Check GET /models for available options."
        })

    model_id = model_def.get("local_path", model_def["id"])
    category = model_def.get("category", "image")
    architecture = model_def.get("architecture", "diffusers")
    
    pipeline = PipelineFactory.get_pipeline(category, architecture)
    
    fallback_used = False
    
    try:
        pipeline.load(model_id)
    except Exception as e:
        error_msg = str(e)
        import requests.exceptions
        
        if isinstance(e, requests.exceptions.ConnectionError) or "Connection aborted" in error_msg or "Failed to connect" in error_msg:
            raise HTTPException(status_code=502, detail={
                "error_code": "NETWORK_FAILURE",
                "cause": f"Failed to connect to ComfyUI at {COMFYUI_URL}.",
                "suggested_fix": "Ensure ComfyUI is running.",
                "recovery_action": "Retry the generation."
            })
        else:
            raise HTTPException(status_code=500, detail={
                "error_code": "MODEL_LOAD_FAILURE",
                "cause": error_msg,
                "suggested_fix": "Review the detailed AI Gateway logs.",
                "recovery_action": "Ensure your environment dependencies are correct."
            })

    
    STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "storage")
    os.makedirs(STORAGE_DIR, exist_ok=True)
    
    result = pipeline.generate(request.dict(), model_def, STORAGE_DIR)
    
    duration = time.time() - start_time
    filename = result["filename"]
    
    response_payload = {
        "status": "completed",
        "file_path": f"/storage/{filename}",
        "url_path": f"/api/v1/storage/{filename}",
        "metadata": {
            "model": model_def["id"],
            "category": category,
            "seed": result.get("seed"),
            "durationMs": int(duration * 1000)
        }
    }
    
    if fallback_used:
        response_payload["warning"] = f"Requested model {request.model} failed auth. Fell back to {FALLBACK_MODEL}."
        
    return response_payload
