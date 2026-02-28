from pymongo import MongoClient
from datetime import datetime

client = MongoClient("mongodb://localhost:27017/")
db = client["health_db"]
collection = db["records"]

# Simple in-memory database placeholder
# Replace with MongoDB logic if needed

records = []

def save_record(record: dict):
    """
    Save a record to the in-memory database.
    If you have MongoDB, replace this logic with insertion.
    """
    records.append(record)

def get_records():
    """
    Return all saved records.
    If using MongoDB, replace this with a find query.
    """
    return records