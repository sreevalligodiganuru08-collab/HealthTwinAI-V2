from fastapi import APIRouter
from backend.database import save_record, get_records
from backend.model import analyze_health

router = APIRouter(prefix="/health", tags=["Health"])

@router.post("/add")
def add_data(data: dict):
    return save_record(data)

@router.get("/all")
def get_all():
    return get_records()

@router.get("/analyze")
def analyze():
    records = get_records()
    return analyze_health(records)