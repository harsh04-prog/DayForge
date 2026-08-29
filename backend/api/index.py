import sys
from pathlib import Path

# Add backend directory to sys.path so 'app' imports resolve cleanly on Vercel
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app

# Expose app and handler for Vercel Python runtime
handler = app
