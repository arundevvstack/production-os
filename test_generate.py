import requests
import json
import time

url = "http://localhost:8000/generate"

payload = {
    "prompt": "A highly detailed, cinematic photograph of a glowing blue crystal floating in a dark cyberpunk city, 8k resolution, ray tracing",
    "model": "black-forest-labs/FLUX.1-schnell",
    "width": 512,
    "height": 512,
    "steps": 4,
    "cfg": 3.5
}

print(f"Sending generation request for {payload['model']}...")
start_time = time.time()
response = requests.post(url, json=payload)
duration = time.time() - start_time

if response.status_code == 200:
    data = response.json()
    print("SUCCESS! Gateway responded.")
    print(f"Duration: {duration:.2f} seconds")
    print(json.dumps(data, indent=2))
else:
    print(f"FAILED: {response.status_code}")
    print(response.text)
