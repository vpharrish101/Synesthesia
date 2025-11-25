from backend.utils import sysprompts
from backend.db import email_orch
from backend.rag import rag_search

class Main_Orch:
    def __init__(self):
        sysprompts.init_prompt(sysprompts.prompts)
        email_orch.ingest_from_json(r"D:\Python311\Pets\Synesthesia\data\email_input.json")
        rag_search.build_idx()
