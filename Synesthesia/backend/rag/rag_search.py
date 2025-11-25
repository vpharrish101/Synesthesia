import os
import json
import joblib

from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from scipy import sparse
from backend.db import mailstore
from chromadb import PersistentClient


VectorDB=os.path.join(os.path.dirname(__file__),"rag_store")
Parent_dir=os.path.join(os.path.dirname(__file__), "..","rag_store")

CHROMA_DIR=os.path.join(VectorDB,"chromadb")
TFIDF_VECT=os.path.join(VectorDB,"vectorizer.joblib")
TFIDF_MAT=os.path.join(VectorDB,"matrix.npz")
TFIDF_IDS=os.path.join(VectorDB,"ids.json")

client=PersistentClient(path=VectorDB)
email_idx=client.get_or_create_collection("email_index")

_embed_model=SentenceTransformer("all-MiniLM-L6-v2")

def build_idx():
    emails=mailstore.get_all_emails()
    if not emails: return False 

    ids=[e["id"] for e in emails]
    docs=[e.get("body","") for e in emails]


    syn_vector=TfidfVectorizer(stop_words="english",max_features=20000)
    syn_matrix=syn_vector.fit_transform(docs)
    
    joblib.dump(syn_vector,TFIDF_VECT)
    sparse.save_npz(TFIDF_MAT,syn_matrix)
    with open(TFIDF_IDS,"w") as f: json.dump(ids,f)


    sem_emb=_embed_model.encode(docs,convert_to_numpy=True)
    email_idx.upsert(documents=docs,ids=ids,embeddings=sem_emb.tolist())
    print("done xoxo")
    return True


def clean_email(doc):
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

def hybrid_rag(query:str, 
               top_k:int=5, 
               semantic_wt:float=0.8, 
               lexical_wt:float=0.2, 
               score_threshold:float=0.0):
    
    if not (os.path.exists(TFIDF_VECT) and os.path.exists(TFIDF_MAT)): return []

    syn_vec=joblib.load(TFIDF_VECT)
    syn_matrix=sparse.load_npz(TFIDF_MAT)
    with open(TFIDF_IDS,"r") as f:ids=json.load(f)

    q_emb=_embed_model.encode([query],convert_to_numpy=True)[0].tolist()
    sem_res=email_idx.query(query_embeddings=[q_emb],n_results=top_k,include=["distances"])
    sem_scores={
        eid:max(0.0,1.0-dist) for eid, dist in zip(sem_res["ids"][0], sem_res["distances"][0] if sem_res["distances"] else [])
        }

    q_vec=syn_vec.transform([query])
    lex_sim=cosine_similarity(q_vec,syn_matrix).flatten()
    lex_scores={ids[i]: float(lex_sim[i]) for i in range(len(ids))}

    lex_top=dict(sorted(lex_scores.items(),key=lambda x: x[1],reverse=True)[:top_k*2])
    candidates=set(sem_scores.keys())|set(lex_top.keys())

    final_scores={}
    for cid in candidates:
        s=sem_scores.get(cid,0.0)
        l=lex_scores.get(cid,0.0)
        final_scores[cid]=(semantic_wt*s)+(lexical_wt*l)

    filtered={cid: score for cid, score in final_scores.items() if score>=score_threshold}
    ranked_ids=[cid for cid,_ in sorted(filtered.items(),key=lambda x:x[1],reverse=True)[:top_k]]
    email_map={e["id"]: e for e in mailstore.get_all_emails()}
    print("RAG done xoxo")
    return [clean_email(email_map[rid]) for rid in ranked_ids if rid in email_map]