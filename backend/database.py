from pymongo import MongoClient
from datetime import datetime

client = MongoClient("mongodb://localhost:27017/")
db = client["health_db"]
collection = db["records"]

def save_record(data):
    data["timestamp"] = datetime.now()
    collection.insert_one(data)
    return {"message": "Record saved"}

def get_records():
    data = list(collection.find({}, {"_id": 0}))
    return data