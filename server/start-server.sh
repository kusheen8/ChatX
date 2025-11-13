#!/bin/bash

echo "Starting Chat Server..."
echo ""

# Check if port 5000 is in use and kill the process
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "Port 5000 is already in use. Killing process..."
    lsof -ti:5000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# On Windows (Git Bash)
if command -v netstat >/dev/null 2>&1; then
    PID=$(netstat -ano | grep :5000 | grep LISTENING | awk '{print $5}' | head -1)
    if [ ! -z "$PID" ]; then
        echo "Killing process $PID on port 5000..."
        taskkill //F //PID $PID 2>/dev/null || kill -9 $PID 2>/dev/null || true
        sleep 2
    fi
fi

echo "Starting server..."
npm run dev

