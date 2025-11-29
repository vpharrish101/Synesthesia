import os
import pickle
import io
import numpy as np

from pymongo import MongoClient
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from scipy import sparse
from backend.db import mailstore
from chromadb import PersistentClient


VectorDB=os.path.join(os.path.dirname(__file__),"rag_store")
Parent_dir=os.path.join(os.path.dirname(__file__),"..","rag_store")

CHROMA_DIR=os.path.join(VectorDB,"chromadb")
TFIDF_VECT=os.path.join(VectorDB,"vectorizer.joblib")
TFIDF_MAT=os.path.join(VectorDB,"matrix.npz")
TFIDF_IDS=os.path.join(VectorDB,"ids.json")

client=PersistentClient(path=VectorDB)
email_idx=client.get_or_create_collection("email_index")

_embed_model=SentenceTransformer("all-MiniLM-L6-v2")

DB_URL=os.getenv("MONGO_URI","mongodb://localhost:27017")
client=MongoClient(DB_URL)
db=client["RTTE"]
RAG=db["RAG_Vectors"]

def build_idx():
    emails=mailstore.get_all_emails()
    if not emails: return False 

    ids=[e["id"] for e in emails]
    docs=[e.get("body","") for e in emails]


    syn_vector=TfidfVectorizer(stop_words="english",max_features=20000)
    syn_matrix=syn_vector.fit_transform(docs)
    
    vec_BLOB=pickle.dumps(syn_vector)

    matrix_buffer=io.BytesIO()
    sparse.save_npz(matrix_buffer,syn_matrix)
    matrix_bytes=matrix_buffer.getvalue()
    sem_emb=_embed_model.encode(docs,convert_to_numpy=True)

    emb_list=[
        {"email_id": eid, "embedding": emb.tolist()}
        for eid,emb in zip(ids,sem_emb)
    ]
    RAG.replace_one(
        {"_id": "rag_store"},
        {
            "_id": "rag_store",
            "vectorizer": vec_BLOB,
            "matrix": matrix_bytes,
            "ids": ids,
            "embeddings": emb_list,
        },
        upsert=True)
    
    return True


def clean_email(doc):
    if "_id" in doc:
        doc["_id"]=str(doc["_id"])
    return doc


def hybrid_rag(query:str, 
               top_k=3, 
               semantic_wt=0.75, 
               lexical_wt=0.25):

    meta=RAG.find_one({"_id":"rag_store"})
    if not meta: return []
    
    syn_vec=pickle.loads(meta["vectorizer"])

    buf=io.BytesIO(meta["matrix"])
    syn_matrix=sparse.load_npz(buf)

    ids=meta["ids"]

    emb_map={
        e["email_id"]:np.array(e["embedding"])
        for e in meta["embeddings"]
        }

    q_emb=_embed_model.encode([query],convert_to_numpy=True)[0]
    sem_scores={
        eid: float(np.dot(q_emb,emb)/(np.linalg.norm(q_emb)*np.linalg.norm(emb)))
        for eid, emb in emb_map.items()}
    q_vec=syn_vec.transform([query])
    lex_sim=cosine_similarity(q_vec,syn_matrix).flatten()
    lex_scores={ids[i]:float(lex_sim[i]) for i in range(len(ids))}
    final={
        eid: semantic_wt*sem_scores.get(eid,0.0)+lexical_wt*lex_scores.get(eid,0.0)
        for eid in set(ids)}

    ranked=sorted(final.items(),key=lambda x:x[1],reverse=True)[:top_k]
    ranked_ids=[eid for eid,score in ranked]
    email_map={e["id"]:e for e in mailstore.get_all_emails()}
    return [clean_email(email_map[eid]) for eid in ranked_ids if eid in email_map]

#build_idx()
