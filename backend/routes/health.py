from fastapi import APIRouter
from pydantic import BaseModel
from model import predict_risk

router = APIRouter()

class HealthData(BaseModel):
    heart_rate: int
    steps: int
    sleep_hours: float

@router.post("/predict")
def predict(data: HealthData):
    result = predict_risk(data.heart_rate, data.steps, data.sleep_hours)
    return {"risk_level": result}