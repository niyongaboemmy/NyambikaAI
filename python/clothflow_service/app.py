from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
import os
import base64
import uuid
import requests
from inference import generate_tryon

app = FastAPI()

# Mount static files for serving generated outputs
_outputs_dir = os.path.abspath(os.getenv("OUTPUTS_DIR", "outputs"))
os.makedirs(_outputs_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=_outputs_dir), name="static")

class TryOnRequest(BaseModel):
    person: str
    cloth: str
    # Optional tuning knobs; extend as you wire real ClothFlow
    seed: Optional[int] = 42


def ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)


def load_to_path(src: str, out_dir: str, name: str) -> str:
    ensure_dir(out_dir)
    out_path = os.path.join(out_dir, name)
    if src.startswith("http://") or src.startswith("https://"):
        r = requests.get(src, timeout=30)
        r.raise_for_status()
        with open(out_path, "wb") as f:
            f.write(r.content)
        return out_path
    # base64 or data URL
    if src.startswith("data:image"):
        src = src.split(",", 1)[1]
    with open(out_path, "wb") as f:
        f.write(base64.b64decode(src))
    return out_path


@app.post("/tryon")
def tryon(req: TryOnRequest):
    pid = uuid.uuid4().hex
    inputs_dir = os.path.abspath(os.getenv("INPUTS_DIR", "inputs"))
    outputs_dir = os.path.abspath(os.getenv("OUTPUTS_DIR", "outputs"))

    person_path = load_to_path(req.person, inputs_dir, f"{pid}_person.jpg")
    cloth_path = load_to_path(req.cloth, inputs_dir, f"{pid}_cloth.jpg")
    try:
        out_path = generate_tryon(person_path, cloth_path, outputs_dir, seed=req.seed)
    except RuntimeError as e:
        # Configuration/runtime issues (e.g., CLOTHFLOW_CMD missing) -> 400
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Unexpected errors -> 500
        raise HTTPException(status_code=500, detail="tryon failed")

    base_url = os.getenv("PUBLIC_BASE_URL", "http://localhost:8000")
    url = f"{base_url.rstrip('/')}/static/{os.path.basename(out_path)}"
    return {
        "tryOnImageUrl": url,
        "debug": {
            "person": os.path.basename(person_path),
            "cloth": os.path.basename(cloth_path)
        }
    }


@app.get("/health")
def health():
    return {"status": "ok"}
