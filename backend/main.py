from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from model import predict_health

app = FastAPI()

# ✅ CORS FIX (IMPORTANT)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "HealthTwinAI Running"}

@app.post("/predict")
def predict(data: dict):
    result = predict_health(data)
    return {"prediction": result}