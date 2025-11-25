import sys, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.append(ROOT)

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import utils.llm_cfg as llm_cfg
import utils.sysprompts as sysprompts

from utils import json_parser
from utils.logging_cfg import logger


def safe_llm_call(prompt: str, context: str = ""): 
    try:
        logger.debug(f"[SAFE LLM CALL] Context={context}, PromptHead={prompt[:200]!r}")
        result = llm_cfg.run_llm(prompt)
        logger.debug(f"[SAFE LLM RESULT] Context={context}, ResultHead={result[:200]!r}")
        return result

    except Exception as e:
        logger.error(f"[LLM ERROR] Context={context} | Error: {str(e)}", exc_info=True)
        return f"ERROR: LLM failure during {context}. Please retry."


def categorize_email(email_body: str):
    logger.info("categorize_email() called")

    try:
        prompts = sysprompts.load_prompts()
        base_prompt = prompts.get("ag_categorization")
        if not base_prompt:
            raise ValueError("Missing ag_categorization prompt.")

        prompt = f"""
{base_prompt}

EMAIL:
{email_body}

Output JSON only:
{{"category":"<value>"}}"""

        return safe_llm_call(prompt, context="categorization")

    except Exception as e:
        logger.error(f"[ERROR] categorize_email failed: {e}", exc_info=True)
        return '{"category": "Unknown"}'


def action_item_extract(email_body: str, category: str):
    logger.info(f"action_item_extract() called for category={category}")

    try:
        if category and "spam" in category.lower():
            logger.info("Email classified as spam → returning no tasks")
            return '{"tasks": []}'

        prompts = sysprompts.load_prompts()
        base_prompt = prompts.get("ag_action_item")
        if not base_prompt:
            raise ValueError("Missing ag_action_item prompt.")

        prompt = f"""
{base_prompt}

EMAIL: 
{email_body}

Return JSON only:
{{
    "tasks": [
        {{"task": "...", "deadline": "..."}}
    ]
}}
"""
        return safe_llm_call(prompt, context="action_item")

    except Exception as e:
        logger.error(f"[ERROR] action_item_extract failed: {e}", exc_info=True)
        return '{"tasks": []}'


def autodraft_reply(email_body: str, category: str,prel_prompt=None):
    logger.info(f"autodraft_reply() called for category={category}")

    try:
        if category and "spam" in category.lower():
            return '{"subject": null, "body": null}'

        prompts = sysprompts.load_prompts()
        base_prompt = prompts.get("ag_autodraft_reply")
        if not base_prompt:
            raise ValueError("Missing ag_autodraft_reply prompt.")
        
        if prel_prompt is not None:
            prompt = f"""
{base_prompt}

EMAIL:
{email_body}

PROMPT: 
{prel_prompt}

Return JSON only:
{{
  "subject": "<string>",
  "body": "<string>"
}}"""
            return safe_llm_call(prompt, context="autoreply")
        
        else:
            prompt = f"""
{base_prompt}

EMAIL:
{email_body}

Return JSON only:
{{
  "subject": "<string>",
  "body": "<string>"
}}"""

        return safe_llm_call(prompt, context="autoreply")
 
    except Exception as e:
        logger.error(f"[ERROR] autodraft_reply failed: {e}", exc_info=True)
        return '{"subject": null, "body": null}'


def summary(email_body: str, category: str):
    logger.info(f"summary() called for category={category}")

    try:
        if category and "spam" in category.lower():
            return "This message is identified as Spam."

        prompts = sysprompts.load_prompts()
        base_prompt = prompts.get("ag_summary")
        if not base_prompt:
            raise ValueError("Missing ag_summary prompt.")

        prompt = f"""
PROMPT:
{base_prompt}

EMAIL:
{email_body}

Return plaintext only
"""
        return safe_llm_call(prompt, context="summary")

    except Exception as e:
        logger.error(f"[ERROR] summary() failed: {e}", exc_info=True)
        return "Summary unavailable due to system error."
