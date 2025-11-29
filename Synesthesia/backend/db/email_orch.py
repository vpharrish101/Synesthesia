import sys,os
root=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.append(root)

import json
import concurrent.futures
import uuid

from datetime import datetime,timezone
from pymongo import MongoClient
from backend.agent.agent_orch import (categorize_email,action_item_extract)
from backend.utils import json_parser

DB_URL=os.getenv("MONGO_URI","mongodb://localhost:27017")
client=MongoClient(DB_URL)
db=client["RTTE"]
Emails=db["Emails"]
Composed_mails=db["Sent"]


def serialize_email(doc):
    if not doc:
        return None
    doc = dict(doc) 
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


def get_email(email_id:str):
    doc = Emails.find_one({"id": email_id})
    return serialize_email(doc)


def get_all_emails():
    docs = list(Emails.find({}))
    return [serialize_email(d) for d in docs]

def get_all_drafts():
    docs = list(Composed_mails.find({}))
    return [serialize_email(d) for d in docs]


def save_raw_email(email: dict):
    exists=Emails.find_one({"id": email["id"]})
    if exists is None:
        Emails.insert_one({
            "id": email["id"],
            "sender": email.get("sender"),
            "subject": email.get("subject"),
            "timestamp": email.get("timestamp"),
            "body": email.get("body"),
            "category": None,
            "actions": [],
            "summary": None,
            "draft_reply": None
        })


def update_email(email_id:str,updates:dict): Emails.update_one({"id": email_id},{"$set": updates})

def process_single_email(email: dict):
    try:
        email_id=email["id"]
        body=email.get("body","")

        save_raw_email(email)

        raw_cat=categorize_email(body)
        parsed_cat=json_parser.extract_json(raw_cat) or {}
        category=parsed_cat.get("category","Uncategorized")

        raw_ae=action_item_extract(body,category=category)  
        parsed_ae=json_parser.extract_json(raw_ae) or {}
        actions=parsed_ae.get("tasks",[])
        print("Email keys:", email.keys())

        update_email(
            email_id=email_id,
            updates={
                "category": category,
                "actions": actions
            }
        )

        return {"id": email_id,"category": category,"actions": actions}

    except Exception as e:
        return None


def ingest_from_json(path:str,
                     workers:int=3):
    
    if not os.path.exists(path):
        raise FileNotFoundError(f"Inbox file not found: {path}")

    with open(path,"r",encoding="utf-8") as f:
        emails=json.load(f)

    results=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
        future_map={executor.submit(process_single_email,email): email for email in emails}

        for future in concurrent.futures.as_completed(future_map):
            res=future.result()
            if res:
                results.append(res)
    print("Emails ingested")
    return results

def save_draft(sender="vincent@ncboogeyman.corpo",
               recipient="<please add recipient and send email again>",
               subject=None,
               body=None):
    
    new_id = str(uuid.uuid4())
    Composed_mails.insert_one({
        "id": new_id,
        "sender": sender,
        "recipient": recipient,
        "subject": subject,
        "body": body,
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
    })
    return {"id":new_id}

ingest_from_json(r"D:\Python311\Pets\Synesthesia\data\email_input.json")