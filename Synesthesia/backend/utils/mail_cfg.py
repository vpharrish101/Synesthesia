import os

from pymongo import MongoClient

DB_URL=os.getenv("MONGO_URI","mongodb://localhost:27017")
client=MongoClient(DB_URL)
db=client["email_agent"]

Emails=db["Emails"]

def save_email(email_data:dict):
    existing=Emails.find_one({"id":email_data["id"]})
    if existing is None:
        Emails.insert_one(email_data)
    else:
        None

def retrieveAll_email(): 
    return list(Emails.find({}))

def get_email(email_id:str)->dict|None: 
    return Emails.find_one({"id": email_id})

def update_email(email_id:str, 
                 updates:dict):
    Emails.update_one(
        {"id": email_id},
        {"$set": updates}
    )
