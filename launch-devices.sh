#!/bin/bash

# Device Launcher Script - Start multiple simulated devices

set -e

NUM_DEVICES=${1:-5}
BASE_PORT=${2:-3001}
BACKEND_URL=${3:-http://localhost:3000}

echo "🚀 Launching $NUM_DEVICES devices..."
echo "Base port: $BASE_PORT"
echo "Backend URL: $BACKEND_URL"
echo ""

for ((i=1; i<=NUM_DEVICES; i++))
do
  PORT=$((BASE_PORT + i - 1))
  DEVICE_ID="device-$(printf "%03d" $i)"
  
  echo "Starting $DEVICE_ID on port $PORT..."
  
  PORT=$PORT \
  DEVICE_ID=$DEVICE_ID \
  BACKEND_API_URL=$BACKEND_URL \
  npm start &
  
  sleep 1
done

echo ""
echo "✅ All devices launched!"
echo "💡 Devices are running in the background"
echo "Run 'pkill -f \"node.*index.js\"' to stop all devices"
echo ""

# Keep script running
wait
