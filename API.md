# API Reference

## Device Simulator API

### Base URL
```
http://localhost:3001  (Device 1)
http://localhost:3002  (Device 2)
... etc
```

### Endpoints

#### GET /health
Check device health status.

**Response (200 OK)**
```json
{
  "deviceId": "device-001",
  "status": "online",
  "timestamp": 1622000000000,
  "uptime": 125000,
  "firmwareVersion": "2.1.0"
}
```

**Response (503 Service Unavailable)**
```json
{
  "error": "Network timeout"
}
```

---

#### POST /play
Start media playback.

**Request**
```json
{
  "mediaId": "netflix-show-123"
}
```

**Response (200 OK)**
```json
{
  "deviceId": "device-001",
  "action": "play",
  "mediaId": "netflix-show-123",
  "state": "playing",
  "timestamp": 1622000000000
}
```

**Response (500 Error)**
```json
{
  "error": "Device crashed"
}
```

---

#### POST /pause
Pause playback.

**Response (200 OK)**
```json
{
  "deviceId": "device-001",
  "action": "pause",
  "state": "paused",
  "currentTime": 3600,
  "timestamp": 1622000000000
}
```

---

#### POST /stop
Stop playback completely.

**Response (200 OK)**
```json
{
  "deviceId": "device-001",
  "action": "stop",
  "state": "stopped",
  "timestamp": 1622000000000
}
```

---

#### GET /status
Get complete device status.

**Response (200 OK)**
```json
{
  "deviceId": "device-001",
  "status": "online",
  "playback": {
    "state": "playing",
    "currentTime": 1800,
    "duration": 3600,
    "mediaId": "netflix-show-123"
  },
  "metrics": {
    "uptime": 125000,
    "errorCount": 2,
    "successfulRequests": 156
  },
  "firmwareVersion": "2.1.0",
  "timestamp": 1622000000000
}
```

---

#### GET /metrics
Get device metrics.

**Response (200 OK)**
```json
{
  "deviceId": "device-001",
  "status": "online",
  "metrics": {
    "uptime": 125000,
    "errorCount": 2,
    "successfulRequests": 156
  },
  "timestamp": 1622000000000
}
```

---

## Backend API

### Base URL
```
http://localhost:3000
```

### Endpoints

#### GET /health
Check backend health.

**Response (200 OK)**
```json
{
  "status": "healthy",
  "timestamp": 1622000000000
}
```

---

#### GET /api/devices
List all connected devices.

**Query Parameters**
- None

**Response (200 OK)**
```json
[
  {
    "id": "device-001",
    "status": "online",
    "firmware_version": "2.1.0",
    "last_heartbeat": "2024-01-15T10:30:00Z",
    "uptime": 125000,
    "error_count": 2,
    "successful_requests": 156,
    "recorded_at": "2024-01-15T10:35:00Z"
  }
]
```

---

#### GET /api/devices/:id
Get specific device details.

**Path Parameters**
- `id` (string, required): Device ID

**Response (200 OK)**
```json
{
  "id": "device-001",
  "status": "online",
  "firmware_version": "2.1.0",
  "last_heartbeat": "2024-01-15T10:30:00Z"
}
```

**Response (404 Not Found)**
```json
{
  "error": "Device not found"
}
```

---

#### GET /api/devices/:id/logs
Get device logs.

**Path Parameters**
- `id` (string, required): Device ID

**Response (200 OK)**
```json
[
  {
    "id": 1,
    "device_id": "device-001",
    "level": "error",
    "message": "Network timeout on /play",
    "created_at": "2024-01-15T10:25:00Z"
  }
]
```

---

#### POST /api/devices/heartbeat
Register device heartbeat (called by device simulator).

**Request**
```json
{
  "deviceId": "device-001",
  "status": "online",
  "metrics": {
    "uptime": 125000,
    "errorCount": 2,
    "successfulRequests": 156
  },
  "playback": {
    "state": "playing",
    "currentTime": 1800,
    "duration": 3600,
    "mediaId": "netflix-show-123"
  },
  "firmwareVersion": "2.1.0"
}
```

**Response (200 OK)**
```json
{
  "success": true
}
```

---

#### POST /api/test-results
Submit test execution results.

