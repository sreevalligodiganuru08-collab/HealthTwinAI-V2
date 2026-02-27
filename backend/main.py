from fastapi import FastAPI
from backend.routes import health

app = FastAPI()

# Include routes
app.include_router(health.router)

@app.get("/")
def home():
    return {"message": "HealthTwinAI API is running"}