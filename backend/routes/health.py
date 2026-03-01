from fastapi import APIRouter
from database import save_record, get_records
from model import analyze_health

health_router = APIRouter()

@health_router.get("/health")
def check_health():
    return {"status": "HealthTwin AI Running"}

@health_router.post("/save")
def save_data(record: dict):
    save_record(record)
    return {"message": "Record saved"}

@health_router.get("/records/{userId}")
def get_all_records(userId: int):
    records = get_records(userId)

    analysis = analyze_health(records)

    return {
        "records": records,
        "analysis": analysis
    }