from fastapi import APIRouter
from database import save_record, get_records

health_router = APIRouter()

@health_router.get("/health")
def check_health():
    return {"status": "ok"}

@health_router.post("/save")
def save_data(record: dict):
    save_record(record)
    return {"message": "Record saved"}

@health_router.get("/records")
def get_all_records():
    records = get_records()
    return {"records": records}