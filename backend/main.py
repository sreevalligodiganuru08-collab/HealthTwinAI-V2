from fastapi import FastAPI
from backend.routes.health import health_router  # must match the router name in health.py

app = FastAPI(title="HealthTwinAI Backend")

# Include all routers
app.include_router(health_router)

# Optional: root endpoint
@app.get("/")
def root():
    return {"message": "Welcome to HealthTwinAI Backend!"}