import json

def extract_json(text: str):
    try:
        start=text.index("{")
        end=text.rindex("}")+1
        json_str=text[start:end]
        return json.loads(json_str)

    except Exception:
        return {
            "error": "Invalid JSON",
            "raw_output": text
        }
