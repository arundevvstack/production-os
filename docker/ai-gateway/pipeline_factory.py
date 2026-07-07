import os
import torch
import time
from abc import ABC, abstractmethod

class BasePipeline(ABC):
    @abstractmethod
    def load(self, model_id: str):
        pass
        
    @abstractmethod
    def generate(self, request_data: dict, model_def: dict, storage_dir: str):
        pass

class DiffusersPipeline(BasePipeline):
    def __init__(self):
        self.pipe = None
        self.model_id = None
        
    def load(self, model_id: str):
        if self.model_id == model_id and self.pipe is not None:
            return
            
        print(f"PipelineFactory: Loading DiffusersPipeline for {model_id}...")
        if self.pipe is not None:
            del self.pipe
            torch.cuda.empty_cache()
            
        from diffusers import DiffusionPipeline
        if os.path.exists(model_id) and model_id.endswith('.safetensors'):
            self.pipe = DiffusionPipeline.from_single_file(
                model_id,
                torch_dtype=torch.bfloat16
            )
        else:
            self.pipe = DiffusionPipeline.from_pretrained(
                model_id,
                torch_dtype=torch.bfloat16,
                safety_checker=None,
                use_safetensors=True
            )
        self.pipe.enable_model_cpu_offload()
        self.model_id = model_id
        
    def generate(self, request_data: dict, model_def: dict, storage_dir: str):
        import uuid
        prompt = request_data.get('prompt')
        seed = request_data.get('seed')
        if seed is None:
            seed = int(torch.randint(0, 1000000, (1,)).item())
            
        generator = torch.Generator(device="cuda" if torch.cuda.is_available() else "cpu").manual_seed(seed)
        
        image = self.pipe(
            prompt,
            height=request_data.get('height', 1024),
            width=request_data.get('width', 1024),
            guidance_scale=request_data.get('cfg', 3.5),
            num_inference_steps=request_data.get('steps', 4),
            generator=generator
        ).images[0]
        
        filename = f"{uuid.uuid4()}.png"
        filepath = os.path.join(storage_dir, filename)
        image.save(filepath, format="PNG")
        
        return {
            "filename": filename,
            "seed": seed
        }

class VideoStubPipeline(BasePipeline):
    def load(self, model_id: str):
        print(f"PipelineFactory: VideoStub loaded for {model_id}")
    
    def generate(self, request_data: dict, model_def: dict, storage_dir: str):
        import uuid
        filename = f"{uuid.uuid4()}.mp4"
        filepath = os.path.join(storage_dir, filename)
        with open(filepath, "wb") as f:
            f.write(b"fake_video_data")
        return {"filename": filename, "seed": 0}

class AudioStubPipeline(BasePipeline):
    def load(self, model_id: str):
        print(f"PipelineFactory: AudioStub loaded for {model_id}")
        
    def generate(self, request_data: dict, model_def: dict, storage_dir: str):
        import uuid
        filename = f"{uuid.uuid4()}.mp3"
        filepath = os.path.join(storage_dir, filename)
        with open(filepath, "wb") as f:
            f.write(b"fake_audio_data")
        return {"filename": filename, "seed": 0}

class PipelineFactory:
    _instances = {}
    
    @classmethod
    def get_pipeline(cls, category: str, architecture: str = None) -> BasePipeline:
        # Determine backend based on metadata
        key = f"{category}_{architecture}"
        
        if key in cls._instances:
            return cls._instances[key]
            
        if category == "image":
            # For MVP, assuming diffusers architecture
            instance = DiffusersPipeline()
        elif category == "video":
            instance = VideoStubPipeline()
        elif category in ["audio", "voice", "music"]:
            instance = AudioStubPipeline()
        else:
            raise ValueError(f"Unsupported pipeline category: {category}")
            
        cls._instances[key] = instance
        return instance
