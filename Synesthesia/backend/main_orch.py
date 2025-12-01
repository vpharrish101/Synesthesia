from backend.utils import sysprompts
from pydantic import BaseModel

class Main_Orch:
    def __init__(self):
        sysprompts.init_prompt(sysprompts.prompts)

class AskPayload(BaseModel):
    email_id:str
    question:str
    all_emails: list | None = None

class SuperQueryPayload(BaseModel):
    question: str

class AutoDraftPayload(BaseModel):
    email_id:str
    prompt:str
