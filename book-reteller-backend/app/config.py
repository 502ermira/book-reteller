from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings:
    UPLOAD_DIR = BASE_DIR / "input"
    OUTPUT_DIR = BASE_DIR / "output"

settings = Settings()