import sys,os

from fastapi import FastAPI,HTTPException
from pydantic import BaseModel
from backend.db import email_orch
from backend.utils import sysprompts
from backend import main_orch
sys.path.insert(0,os.path.abspath(os.path.join(os.path.dirname(__file__),"..")))

main=main_orch.Main_Orch()
app=FastAPI(title="Synesthesia")


class AskPayload(BaseModel):
    email_id:str
    question:str
    all_emails: list | None = None


@app.get("/health")
def health_chk():
    return{
        "status":"OK",
        "message":"Backend up and running"
    }



@app.get("/all_emails")
def all_emails():
    try:
        return email_orch.get_all_emails()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Fetch Error: {e}"
        )
    
@app.get("/email")
def fetch_one_email(id:str):
    email=email_orch.get_email(id)
    if email is None: raise HTTPException(status_code=404,detail=f"Email {id} not found")
    return email["body"]

@app.post("/email")
def change_content(email_id:str,updates:dict):
    try:
        email_orch.update_email(email_id,updates)
    except Exception as e:
        raise HTTPException(status_code=500,detail=str(e))



@app.get("/prompts")
def get_prompts():
    return sysprompts.load_prompts()

@app.post("/prompts")
def update_prompts(data:dict):
    try:
        sysprompts.init_prompt(data)
        return {"status":"ok"}
    except Exception as e:
        raise HTTPException(status_code=500,detail=str(e))



@app.get("/search")
def ragSearch_emails(q:str):
    try:
        from backend.rag import rag_search
        return rag_search.hybrid_rag(q)
    except Exception as e:
        raise HTTPException(status_code=500,detail=f"RAG search error: {e}")



@app.post("/ask")
def ask(payload: AskPayload):
    from backend.agent.agent_orch import orchestrator

    # CASE 1 — Query about a specific email
    if payload.email_id:
        email = email_orch.get_email(payload.email_id)
        if not email:
            raise HTTPException(status_code=404, detail="Email not found")
        return orchestrator(email["body"], payload.question)

    # CASE 2 — Query across ALL emails
    if payload.all_emails:
        combined_context = "\n\n".join([
            f"Subject: {e.get('subject')}\nBody: {e.get('body')}"
            for e in payload.all_emails
        ])
        return orchestrator(combined_context, payload.question)

    raise HTTPException(status_code=400, detail="No valid input provided")



@app.post("/agent")
def resp_draft(email_id:str,prompt:str):  #contains message id and prompt 
    try:
        from backend.agent.agent_orch import autodraft_reply
        email=email_orch.get_email(email_id)

        if email is None: raise ValueError(f"Email body missing for ID '{email_id}'")

        response=autodraft_reply(email["body"],"Legit",prompt)
        return response
    
    except Exception as e:
        raise HTTPException(status_code=500,detail=f"Draft agent error: {e}")
        



class SuperQueryPayload(BaseModel):
    question: str

@app.post("/superquery")
def superquery_api(payload: SuperQueryPayload):
    all_emails = email_orch.get_all_emails()
    from backend.agent.agent_orch import supersummarizer
    answer = supersummarizer(payload.question, all_emails)
    return {"answer": answer}


