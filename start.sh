#!/usr/bin/env bash
# start.sh — Start the AI Job Application Assistant backend and frontend servers.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting Backend (FastAPI) on port 8000..."
(cd "$SCRIPT_DIR/backend" && PYTHONPATH=. "$SCRIPT_DIR/backend/.venv/bin/uvicorn" app.main:app --reload --host 127.0.0.1 --port 8000) &
BACKEND_PID=$!

echo "🚀 Starting Frontend (Next.js) on port 3000..."
(cd "$SCRIPT_DIR/frontend" && npm run dev) &
FRONTEND_PID=$!

function cleanup {
  echo "🛑 Stopping servers..."
  kill $BACKEND_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  exit
}
trap cleanup EXIT INT TERM

wait
