from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import health_router  # your existing API routes

app = FastAPI(title="HealthTwin AI")

# Enable CORS so frontend JS can call API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Mount frontend folder at root
app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")

# Include your API router
app.include_router(health_router, prefix="/health", tags=["health"])