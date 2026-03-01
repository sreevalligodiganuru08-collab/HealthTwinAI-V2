from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.routes.health import health_router

app = FastAPI(title="HealthTwinAI Backend")

# Include API routes
app.include_router(health_router)

# Serve frontend files
app.mount("/static", StaticFiles(directory="frontend"), name="static")

# Serve index.html at root
@app.get("/")
def serve_frontend():
    return FileResponse("frontend/index.html")