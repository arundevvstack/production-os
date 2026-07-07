import os
import time
from pipeline_factory import PipelineFactory

STORAGE_DIR = "/storage"

def generate_task(request_data: dict, model_def: dict):
    """
    RQ Task to generate an asset using the universal PipelineFactory.
    """
    start_time = time.time()
    
    model_id = model_def.get("local_path", model_def["id"])
    category = model_def.get("category", "image")
    architecture = model_def.get("architecture", "diffusers")
    
    # 1. Instantiate or retrieve the cached pipeline
    pipeline = PipelineFactory.get_pipeline(category, architecture)
    
    # 2. Load the model weights into memory (lazy loaded, cached)
    pipeline.load(model_id)
    
    # 3. Generate the asset
    os.makedirs(STORAGE_DIR, exist_ok=True)
    result = pipeline.generate(request_data, model_def, STORAGE_DIR)
    
    duration = time.time() - start_time
    filename = result["filename"]
    
    return {
        "status": "success",
        "file_path": f"/storage/{filename}",
        "url_path": f"/api/v1/storage/{filename}",
        "metadata": {
            "model": model_def["id"],
            "category": category,
            "seed": result.get("seed"),
            "durationMs": int(duration * 1000)
        }
    }
