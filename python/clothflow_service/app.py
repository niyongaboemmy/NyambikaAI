from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
import os
import base64
import uuid
import requests
from inference import generate_tryon

# Load environment variables from project root .env if present
def _load_dotenv_like():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.abspath(os.path.join(base_dir, "..", "..", ".env")),  # project root
        os.path.abspath(os.path.join(base_dir, ".env")),                  # local .env
        os.path.abspath(os.path.join(os.getcwd(), ".env")),               # CWD .env
    ]
    for p in candidates:
        try:
            if os.path.exists(p):
                with open(p, "r") as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith("#"):
                            continue
                        if "=" not in line:
                            continue
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip('"').strip("'")
                        # don't override already-set envs
                        if k and k not in os.environ:
                            os.environ[k] = v
        except Exception:
            pass

_load_dotenv_like()

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
    # Sizing/placement controls (all optional)
    scale: Optional[float] = None  # CF_CLOTH_SCALE
    allowUpscale: Optional[bool] = None  # CF_ALLOW_UPSCALE
    faceAnchor: Optional[bool] = None  # CF_FACE_ANCHOR
    faceWidthMult: Optional[float] = None  # CF_FACE_WIDTH_MULT
    faceOffsetY: Optional[int] = None  # CF_FACE_OFFSET_Y
    posX: Optional[float] = None  # CF_POS_X
    posY: Optional[float] = None  # CF_POS_Y
    offsetX: Optional[int] = None  # CF_OFFSET_X
    offsetY: Optional[int] = None  # CF_OFFSET_Y
    # Body fallback sizing
    bodyWidthMult: Optional[float] = None  # CF_BODY_WIDTH_MULT
    bodyOffsetYFrac: Optional[float] = None  # CF_BODY_OFFSET_Y_FRAC


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
    # Apply per-request environment overrides for sizing/placement
    def _set_env(name: str, val):
        if val is None:
            return
        os.environ[name] = str(val)

    _set_env("CF_CLOTH_SCALE", req.scale)
    _set_env("CF_ALLOW_UPSCALE", req.allowUpscale)
    _set_env("CF_FACE_ANCHOR", req.faceAnchor)
    _set_env("CF_FACE_WIDTH_MULT", req.faceWidthMult)
    _set_env("CF_FACE_OFFSET_Y", req.faceOffsetY)
    _set_env("CF_POS_X", req.posX)
    _set_env("CF_POS_Y", req.posY)
    _set_env("CF_OFFSET_X", req.offsetX)
    _set_env("CF_OFFSET_Y", req.offsetY)
    _set_env("CF_BODY_WIDTH_MULT", req.bodyWidthMult)
    _set_env("CF_BODY_OFFSET_Y_FRAC", req.bodyOffsetYFrac)

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
