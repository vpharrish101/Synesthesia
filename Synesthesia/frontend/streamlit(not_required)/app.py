import sys
import os
import json
import requests
import streamlit as st

# Adjust import path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# --------------------------
# Backend URL
# --------------------------
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

st.set_page_config(page_title="Synesthesia", page_icon="🌌", layout="wide")


# --------------------------
# Utility: GET / POST wrappers
# --------------------------
def safe_get(path, params=None):
    url = f"{BACKEND_URL.rstrip('/')}/{path.lstrip('/')}"
    try:
        r = requests.get(url, params=params, timeout=10)
        r.raise_for_status()
        return r
    except Exception as e:
        st.error(f"GET error: {e}")
        return None


def safe_post(path, params=None, json_body=None):
    url = f"{BACKEND_URL.rstrip('/')}/{path.lstrip('/')}"
    try:
        r = requests.post(url, params=params, json=json_body, timeout=10)
        r.raise_for_status()
        return r
    except Exception as e:
        st.error(f"POST error: {e}")
        return None


def parse_json(raw):
    """Safely parse nested JSON or stringified JSON"""
    if raw is None:
        return {}
    if isinstance(raw, dict):
        return raw
    try:
        obj = json.loads(raw)
    except:
        return {}
    if isinstance(obj, str):
        try:
            return json.loads(obj)
        except:
            return {}
    return obj


# --------------------------
# Session State Defaults
# --------------------------
st.session_state.setdefault("messages", [])
st.session_state.setdefault("selected_email", None)
st.session_state.setdefault("draft_mode", False)
st.session_state.setdefault("open_chat", False)
st.session_state.setdefault("_draft_subject", "")
st.session_state.setdefault("_draft_body", "")


# --------------------------
# Sidebar Navigation
# --------------------------
with st.sidebar:
    st.title("🌌 Synesthesia")
    page = st.radio("Navigation", ["Dashboard", "Settings"])
    st.markdown("---")

    if st.button("💬 Chat Assistant"):
        st.session_state.open_chat = not st.session_state.open_chat


# --------------------------
# Floating Chat Assistant
# --------------------------
if st.session_state.open_chat:
    with st.expander("Synesthesia Assistant", expanded=True):
        for msg in st.session_state.messages:
            st.write(f"**{msg['role']}:** {msg['content']}")

        user_query = st.text_input("Ask something...", key="chat_input")

        if st.button("Send Query"):
            st.session_state.messages.append({"role": "user", "content": user_query})

            # 1️⃣ Query about a specific email
            if st.session_state.selected_email:
                email_id = st.session_state.selected_email["id"]
                resp = safe_post(
                    "/ds7m/ask",
                    json_body={"email_id": email_id, "question": user_query}
                )
                answer = resp.json() if resp else "Error."

            # 2️⃣ Global superquery
            else:
                resp = safe_post("/ds7m/superquery", json_body={"question": user_query})
                answer = resp.json().get("answer", "No response.") if resp else "Error."

            st.session_state.messages.append({"role": "assistant", "content": str(answer)})
            st.rerun()


