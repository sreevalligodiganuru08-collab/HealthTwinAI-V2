from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pymongo import MongoClient
from pydantic import BaseModel
from datetime import datetime

from model import analyze_health

app = FastAPI()

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- MONGODB ----------------
client = MongoClient("mongodb://localhost:27017/")
db = client["healthtwin"]

users_collection = db["users"]
records_collection = db["records"]

# ---------------- MODELS ----------------
class User(BaseModel):
    username: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class HealthRecord(BaseModel):
    userId: str
    heart_rate: int
    spo2: int
    steps: int
    systolic_bp: int
    diastolic_bp: int


# ---------------- AUTH ----------------
@app.post("/register")
def register(user: User):
    if users_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="User already exists")

    result = users_collection.insert_one(user.dict())

    return {
        "message": "User registered successfully",
        "userId": str(result.inserted_id)
    }


@app.post("/login")
def login(req: LoginRequest):
    user = users_collection.find_one({
        "username": req.username,
        "password": req.password
    })

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {"userId": str(user["_id"])}


# ---------------- HEALTH CHECK ----------------
@app.get("/health")
def check_health():
    return {"status": "HealthTwin AI Running"}


# ---------------- SAVE RECORD ----------------
@app.post("/save")
def save_record(record: HealthRecord):
    record_dict = record.dict()
    record_dict["timestamp"] = datetime.now().isoformat()

    records_collection.insert_one(record_dict)

    return {"message": "Record saved successfully"}


# ---------------- GET RECORDS + ANALYSIS ----------------
@app.get("/records/{user_id}")
def get_records(user_id: str):

    records = list(records_collection.find(
        {"userId": user_id},
        {"_id": 0}
    ))

    analysis = analyze_health(records)

    # ✅ IMPORTANT: RETURN STRUCTURED RESPONSE
    return {
        "records": records,
        "analysis": analysis   # <-- THIS FIXES YOUR FRONTEND ISSUE
    }


# ---------------- FUTURE RISK ----------------
@app.get("/future-risk/{user_id}")
def future_risk(user_id: str):

    records = list(records_collection.find(
        {"userId": user_id},
        {"_id": 0}
    ))

    if not records:
        return {
            "message": "No data available",
            "risk": "Unknown"
        }

    warnings = []

    for r in records:
        if r.get("heart_rate", 0) > 100 or r.get("heart_rate", 0) < 50:
            warnings.append("Heart Rate")

        if r.get("spo2", 100) < 95:
            warnings.append("Oxygen Level")

        if r.get("systolic_bp", 0) > 140 or r.get("diastolic_bp", 0) > 90:
            warnings.append("Blood Pressure")

        if r.get("steps", 0) < 2000:
            warnings.append("Low Activity")

    if warnings:
        return {
            "risk": "High",
            "message": f"⚠️ Future risk detected in: {', '.join(set(warnings))}"
        }
    else:
        return {
            "risk": "Low",
            "message": "✅ Your health trends look stable"
        }


# ---------------- FRONTEND ----------------
app.mount("/static", StaticFiles(directory="../frontend"), name="static")

@app.get("/")
def serve_frontend():
    return FileResponse("../frontend/index.html")