def supersummarizer(user_question: str, all_emails: list):
   

    logger.info("supersummarizer() called")

    try:
        prompts = sysprompts.load_prompts()
        base_prompt = prompts.get("ag_superquery")

        if not base_prompt:
            raise ValueError("Missing ag_superquery prompt.")

        # Build unified inbox context (20 raw emails)
        inbox_text = ""
        for e in all_emails:
            inbox_text += f"""
----- EMAIL START -----
Sender: {e.get('sender')}
Subject: {e.get('subject')}
Category: {e.get('category')}
Body:
{e.get('body')}
----- EMAIL END -----
"""

        # Compose final LLM prompt
        final_prompt = f"""
{base_prompt}

USER QUESTION:
{user_question}

INBOX DATA:
{inbox_text}

Return plaintext only.
"""

        return safe_llm_call(final_prompt, context="superquery")

    except Exception as e:
        logger.error(f"[ERROR] supersummarizer failed: {e}", exc_info=True)
        return "Superquery unavailable due to system error."

def orchestrator(email_body: str,
                 user_question: str,
                 use_rag: bool = False,
                 history: list | None = None):

    logger.info("orchestrator() triggered")
    logger.info(f"User question: {user_question}")

    try:
        prompts = sysprompts.load_prompts()

        raw_cat = categorize_email(email_body)
        cat_json = json_parser.extract_json(raw_cat) or {}
        category_str = cat_json.get("category", "General")
        logger.info(f"Detected category: {category_str}")

        if "spam" in category_str.lower():
            return {
                "intent": "spam_blocked",
                "raw": "This email is categorized as Spam. No further actions available.",
                "json": None
            }

        intent_prompt = prompts.get("sys_intent")
        if not intent_prompt:
            raise ValueError("Missing sys_intent prompt.")

        intent_query = f"""
### SYSTEM:
{intent_prompt}

### USER QUESTION:
{user_question}
"""

        intent_raw = safe_llm_call(intent_query, context="intent_classification")
        intent_json = json_parser.extract_json(intent_raw)
        intent = intent_json.get("intent", "general")

        logger.info(f"Detected intent = {intent}")

        if intent == "categorization":
            return {"intent": "categorization", "raw": raw_cat, "json": cat_json}

        elif intent == "action_item":
            raw = action_item_extract(email_body, category_str)
            return {"intent": "action_item", "raw": raw, "json": json_parser.extract_json(raw)}

        elif intent == "autoreply":
            raw = autodraft_reply(email_body, category_str)
            return {"intent": "autoreply", "raw": raw, "json": json_parser.extract_json(raw)}

        elif intent == "summary":
            raw = summary(email_body, category_str)
            return {"intent": "summary", "raw": raw, "json": None}

        elif intent == "rag":
            try:
                from backend.rag import rag_search
                results = rag_search.hybrid_rag(user_question)
                return {"intent": "rag", "results": results}
            except Exception as e:
                logger.error(f"[ERROR] RAG search failed: {e}", exc_info=True)
                return {"intent": "rag", "results": [], "error": "RAG search failed"}

        elif intent == "general":
            sys_instr = prompts.get("ag_general")
            if not sys_instr:
                raise ValueError("Missing ag_general prompt.")

            context_block = f"EMAIL CONTENT:\n{email_body}\n\n"

            if history:
                context_block += "CHAT HISTORY:\n"
                for msg in history:
                    context_block += f"{msg['role'].upper()}: {msg['content']}\n"

            final_prompt = f"""
### SYSTEM:
{sys_instr}

### CONTEXT:
{context_block}

### USER:
{user_question}

### RULES:
- Use ONLY the provided email content.
- If the user requests JSON, output JSON.
- Otherwise output plain text.
"""

            raw = safe_llm_call(final_prompt, context="general_response")
            return {"intent": "general", "raw": raw, "json": None}

        else:
            logger.error(f"Unknown intent returned by LLM: {intent}")
            return {"intent": "unknown", "raw": "Unknown intent.", "json": None}

    except Exception as e:
        logger.critical(f"[FATAL ERROR] orchestrator crashed: {e}", exc_info=True)
        return {
            "intent": "error",
            "raw": "A system error occurred while processing your request.",
            "json": None
        }

