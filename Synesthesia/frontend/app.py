import sys
import os
import requests
import json
import streamlit as st
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__),'..')))

from backend.db import email_orch

BACKEND_URL=os.getenv("BACKEND_URL","http://localhost:8000")

st.set_page_config(page_title="Synesthesia",page_icon="🌌",layout="wide")

def safe_post(path,params=None,json_body=None):
    url=f"{BACKEND_URL.rstrip('/')}/{path.lstrip('/')}"
    try:
        r=requests.post(url,params=params,json=json_body,timeout=10)
        r.raise_for_status()
        return r
    except Exception as e:
        st.error(f"POST error: {e}")
        raise

def safe_get(path,params=None):
    url=f"{BACKEND_URL.rstrip('/')}/{path.lstrip('/')}"
    try:
        r=requests.get(url,params=params,timeout=10)
        r.raise_for_status()
        return r
    except Exception as e:
        st.error(f"GET error: {e}")
        raise

def parse_json(raw):
    if raw is None:
        return {}
    if isinstance(raw,dict):
        return raw
    try:
        obj=json.loads(raw)
    except:
        return {}

    if isinstance(obj,str):
        try:
            return json.loads(obj)
        except:
            return {}
    return obj


st.session_state.setdefault("messages",[])
st.session_state.setdefault("selected_email",None)
st.session_state.setdefault("draft_mode",False)
st.session_state.setdefault("open_chat",False)
st.session_state.setdefault("_draft_subject","")
st.session_state.setdefault("_draft_body","")


with st.sidebar:
    st.title("🌌 Synesthesia")
    page=st.radio("Navigation", ["Dashboard", "Settings"])
    st.markdown("---")
    if st.button("💬 Chat Assistant"):
        st.session_state.open_chat=not st.session_state.open_chat


if st.session_state.open_chat:
    with st.expander("Synesthesia Assistant",expanded=True):
        for msg in st.session_state.messages:
            st.write(f"**{msg['role']}:** {msg['content']}")
        user_query=st.text_input("Ask something...", key="chat_input")
        if st.button("Send Query"):
            st.session_state.messages.append({"role": "user", "content": user_query})
            if st.session_state.selected_email:
                email_id=st.session_state.selected_email["id"]
                resp=safe_post("/ask", json_body={
                    "email_id": email_id,
                    "question": user_query
                })
                try:
                    answer=resp.json()
                except:
                    answer=resp.text
            else:
                resp=safe_post("/superquery",json_body={"question": user_query})
                try:
                    data=resp.json()
                    answer=data.get("answer","No answer returned.")
                except:
                    answer=resp.text
            st.session_state.messages.append({"role": "assistant", "content": str(answer)})
            st.rerun()


