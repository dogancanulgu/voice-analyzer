#!/bin/bash
# Stop any process on port 8000 or 8080
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:8080 | xargs kill -9 2>/dev/null

# Activate venv if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Run the app
echo "Starting backend on http://localhost:8080..."
python3 main.py
