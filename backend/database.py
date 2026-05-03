from pymongo import MongoClient
import os

# Use environment variable if available, else local MongoDB
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/")

client = MongoClient(MONGO_URL)
db = client["healthtwin"]

users_collection = db["users"]
records_collection = db["records"]