**Request**
```json
{
  "timestamp": 1622000000000,
  "totalTests": 8,
  "passed": 7,
  "failed": 1,
  "averageLatency": 456.25,
  "results": [
    {
      "suiteId": "suite-001",
      "testName": "Health Check",
      "deviceUrl": "http://localhost:3001",
      "status": "passed",
      "duration": 28,
      "timestamp": 1622000000000
    }
  ]
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "suiteId": "suite-001"
}
```

---

#### GET /api/test-results
List test results.

**Query Parameters**
- `limit` (integer, default: 50): Maximum number of results

**Response (200 OK)**
```json
[
  {
    "id": "suite-001",
    "total_tests": 8,
    "passed": 7,
    "failed": 1,
    "average_latency": 456.25,
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

---

#### GET /api/test-results/:id
Get specific test suite details.

**Path Parameters**
- `id` (string, required): Suite ID

**Response (200 OK)**
```json
{
  "suite": {
    "id": "suite-001",
    "total_tests": 8,
    "passed": 7,
    "failed": 1,
    "average_latency": 456.25,
    "created_at": "2024-01-15T10:30:00Z"
  },
  "details": [
    {
      "id": "result-001",
      "test_name": "Health Check",
      "device_id": "device-001",
      "status": "passed",
      "duration": 28,
      "error_message": null,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

#### GET /api/metrics
Get aggregated metrics.

**Query Parameters**
- `timeRange` (string, default: '24h'): Time range - '24h', '7d', or 'all'

**Response (200 OK)**
```json
[
  {
    "device_id": "device-001",
    "avg_uptime": 125000,
    "avg_errors": 2,
    "avg_success": 156,
    "data_points": 10
  }
]
```

---

## WebSocket Events

### Connection
```javascript
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected');
});
```

### Device Update Event
Emitted when a device sends a heartbeat.

```javascript
socket.on('device-update', (data) => {
  console.log('Device update:', data);
  // {
  //   deviceId: 'device-001',
  //   status: 'online',
  //   metrics: {...},
  //   playback: {...},
  //   firmwareVersion: '2.1.0',
  //   timestamp: 1622000000000
  // }
});
```

### Test Completed Event
Emitted when a test suite completes.

```javascript
socket.on('test-completed', (data) => {
  console.log('Test completed:', data);
  // {
  //   suiteId: 'suite-001',
  //   totalTests: 8,
  //   passed: 7,
  //   failed: 1,
  //   averageLatency: 456.25,
  //   timestamp: 1622000000000
  // }
});
```

### Request Device List
```javascript
socket.emit('request-device-list');

socket.on('device-list', (devices) => {
  console.log('Devices:', devices);
});
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request parameters"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

### 503 Service Unavailable
```json
{
  "error": "Service temporarily unavailable"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. For production, consider adding:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## Authentication (Future Enhancement)

```bash
# Example JWT auth header
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Examples

### Using curl

```bash
# Get all devices
curl http://localhost:3000/api/devices

# Get device logs
curl http://localhost:3000/api/devices/device-001/logs

# Get test results
curl http://localhost:3000/api/test-results?limit=10

# Play media on device
curl -X POST http://localhost:3001/play \
  -H "Content-Type: application/json" \
  -d '{"mediaId": "netflix-show-123"}'

# Check device status
curl http://localhost:3001/status
```

### Using JavaScript/Node.js

```javascript
const axios = require('axios');

// Get devices
async function getDevices() {
  const response = await axios.get('http://localhost:3000/api/devices');
  console.log(response.data);
}

// Play media
async function playMedia(deviceUrl, mediaId) {
  const response = await axios.post(`${deviceUrl}/play`, {
    mediaId: mediaId
  });
  console.log(response.data);
}

// Get metrics
async function getMetrics() {
  const response = await axios.get('http://localhost:3000/api/metrics', {
    params: { timeRange: '24h' }
  });
  console.log(response.data);
}
```

### Using Python

```python
import requests
import json

# Get devices
response = requests.get('http://localhost:3000/api/devices')
devices = response.json()
print(json.dumps(devices, indent=2))

# Play media
payload = {'mediaId': 'netflix-show-123'}
response = requests.post('http://localhost:3001/play', json=payload)
print(response.json())

# Get test results
response = requests.get('http://localhost:3000/api/test-results')
results = response.json()
print(json.dumps(results, indent=2))
```
