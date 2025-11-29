import requests

OLLAMA_URL="http://localhost:11434/api/generate"
MODEL_NAME="deepseek-llm:7b-chat"

def run_llm(prompt:str,
            model:str=MODEL_NAME)->str:
    response=requests.post(
        OLLAMA_URL,
        json={"model":model,"prompt":prompt,"stream":False})    
    return response.json()["response"]

result = run_llm("Explain quantum computing in simple terms.")
print(result)
