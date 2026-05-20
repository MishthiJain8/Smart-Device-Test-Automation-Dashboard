#!/bin/bash

# Test Runner Script - Run complete test suite

set -e

DEVICES=${1:-"http://localhost:3001,http://localhost:3002,http://localhost:3003"}
BACKEND_URL=${2:-http://localhost:3000}

echo "🧪 Starting Test Automation Engine"
echo "Devices: $DEVICES"
echo "Backend: $BACKEND_URL"
echo ""

cd test-runner

DEVICE_SIMULATOR_URLS=$DEVICES \
BACKEND_API_URL=$BACKEND_URL \
npm run run-tests

echo ""
echo "✅ Test suite completed!"
