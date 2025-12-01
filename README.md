# Synesthesia


## Overview

This repository contains the source code for the **Email Productivity Agent**, an intelligent application designed to automate inbox management. The agent utilizes Large Language Models (LLMs) to ingest emails, categorize content, extract actionable tasks, and draft replies based on user-defined prompts.

## Features

  * **Automated Categorization:** Classifies emails into categories such as Important, Newsletter, and Spam using configurable prompts.
  * **Action Item Extraction:** Parses email content to identify tasks and deadlines, outputting structured data.
  * **Draft Generation:** Automatically generates reply drafts based on context and user instructions. Drafts are saved for review and never sent automatically.
  * **Chat Interface:** A RAG-like "Email Agent" interface allowing users to query their inbox (e.g., "Summarize this thread" or "What is urgent?").

## Installation & Setup

### Prerequisites

  * Python 3.11

### Steps

1.  **Clone the Repository**

    ```bash
    git clone https://github.com/username/email-productivity-agent.git
    cd email-productivity-agent
    ```

2.  **Install Dependencies**

    ```bash
    pip install -r requirements.txt
    ```

3.  **Configuration**
    Create a `.env` file in the root directory and add your API credentials:

    ```bash
    LLM_API_KEY=your_key_here
    ```

## Usage Instructions

### Running the Application

The application utilizes **Streamlit** for the frontend interface. To launch the system:

```bash
streamlit run app.py
```

Access the web UI at `http://localhost:8501`.

### 1\. Loading the Inbox

  * Navigate to the **Inbox** section in the UI.
  * Select **"Load Mock Inbox"** to ingest the sample dataset provided in `assets/mock_inbox.json`.
  * The system will parse 10-20 sample emails, including meeting requests, newsletters, and project updates.

### 2\. Configuring Prompts

The agent's behavior is governed by the "Prompt Brain." [cite\_start]Navigate to the **Configuration** tab to edit the following:

  * **Categorization Prompt:** Defines logic for tagging emails (e.g., separating "To-Do" from "Spam").
  * **Action Item Prompt:** Instructions for extracting JSON-formatted task data.
  * **Auto-Reply Prompt:** Sets the tone and structure for generated email drafts.

### 3\. Using the Email Agent

Select an email from the list to view its details. Use the chat interface to interact with the content:

  * *Summarization:* "Summarize this email." 
  * *Task Extraction:* "What tasks do I need to do?" 
  * *Drafting:* "Draft a reply agreeing to the meeting."

## Project Assets
  * **Mock Inbox:** Located in `assets/mock_inbox.json`. Contains sample data for testing ingestion and processing.
  * **Default Prompts:** Pre-loaded templates are available in `assets/prompts.json` covering categorization, extraction, and drafting logic.
