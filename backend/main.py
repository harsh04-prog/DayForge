import os
import sys
from pathlib import Path

# Add backend directory to python path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app, lifespan

# Expose app and handler for Vercel serverless / ASGI deployment
handler = app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=int(os.getenv("PORT", 5050)), reload=True)
