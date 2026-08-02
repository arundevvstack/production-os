import os
import time
import requests
import uuid
import json
from abc import ABC, abstractmethod

# The user might override COMFYUI_URL in .env, otherwise default to local
COMFYUI_URL = os.getenv("COMFYUI_URL", "http://127.0.0.1:8188")

class BasePipeline(ABC):
    @abstractmethod
    def load(self, model_id: str):
        pass
        
    @abstractmethod
    def generate(self, request_data: dict, model_def: dict, storage_dir: str):
        pass

class ComfyUIPipeline(BasePipeline):
    def __init__(self):
        self.model_id = None
        self._lock = __import__('threading').Lock()
        
    def load(self, model_id: str):
        with self._lock:
            print(f"PipelineFactory: Verifying ComfyUI connection for {model_id}...")
            
            # Simple health check to ComfyUI
            try:
                res = requests.get(f"{COMFYUI_URL}/system_stats", timeout=5)
                res.raise_for_status()
                print(f"[OK] Connected to ComfyUI at {COMFYUI_URL}")
            except Exception as e:
                raise RuntimeError(f"Failed to connect to ComfyUI at {COMFYUI_URL}: {e}")
                
            self.model_id = model_id
        
    def generate(self, request_data: dict, model_def: dict, storage_dir: str):
        if self.model_id is None:
            raise RuntimeError(f"Pipeline not loaded. Call load() before generate().")
            
        prompt = request_data.get('prompt', '')
        negative_prompt = request_data.get('negative_prompt', '')
        seed = request_data.get('seed')
        if seed is None:
            import random
            seed = random.randint(0, 1000000000)
            
        width = request_data.get('width', 1024)
        height = request_data.get('height', 1024)
        cfg = request_data.get('cfg', 3.5)
        steps = request_data.get('steps', 20)
        
        # Auto-resolve checkpoint if the requested one isn't in ComfyUI
        ckpt_name = self.model_id
        try:
            res = requests.get(f"{COMFYUI_URL}/object_info/CheckpointLoaderSimple", timeout=5)
            if res.status_code == 200:
                obj_info = res.json()
                valid_ckpts = obj_info.get("CheckpointLoaderSimple", {}).get("input", {}).get("required", {}).get("ckpt_name", [[]])[0]
                if valid_ckpts and ckpt_name not in valid_ckpts:
                    ckpt_name = valid_ckpts[0]
                    print(f"[ComfyUI] Warning: Model {self.model_id} not found. Auto-mapped to {ckpt_name}")
        except Exception as e:
            print(f"[ComfyUI] Failed to validate checkpoint list: {e}")
        
        # Build standard KSampler workflow
        workflow = {
            "3": {
                "class_type": "KSampler",
                "inputs": {
                    "seed": seed,
                    "steps": steps,
                    "cfg": cfg,
                    "sampler_name": "euler",
                    "scheduler": "normal",
                    "denoise": 1,
                    "model": ["4", 0],
                    "positive": ["6", 0],
                    "negative": ["7", 0],
                    "latent_image": ["5", 0]
                }
            },
            "4": {
                "class_type": "CheckpointLoaderSimple",
                "inputs": {
                    "ckpt_name": ckpt_name
                }
            },
            "5": {
                "class_type": "EmptyLatentImage",
                "inputs": {
                    "batch_size": 1,
                    "width": width,
                    "height": height
                }
            },
            "6": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": prompt,
                    "clip": ["4", 1]
                }
            },
            "7": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": negative_prompt,
                    "clip": ["4", 1]
                }
            },
            "8": {
                "class_type": "VAEDecode",
                "inputs": {
                    "samples": ["3", 0],
                    "vae": ["4", 2]
                }
            },
            "9": {
                "class_type": "SaveImage",
                "inputs": {
                    "filename_prefix": "gateway_comfy",
                    "images": ["8", 0]
                }
            }
        }
        
        # Submit to ComfyUI
        try:
            print(f"[ComfyUI] Submitting job with seed {seed}")
            post_res = requests.post(f"{COMFYUI_URL}/prompt", json={"prompt": workflow}, timeout=5)
            post_res.raise_for_status()
            prompt_id = post_res.json().get("prompt_id")
        except Exception as e:
            raise RuntimeError(f"ComfyUI /prompt submission failed: {e}")
            
        # Poll for completion
        max_attempts = 120 # 120 seconds max
        for i in range(max_attempts):
            try:
                hist_res = requests.get(f"{COMFYUI_URL}/history/{prompt_id}", timeout=5)
                if hist_res.status_code == 200:
                    history = hist_res.json()
                    if prompt_id in history:
                        # Job is done
                        outputs = history[prompt_id].get("outputs", {})
                        # Find the SaveImage node (9) output
                        if "9" in outputs and "images" in outputs["9"]:
                            images = outputs["9"]["images"]
                            if len(images) > 0:
                                filename = images[0]["filename"]
                                
                                # Download the image
                                img_res = requests.get(f"{COMFYUI_URL}/view?filename={filename}", timeout=5)
                                img_res.raise_for_status()
                                
                                out_filename = f"{uuid.uuid4()}.png"
                                filepath = os.path.join(storage_dir, out_filename)
                                with open(filepath, "wb") as f:
                                    f.write(img_res.content)
                                    
                                return {
                                    "filename": out_filename,
                                    "seed": seed
                                }
            except Exception as e:
                print(f"[ComfyUI] Polling error: {e}")
                
            time.sleep(1)
            
        raise RuntimeError("ComfyUI job timed out after 120 seconds")


class VideoStubPipeline(BasePipeline):
    def load(self, model_id: str):
        print(f"PipelineFactory: VideoStub loaded for {model_id}")
    
    def generate(self, request_data: dict, model_def: dict, storage_dir: str):
        filename = f"{uuid.uuid4()}.mp4"
        filepath = os.path.join(storage_dir, filename)
        with open(filepath, "wb") as f:
            f.write(b"fake_video_data")
        return {"filename": filename, "seed": 0}

class AudioStubPipeline(BasePipeline):
    def load(self, model_id: str):
        print(f"PipelineFactory: AudioStub loaded for {model_id}")
        
    def generate(self, request_data: dict, model_def: dict, storage_dir: str):
        filename = f"{uuid.uuid4()}.mp3"
        filepath = os.path.join(storage_dir, filename)
        with open(filepath, "wb") as f:
            f.write(b"fake_audio_data")
        return {"filename": filename, "seed": 0}

class PipelineFactory:
    _instances = {}
    
    @classmethod
    def get_pipeline(cls, category: str, architecture: str = None) -> BasePipeline:
        key = f"{category}_{architecture}"
        
        if key in cls._instances:
            return cls._instances[key]
            
        if category == "image":
            instance = ComfyUIPipeline()
        elif category == "video":
            instance = VideoStubPipeline()
        elif category in ["audio", "voice", "music"]:
            instance = AudioStubPipeline()
        else:
            raise ValueError(f"Unsupported pipeline category: {category}")
            
        cls._instances[key] = instance
        return instance