# --------------------------
# Dashboard
# --------------------------
if page == "Dashboard":
    st.title("Dashboard")

    resp = safe_get("/emails")
    emails = resp.json() if resp else []

    # Summary Metrics
    c1, c2, c3, c4 = st.columns([1, 1, 1, 2])
    c1.metric("Total", len(emails))
    c2.metric("Uncategorized", len([e for e in emails if e.get("category") == "Uncategorized"]))
    c3.metric("Action Items", sum(len(e.get("actions") or []) for e in emails))

    # RAG Search
    with c4:
        st.markdown("### 🔍 Semantic RAG Search")
        rag_query = st.text_input("Query", key="rag_query")

        if st.button("Search 🔎"):
            resp = safe_get("/search", params={"q": rag_query})
            rag_results = resp.json() if resp else []

            st.markdown("---")
            st.subheader("Top 3 Matches")

            for idx, e in enumerate(rag_results[:3]):
                with st.container():
                    st.markdown(f"#### {idx+1}. {e.get('subject')}")
                    st.caption(f"From: {e.get('sender')} | Date: {e.get('timestamp')}")
                    st.write(e.get("body", "")[:200] + "...")

                    if st.button(f"Open Email {idx+1}", key=f"open_rag_{idx}"):
                        st.session_state.selected_email = e
                        st.rerun()
            st.markdown("---")

    # Email Search Filter
    search_term = st.text_input("Search emails...", "")
    filtered = [
        e for e in emails
        if search_term.lower() in (e.get("subject","") + e.get("body","") + e.get("sender","")).lower()
    ] if search_term else emails

    st.markdown("---")

    # Compose new draft
    if st.button("✍️ Compose Draft"):
        st.session_state.draft_mode = True
        st.session_state["_draft_subject"] = ""
        st.session_state["_draft_body"] = ""

    # Draft composer UI
    if st.session_state.draft_mode:
        st.subheader("New Draft")

        reply_choices = {
            f"{e.get('sender')} — {e.get('subject')}": e for e in emails
        }
        labels = ["Select..."] + list(reply_choices.keys())

        selected = st.selectbox("Reply To", labels)
        if selected != "Select...":
            st.session_state.selected_email = reply_choices[selected]

        target = st.session_state.selected_email

        st.text_input("To", value=target.get("sender") if target else "", key="draft_to")

        subject_default = st.session_state["_draft_subject"] or (f"Re: {target.get('subject')}" if target else "")
        subject_value = st.text_input("Subject", value=subject_default)

        st.session_state["_draft_subject"] = subject_value

        colA, colB = st.columns([3, 1])
        with colA:
            prompt = st.text_input("Auto-draft Prompt:", key="auto_prompt")

        with colB:
            if st.button("✨ Generate"):
                if target:
                    resp = safe_post(
                        "/ds7m/autodraft",
                        params={"email_id": target["id"], "prompt": prompt}
                    )
                    parsed = parse_json(resp.text)  #type:ignore

                    st.session_state["_draft_subject"] = parsed.get("subject", "")
                    st.session_state["_draft_body"] = parsed.get("body", "")
                    st.rerun()
                else:
                    st.warning("Select an email first.")

        body_val = st.text_area("Message Body", st.session_state["_draft_body"], height=200)
        st.session_state["_draft_body"] = body_val

        cA, cB = st.columns([1, 1])
        if cA.button("Send"):
            st.success("Message sent! (Simulation)")
            st.session_state.draft_mode = False
            st.rerun()

        if cB.button("Cancel"):
            st.session_state.draft_mode = False
            st.rerun()

    st.markdown("---")

    # Email Reader
    if st.session_state.selected_email:
        e = st.session_state.selected_email

        if st.button("← Back"):
            st.session_state.selected_email = None
            st.rerun()

        c1, c2 = st.columns(2)
        c1.info(f"**Category:** {e.get('category')}")
        c2.success(f"**Actions:** {len(e.get('actions', []))}")

        if e.get("actions"):
            for i, act in enumerate(e["actions"]):
                label = act.get("task") if isinstance(act, dict) else str(act)
                st.checkbox(label, key=f"act_{e['id']}_{i}") #type:ignore

        st.markdown(f"""
        <div style="padding:1rem; border:1px solid #555; border-radius:10px;">
            <h2>{e.get('subject')}</h2>
            <p><strong>From:</strong> {e.get('sender')} |
               <strong>Date:</strong> {e.get('timestamp')}</p>
            <hr>
            <div style="white-space: pre-wrap;">{e.get('body')}</div>
        </div>
        """, unsafe_allow_html=True)

        st.stop()

    # Email List Cards
    for e in filtered:
        with st.container():
            c1, c2 = st.columns([3, 1])

            with c1:
                if st.button(f"📧 {e.get('subject')}", use_container_width=True, key=f"card_{e.get('id')}"):
                    st.session_state.selected_email = e
                    st.rerun()
                st.caption(e.get("body", "")[:150] + "...")

            with c2:
                st.caption(f"From: {e.get('sender')}")
                st.caption(f"Date: {e.get('timestamp')}")

# --------------------------
# Settings Page
# --------------------------
elif page == "Settings":
    st.title("Settings")
    st.subheader("System Prompts")

    resp = safe_get("/prompts/get_all")
    prompts = resp.json() if resp else {}

    editable = {k: v for k, v in prompts.items() if k != "_id"}

    cols = st.columns(2)
    new_prompts = {}

    for i, (k, v) in enumerate(editable.items()):
        with cols[i % 2]:
            st.markdown(f"**{k.replace('_', ' ').title()}**")
            new_prompts[k] = st.text_area(k, v, height=250, key=f"prompt_{k}")

    if st.button("Save Changes"):
        new_prompts["_id"] = "active_prompts"
        safe_post("/prompts/change_one", json_body=new_prompts)
        st.success("Prompts updated!")
