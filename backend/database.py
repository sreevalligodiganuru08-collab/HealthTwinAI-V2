import os
from pymongo import MongoClient

MONGO_URL = os.getenv("MONGO_URL")

client = MongoClient(MONGO_URL)
db = client["healthdb"]
collection = db["records"]

def save_record(data):
    collection.insert_one(data)

def get_records():
    return list(collection.find({}, {"_id": 0}))