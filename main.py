from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.health import health_router

app = FastAPI()

# Include your API routes
app.include_router(health_router)

# Serve static files (CSS, JS)
app.mount("/static", StaticFiles(directory="frontend"), name="static")

# Root → open index.html
@app.get("/")
def serve_frontend():
    return FileResponse("frontend/index.html")