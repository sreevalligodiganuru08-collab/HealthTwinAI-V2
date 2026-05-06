from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pymongo import MongoClient
from pydantic import BaseModel
from datetime import datetime
import os

from backend.model import analyze_health

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
MONGO_URL = os.getenv("MONGO_URL")

if not MONGO_URL:
    raise Exception("❌ MONGO_URL not set")

client = MongoClient(MONGO_URL)
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
    timestamp: str | None = None   # ✅ IMPORTANT FIX


# ---------------- AUTH ----------------
@app.post("/register")
def register(user: User):
    try:
        existing_user = users_collection.find_one({"username": user.username})
        if existing_user:
            raise HTTPException(status_code=400, detail="User already exists")

        result = users_collection.insert_one(user.dict())

        return {
            "message": "User registered successfully",
            "userId": str(result.inserted_id)
        }

    except Exception as e:
        print("REGISTER ERROR:", e)
        raise HTTPException(status_code=500, detail="Internal Server Error")


@app.post("/login")
def login(req: LoginRequest):
    try:
        user = users_collection.find_one({
            "username": req.username,
            "password": req.password
        })

        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        return {
            "userId": str(user["_id"]),
            "message": "Login successful"
        }

    except Exception as e:
        print("LOGIN ERROR:", e)
        raise HTTPException(status_code=500, detail="Internal Server Error")


# ---------------- SAVE RECORD ----------------
@app.post("/save")
def save_record(record: HealthRecord):
    try:
        record_dict = record.dict()

        # ✅ Use frontend time (REAL DEVICE TIME)
        if not record_dict.get("timestamp"):
            record_dict["timestamp"] = datetime.now().isoformat()

        records_collection.insert_one(record_dict)

        return {"message": "Record saved successfully"}

    except Exception as e:
        print("SAVE ERROR:", e)
        raise HTTPException(status_code=500, detail="Failed to save record")


# ---------------- GET RECORDS ----------------
@app.get("/records/{user_id}")
def get_records(user_id: str):
    records = list(records_collection.find(
        {"userId": user_id},
        {"_id": 0}
    ))

    analysis = analyze_health(records)

    return {
        "records": records,
        "analysis": analysis
    }


# ---------------- FRONTEND ----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "..", "frontend")

app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

@app.get("/")
def serve_frontend():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))