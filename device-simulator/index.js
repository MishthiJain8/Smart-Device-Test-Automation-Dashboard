const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Global device state
const deviceState = {
  id: uuidv4(),
  status: 'online',
  playback: {
    state: 'stopped',
    currentTime: 0,
    duration: 0,
    mediaId: null,
  },
  metrics: {
    uptime: 0,
    lastHeartbeat: Date.now(),
    errorCount: 0,
    successfulRequests: 0,
  },
  firmwareVersion: '2.1.0',
};

// Simulate various failure modes
const simulationStates = {
  normal: 0.7,
  latencySpike: 0.15,
  networkFailure: 0.05,
  slowResponse: 0.08,
  crash: 0.02,
};

let currentSimulation = 'normal';

// Simulate failures and latency
async function simulateFailureMode() {
  const random = Math.random();
  let cumulative = 0;

  for (const [mode, probability] of Object.entries(simulationStates)) {
    cumulative += probability;
    if (random <= cumulative) {
      currentSimulation = mode;
      break;
    }
  }
}

// Add artificial latency to responses
async function addLatency() {
  let delay = 10;
  if (currentSimulation === 'latencySpike') {
    delay = Math.random() * 5000 + 1000; // 1-6 seconds
  } else if (currentSimulation === 'slowResponse') {
    delay = Math.random() * 2000 + 500; // 0.5-2.5 seconds
  } else if (currentSimulation === 'networkFailure') {
    throw new Error('Network timeout');
  } else if (currentSimulation === 'crash') {
    // Simulate temporary crash
    deviceState.status = 'crashed';
    setTimeout(() => {
      deviceState.status = 'online';
      deviceState.metrics.errorCount++;
    }, 2000);
    throw new Error('Device crashed');
  }

  return new Promise(resolve => setTimeout(resolve, delay));
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await simulateFailureMode();
    await addLatency();

    const health = {
      deviceId: deviceState.id,
      status: deviceState.status,
      timestamp: Date.now(),
      uptime: Date.now() - deviceState.metrics.lastHeartbeat,
      firmwareVersion: deviceState.firmwareVersion,
    };

    deviceState.metrics.successfulRequests++;
    res.json(health);
  } catch (error) {
    deviceState.metrics.errorCount++;
    res.status(503).json({ error: error.message });
  }
});

// Play endpoint
app.post('/play', async (req, res) => {
  try {
    await simulateFailureMode();
    await addLatency();

    const { mediaId } = req.body;
    deviceState.playback.state = 'playing';
    deviceState.playback.mediaId = mediaId;
    deviceState.playback.currentTime = 0;
    deviceState.playback.duration = 3600; // 1 hour default
    deviceState.metrics.successfulRequests++;

    res.json({
      deviceId: deviceState.id,
      action: 'play',
      mediaId,
      state: deviceState.playback.state,
      timestamp: Date.now(),
    });
  } catch (error) {
    deviceState.metrics.errorCount++;
    res.status(500).json({ error: error.message });
  }
});

// Pause endpoint
app.post('/pause', async (req, res) => {
  try {
    await simulateFailureMode();
    await addLatency();

    deviceState.playback.state = 'paused';
    deviceState.metrics.successfulRequests++;

    res.json({
      deviceId: deviceState.id,
      action: 'pause',
      state: deviceState.playback.state,
      currentTime: deviceState.playback.currentTime,
      timestamp: Date.now(),
    });
  } catch (error) {
    deviceState.metrics.errorCount++;
    res.status(500).json({ error: error.message });
  }
});

// Stop endpoint
app.post('/stop', async (req, res) => {
  try {
    await simulateFailureMode();
    await addLatency();

    deviceState.playback.state = 'stopped';
    deviceState.playback.currentTime = 0;
    deviceState.playback.mediaId = null;
    deviceState.metrics.successfulRequests++;

    res.json({
      deviceId: deviceState.id,
      action: 'stop',
      state: deviceState.playback.state,
      timestamp: Date.now(),
    });
  } catch (error) {
    deviceState.metrics.errorCount++;
    res.status(500).json({ error: error.message });
  }
});

// Status endpoint
app.get('/status', async (req, res) => {
  try {
    await simulateFailureMode();
    await addLatency();

    deviceState.metrics.successfulRequests++;
    res.json({
      deviceId: deviceState.id,
      status: deviceState.status,
      playback: deviceState.playback,
      metrics: deviceState.metrics,
      firmwareVersion: deviceState.firmwareVersion,
      timestamp: Date.now(),
    });
  } catch (error) {
    deviceState.metrics.errorCount++;
    res.status(500).json({ error: error.message });
  }
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.json({
    deviceId: deviceState.id,
    status: deviceState.status,
    metrics: deviceState.metrics,
    timestamp: Date.now(),
  });
});

// Send heartbeat to backend
async function sendHeartbeat() {
  try {
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3000';
    await axios.post(`${backendUrl}/api/devices/heartbeat`, {
      deviceId: deviceState.id,
      status: deviceState.status,
      metrics: deviceState.metrics,
      playback: deviceState.playback,
      firmwareVersion: deviceState.firmwareVersion,
    });
  } catch (error) {
    console.error('Failed to send heartbeat:', error.message);
  }
}

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Device Simulator (${deviceState.id}) running on port ${PORT}`);

  // Send heartbeat every 5 seconds
  setInterval(sendHeartbeat, 5000);

  // Update metrics
  setInterval(() => {
    deviceState.metrics.uptime = Date.now() - deviceState.metrics.lastHeartbeat;
  }, 1000);
});
