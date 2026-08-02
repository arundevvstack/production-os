import os
import shutil
from huggingface_hub import snapshot_download

def repair_cache():
    model_id = "black-forest-labs/FLUX.1-schnell"
    snapshot_dir = os.path.expanduser("~/.cache/huggingface/hub/models--black-forest-labs--FLUX.1-schnell/snapshots/741f7c3ce8b383c54771c7003378a50191e9efe9")
    
    if os.path.exists(snapshot_dir):
        print(f"Deleting corrupted snapshot: {snapshot_dir}")
        shutil.rmtree(snapshot_dir)
    else:
        print(f"Snapshot not found: {snapshot_dir}")
        
    print(f"Re-downloading {model_id}...")
    # This will securely redownload missing blobs/symlinks
    downloaded_path = snapshot_download(repo_id=model_id)
    print(f"Download complete: {downloaded_path}")
    
    # Verify configs exist now
    for sub in ["transformer", "text_encoder", "vae"]:
        conf_path = os.path.join(downloaded_path, sub, "config.json")
        if os.path.exists(conf_path):
            print(f"VERIFIED: {conf_path}")
        else:
            print(f"MISSING: {conf_path}")

if __name__ == "__main__":
    repair_cache()
