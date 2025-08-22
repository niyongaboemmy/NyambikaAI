from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app import app as api
import os
from dotenv import load_dotenv, find_dotenv

# Load env from nearest .env (walks up directories)
try:
    _env_path = find_dotenv(usecwd=True)
    if _env_path:
        load_dotenv(_env_path)
except Exception:
    # Non-fatal if dotenv is missing
    pass

app = FastAPI()

# Mount static outputs so URLs like /static/<file> work
outputs_dir = os.path.abspath(os.getenv("OUTPUTS_DIR", "outputs"))
os.makedirs(outputs_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=outputs_dir), name="static")

# Mount API under root
app.mount("/", api)
