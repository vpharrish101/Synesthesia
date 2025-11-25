from pymongo import MongoClient
import os

DB_URL=os.getenv("MONGO_URI","mongodb://localhost:27017")
client=MongoClient(DB_URL)
db=client["email_agent"]
Emails=db["Emails"]

def get_all_emails():
    return list(Emails.find({}))
