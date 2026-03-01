from fastapi import FastAPI
from backend.routes.health import health_router

app = FastAPI(title="HealthTwinAI Backend")

# include router
app.include_router(health_router)

@app.get("/")
def root():
    return {"message": "HealthTwinAI Backend Running Successfully 🚀"}