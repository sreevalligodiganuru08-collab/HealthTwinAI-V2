from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from routes.health import health_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ✅ ADD THIS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all (for now)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include your API routes
app.include_router(health_router)

# Serve static files (CSS, JS)
app.mount("/static", StaticFiles(directory="../frontend"), name="static")

# Root → open index.html
@app.get("/")
def serve_frontend():
    return FileResponse("../frontend/index.html")