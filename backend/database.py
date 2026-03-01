from pymongo import MongoClient
import os

# Use Render environment variable
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/")

client = MongoClient(MONGO_URL)
db = client["health_db"]
collection = db["records"]


def save_record(record: dict):
    """
    Save record to MongoDB
    """
    collection.insert_one(record)


def get_records():
    """
    Fetch all records
    """
    return list(collection.find({}, {"_id": 0}))