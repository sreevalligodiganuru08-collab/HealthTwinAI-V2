from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pymongo import MongoClient
from datetime import datetime

app = FastAPI()

# ✅ CORS CONFIG (IMPORTANT)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ MongoDB Connection
client = MongoClient("mongodb+srv://healthuser:health123@cluster0.jrk94p8.mongodb.net/?appName=Cluster0")
db = client["health_db"]

users_collection = db["users"]
records_collection = db["records"]

# ===========================
# 🔐 AUTH APIs
# ===========================

@app.post("/register")
def register(user: dict):
    if users_collection.find_one({"username": user["username"]}):
        raise HTTPException(status_code=400, detail="User already exists")

    users_collection.insert_one(user)
    return {"message": "User registered successfully"}

@app.post("/login")
def login(user: dict):
    existing_user = users_collection.find_one({
        "username": user["username"],
        "password": user["password"]
    })

    if not existing_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {"message": "Login successful", "userId": user["username"]}


# ===========================
# 🏥 HEALTH APIs
# ===========================

@app.post("/save")
def save_record(record: dict):
    # ✅ Ensure userId is present
    if "userId" not in record:
        raise HTTPException(status_code=400, detail="User ID required")

    record["timestamp"] = datetime.now().isoformat()

    records_collection.insert_one(record)
    return {"message": "Record saved successfully"}

@app.get("/records/{user_id}")
def get_records(user_id: str):
    records = list(
        records_collection.find(
            {"userId": user_id},
            {"_id": 0}
        )
    )
    return records


# ===========================
# 🌐 FRONTEND SERVING
# ===========================

# ✅ Serve static files (CSS, JS)
app.mount("/static", StaticFiles(directory="../frontend"), name="static")

# ✅ Serve index.html
@app.get("/")
def serve_frontend():
    return FileResponse("../frontend/index.html")