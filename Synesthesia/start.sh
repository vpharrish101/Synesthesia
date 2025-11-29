#!/bin/bash
cd backend uvicorn api:app --host 0.0.0.0 --port 8000 &
cd frontend npm run dev
