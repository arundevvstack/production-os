import os
import sys

def verify_model():
    model_id = "black-forest-labs/FLUX.1-schnell"
    cache_dir = os.path.expanduser("~/.cache/huggingface/hub/models--black-forest-labs--FLUX.1-schnell")
    print(f"File: pipeline_factory.py")
    print(f"Function: load")
    print(f"Line: 38 (DiffusionPipeline.from_pretrained)")
    print(f"Repository ID: {model_id}")
    print(f"Cache path: {cache_dir}")
    print(f"Pipeline class: DiffusionPipeline -> FluxPipeline")
    print(f"Torch dtype: torch.bfloat16")
    import torch
    print(f"Device: cuda if available ({torch.cuda.is_available()})")
    
    if not os.path.exists(cache_dir):
        print(f"\n[PHASE 4] Cache directory {cache_dir} DOES NOT EXIST.")
    else:
        snapshots_dir = os.path.join(cache_dir, "snapshots")
        if os.path.exists(snapshots_dir):
            snapshots = os.listdir(snapshots_dir)
            print(f"\n[PHASE 4] Found snapshots: {snapshots}")
            for snapshot in snapshots:
                snapshot_path = os.path.join(snapshots_dir, snapshot)
                print(f"  Snapshot {snapshot}:")
                for root, dirs, files in os.walk(snapshot_path):
                    for name in dirs:
                        print(f"    Dir: {os.path.relpath(os.path.join(root, name), snapshot_path)}")
                    for name in files:
                        print(f"    File: {os.path.relpath(os.path.join(root, name), snapshot_path)}")
        else:
            print("\n[PHASE 4] No snapshots directory found.")

if __name__ == "__main__":
    verify_model()
