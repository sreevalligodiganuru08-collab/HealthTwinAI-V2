from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime

app = FastAPI()

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # replace "*" with your frontend URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory database
records = []

class HealthData(BaseModel):
    heart_rate: int
    oxygen_level: int
    steps: int
    blood_pressure: str

# Root route
@app.get("/")
def read_root():
    return {"message": "Welcome to HealthTwinAI!"}

# Health endpoints
@app.get("/health")
def get_health():
    return records

@app.post("/health")
def add_health(record: HealthData):
    data = record.dict()
    data["timestamp"] = datetime.now().isoformat()
    records.append(data)
    return {"message": "Record added"}

@app.post("/predict")
def predict():
    if not records:
        return {"prediction": "No data available"}
    last = records[-1]
    # Simple mock logic
    status = "Good" if int(last['heart_rate']) < 100 else "Needs Attention"
    return {"prediction": status}