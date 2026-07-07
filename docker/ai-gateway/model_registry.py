import os
import json

MODELS_DIR = "/models"
DEFAULT_MODELS = [
    {
        "id": "nota-ai/bk-sdm-tiny",
        "name": "Validation Model (Small SD)",
        "category": "image",
        "provider": "local",
        "recommendedVRAM": 4,
        "capabilities": ["image"],
        "requires_auth": False,
        "requires_license": False
    },
    {
        "id": "black-forest-labs/FLUX.1-schnell",
        "name": "FLUX.1-schnell",
        "category": "image",
        "provider": "local",
        "recommendedVRAM": 16,
        "capabilities": ["image"],
        "requires_auth": True,
        "requires_license": True
    },
    {
        "id": "black-forest-labs/FLUX.1-dev",
        "name": "FLUX.1-dev",
        "category": "image",
        "provider": "local",
        "recommendedVRAM": 24,
        "capabilities": ["image"],
        "requires_auth": True,
        "requires_license": True
    }
]

def get_available_models():
    """
    Scans the /models directory recursively for model.json files.
    Returns both detected local models and default cloud hub models.
    """
    models = list(DEFAULT_MODELS)
    
    if os.path.exists(MODELS_DIR):
        for root, dirs, files in os.walk(MODELS_DIR):
            if 'model.json' in files:
                json_path = os.path.join(root, 'model.json')
                try:
                    with open(json_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        if "id" in data:
                            # Attach the absolute folder path as the execution id for local files if local_path is not defined
                            # The model registry id remains whatever the JSON says, but we store the local_path for worker.py
                            data["local_path"] = root
                            models.append(data)
                except Exception as e:
                    print(f"Error loading {json_path}: {e}")
                
    # Deduplicate by id
    seen = set()
    deduped = []
    for m in models:
        if m["id"] not in seen:
            seen.add(m["id"])
            deduped.append(m)
            
    return deduped

def get_model_definition(model_id: str):
    """
    Returns the specific model.json definition by id.
    """
    all_models = get_available_models()
    for m in all_models:
        if m["id"] == model_id:
            return m
    return None
