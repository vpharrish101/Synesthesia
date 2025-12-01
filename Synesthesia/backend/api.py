import tempfile

from fastapi import FastAPI,HTTPException,UploadFile,File,Query
from pydantic import BaseModel
from backend.db import email_orch
from backend.utils import sysprompts
from backend import main_orch
from fastapi.middleware.cors import CORSMiddleware

#sys.path.insert(0,os.path.abspath(os.path.join(os.path.dirname(__file__),"..")))

main=main_orch.Main_Orch()
app=FastAPI(title="Synesthesia")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health
@app.get("/health")
def health_chk():
    return {"status":"OK","message":"Backend up and running"}


# Email stuff
@app.get("/emails")
def all_emails():
    try:
        return email_orch.get_all_emails()
    except Exception as e:
        raise HTTPException(status_code=500,detail=f"Fetch Error:{e}")


@app.get("/email/{id}")
def fetch_one_email(id:str):
    email=email_orch.get_email(id)
    if email is None:
        raise HTTPException(status_code=404,detail=f"Email {id} not found")
    return email


@app.patch("/email/{email_id}")
def change_content(email_id:str,updates:dict):
    try:
        email_orch.update_email(email_id,updates)
    except Exception as e:
        raise HTTPException(status_code=500,detail=str(e))


@app.post("/email/upload")
async def ingest_emails(file:UploadFile=File(...)):
    try:
        if file.content_type not in ["application/json"]:
            raise HTTPException(status_code=400,detail="Invalid File struct. Upload only JSON")
        data=await file.read()
        with tempfile.NamedTemporaryFile(delete=False,suffix=".json") as tmp:
            tmp.write(data)
            temp_path=tmp.name
        email_orch.ingest_from_json(temp_path)
        rag_search.build_idx() #type:ignore
        return {"Status":"200 OK"}
    except Exception as e:
        raise HTTPException(status_code=500,detail=f"Ingestion error:{e}")


# prompt stuff
@app.get("/prompts/get_all")
def get_prompts():
    return sysprompts.load_prompts()

@app.post("/prompts/change_one")
def update_prompts(data:dict):
    try:
        sysprompts.init_prompt(data)
        return {"status":"ok"}
    except Exception as e:
        raise HTTPException(status_code=500,detail=str(e))


# RAG Search
@app.get("/search")
def ragSearch_emails(q:str):
    try:
        from backend.rag import rag_search
        return rag_search.hybrid_rag(q)
    except Exception as e:
        raise HTTPException(status_code=500,detail=f"RAG search error:{e}")


# DeepSeek 7b llm Queries

@app.post("/ds7m/ask")
def ask(payload:main_orch.AskPayload):
    from backend.agent.agent_orch import orchestrator
    
    if payload.email_id:
        email=email_orch.get_email(payload.email_id)
        if not email:
            raise HTTPException(status_code=404,detail="Email not found")
        return orchestrator(email["body"],payload.question)

    if payload.all_emails:
        combined_context="\n\n".join([
            f"Subject:{e.get('subject')}\nBody:{e.get('body')}"
            for e in payload.all_emails
        ])
        return orchestrator(combined_context,payload.question)

    raise HTTPException(status_code=400,detail="No valid input provided")


@app.post("/ds7m/autodraft")
def resp_draft(email_id:str=Query(...),prompt:str=Query(...)):
    from backend.agent.agent_orch import autodraft_reply
    import json
    email=email_orch.get_email(email_id)
    if not email:
        raise HTTPException(status_code=404,detail="Email not found")
    response=autodraft_reply(email["body"],"Legit",prompt)
    if isinstance(response,str):
        response=json.loads(response)
    draft_text=f"Subject:{response.get('subject')}\n\n{response.get('body')}"
    return {"draft":draft_text}


@app.post("/ds7m/superquery")
def superquery_api(payload:main_orch.SuperQueryPayload):
    all_emails=email_orch.get_all_emails()
    from backend.agent.agent_orch import supersummarizer
    answer=supersummarizer(payload.question,all_emails)
    return {"answer":answer}


#drafts
@app.get("/drafts")
def all_drafts():
    try:
        return email_orch.get_all_drafts()
    except Exception as e:
        raise HTTPException(status_code=500,detail=f"Fetch Error:{e}")

@app.post("/drafts/add_one")
def insert_draft(recipient,subject,body):
    try:
        email_orch.save_draft(recipient=recipient,
                              subject=subject,
                              body=body)
    except Exception as e:
        raise HTTPException(status_code=500,detail=f"Draft ingestion error:{e}")