if page=="Dashboard":
    st.title("Dashboard")
    try:
        emails=email_orch.get_all_emails() if email_orch else safe_get("/all_emails").json()
    except:
        emails=[]
    c1,c2,c3,c4=st.columns([1,1,1,2])
    c1.metric("Total",len(emails))
    c2.metric("Uncategorized",len([e for e in emails if e.get("category")=="Uncategorized"]))# type: ignore #
    c3.metric("Action Items",sum(len(e.get("actions") or []) for e in emails))# type: ignore #
    with c4:
        search=st.text_input("Search emails...")
        st.markdown("### 🔍 Semantic RAG Search")

        rag_query = st.text_input("Enter a semantic search query...", key="rag_query")

        if st.button("RAG Search"):
            if not rag_query.strip():
                st.warning("Enter a query for RAG search.")
            else:
                try:
                    rag_results = safe_get("/search", params={"q": rag_query}).json()
                except Exception as e:
                    st.error(f"Search error: {e}")
                    rag_results = []

                # Show top 3 RAG hits
                st.markdown("---")
                st.subheader("Top 3 RAG Matches")

                top3 = rag_results[:3] if isinstance(rag_results, list) else []

                if not top3:
                    st.info("No results.")
                else:
                    for idx, e in enumerate(top3):
                        with st.container():
                            st.markdown(f"#### {idx+1}. {e.get('subject','No Subject')}")
                            st.caption(f"From: {e.get('sender','Unknown')} | Date: {e.get('timestamp','Unknown')}")
                            st.write((e.get('body','')[:200] + "..."))
                            
                            # Button for selecting the email
                            if st.button(f"Open Email {idx+1}", key=f"rag_open_{idx}"):
                                st.session_state.selected_email = e
                                st.rerun()

                st.markdown("---")


    if search:
        search_l=search.lower()
        filtered=[
            e for e in emails
            if search_l in (e.get("subject","")+e.get("sender","")+e.get("body","")).lower()# type: ignore #
        ]
    else:
        filtered=emails

    st.markdown("---")

    if st.button("✍️ Compose Draft"):
        st.session_state.draft_mode=True
        st.session_state["_draft_subject"]=""
        st.session_state["_draft_body"]=""

    if st.session_state.draft_mode:
        st.subheader("New Draft")
        choices={f"{e.get('sender','Unknown')} — {e.get('subject','No Subject')}": e for e in emails}# type: ignore #
        labels=["Select..."]+list(choices.keys())
        selected_label=st.selectbox("Reply to:", labels,key="draft_email_sel")
        if selected_label != "Select...":
            st.session_state.selected_email=choices[selected_label]
        email_sel=st.session_state.selected_email
        st.text_input("To", value=email_sel.get("sender") if email_sel else "", key="draft_to")
        subj_default=st.session_state["_draft_subject"] or (
            f"Re: {email_sel.get('subject')}" if email_sel else ""
        )
        subject_value=st.text_input("Subject", value=subj_default)
        if subject_value != st.session_state["_draft_subject"]:
            st.session_state["_draft_subject"]=subject_value
        cA,cB=st.columns([3,1])
        with cA:
            auto_prompt=st.text_input("Auto-Draft Prompt", key="auto_prompt")
        with cB:
            if st.button("✨ Auto-Draft"):
                if not email_sel:
                    st.warning("Select an email first.")
                elif not auto_prompt:
                    st.warning("Enter a prompt.")
                else:
                    resp=safe_post("/agent", params={"email_id": email_sel["id"], "prompt": auto_prompt})
                    parsed=parse_json(resp.text)
                    st.session_state["_draft_subject"]=parsed.get("subject", "")
                    st.session_state["_draft_body"]=parsed.get("body", "")
                    st.rerun()
        body_val=st.text_area(
            "Message Body",
            value=st.session_state["_draft_body"],
            height=200
        )
        if body_val != st.session_state["_draft_body"]:
            st.session_state["_draft_body"]=body_val
        s1, s2=st.columns([1,1])
        if s1.button("Send Message"):
            st.success("Message sent! (Simulation)")
            st.session_state.draft_mode=False
            st.rerun()
        if s2.button("Cancel"):
            st.session_state.draft_mode=False
            st.rerun()
    st.markdown("---")

    if st.session_state.selected_email:
        e=st.session_state.selected_email
        if st.button("← Back"):
            st.session_state.selected_email=None
            st.rerun()
        c1, c2=st.columns(2)
        c1.info(f"**Category:** {e.get('category','N/A')}")
        c2.success(f"**Actions:** {len(e.get('actions',[]))}")
        if e.get("actions"):
            st.caption("Action items:")
            for idx, action in enumerate(e["actions"]):
                label=action.get("task") if isinstance(action, dict) else str(action)
                st.checkbox(label, key=f"act_{e['id']}_{idx}")# type: ignore #
        st.markdown(f"""
        <div class="email-card">
            <h2>{e.get('subject')}</h2>
            <p><strong>From:</strong> {e.get('sender')} |
            <strong>Date:</strong> {e.get('timestamp')}</p>
            <hr>
            <div style="white-space: pre-wrap;">{e.get('body')}</div>
        </div>
        """, unsafe_allow_html=True)
        st.stop()

    for e in filtered:
        with st.container():
            c1, c2=st.columns([3,1])
            with c1:
                if st.button(f"📧 {e.get('subject','No Subject')}",# type: ignore #
                             use_container_width=True, key=f"card_{e.get('id')}"):# type: ignore #
                    st.session_state.selected_email=e
                    st.rerun()
                st.caption(e.get('body','')[:150] + "...")# type: ignore #
            with c2:
                st.caption(f"From: {e.get('sender','Unknown')}")# type: ignore #
                st.caption(f"Date: {e.get('timestamp','Unknown')}")# type: ignore #

elif page == "Settings":
    st.title("Settings")
    st.subheader("System Prompts Configuration")
    try:
        prompts=safe_get("/prompts").json()
    except:
        prompts={}
    editable={k:v for k,v in prompts.items() if k != "_id"}
    cols=st.columns(2)
    new_prompts={}

    for i,(k,v) in enumerate(editable.items()):
        with cols[i % 2]:
            st.markdown(f"**{k.replace('_',' ').title()}**")
            new_prompts[k]=st.text_area(k, value=v, height=250, key=f"p_{k}")

    if st.button("Save Prompts"):
        new_prompts["_id"]="active_prompts"
        safe_post("/prompts", json_body=new_prompts)

