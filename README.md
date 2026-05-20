# Smart Device Test Automation & Monitoring Framework

A comprehensive distributed testing and monitoring system that simulates smart TV/streaming devices and runs automated test cases across a fleet of devices—similar to a mini Netflix device testing lab.

## 🎯 Project Overview

This framework provides:

- **Device Simulation Layer**: Multiple Node.js workers simulating smart TV devices with realistic failure modes
- **Test Automation Engine**: Comprehensive test suite running across devices concurrently
- **Metrics & Logging System**: Real-time metrics collection with PostgreSQL storage
- **Real-Time Dashboard**: React-based monitoring interface with live updates
- **CI/CD Integration**: GitHub Actions automation for continuous testing

## 📋 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Dashboard                        │
│                    (React + WebSocket)                       │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│                  Backend API Service                         │
│            (Node.js Express + PostgreSQL)                   │
└────────┬──────────────┬──────────────┬──────────────────────┘
         │              │              │
    ┌────▼──┐  ┌───────▼────┐  ┌─────▼──────┐
    │ Device │  │ Metrics &  │  │  Test      │
    │Sim #1  │  │  Logging   │  │  Results   │
    └────────┘  │  System    │  │  Manager   │
                │(PostgreSQL)│  └────────────┘
    ┌────┐      └────────────┘
    │....│
    └────┘
  5-20 Devices
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL (or use Docker)

### Option 1: Docker Compose (Recommended)

```bash
cd smart-device-framework

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Run tests
docker-compose exec test-runner npm run run-tests

# Stop all services
docker-compose down
```

### Option 2: Local Development

#### 1. Set up PostgreSQL

```bash
# Create database
createdb device_test_db

# Update backend .env with your database URL
```

#### 2. Start Backend API

```bash
cd backend-api
npm install
npm start
# Runs on http://localhost:3000
```

#### 3. Start Device Simulators

```bash
# Terminal 1
cd device-simulator
npm install
PORT=3001 npm start

# Terminal 2
PORT=3002 npm start

# Terminal 3
PORT=3003 npm start

# ... repeat for more devices
```

#### 4. Run Tests

```bash
cd test-runner
npm install
DEVICE_SIMULATOR_URLS=http://localhost:3001,http://localhost:3002,http://localhost:3003 npm run run-tests
```

#### 5. View Dashboard

Open `frontend-dashboard/index.html` in your browser or serve via:

```bash
cd frontend-dashboard
python -m http.server 8000
# Visit http://localhost:8000
```

## 📊 API Endpoints

### Device Simulator APIs

**Health Check**
```bash
GET /health
```

**Play Media**
```bash
POST /play
Content-Type: application/json

{
  "mediaId": "media-123"
}
```

**Pause**
```bash
POST /pause
```

**Stop**
```bash
POST /stop
```

**Get Status**
```bash
GET /status
```

**Get Metrics**
```bash
GET /metrics
```

### Backend API Endpoints

**Get All Devices**
```bash
GET /api/devices
```

**Get Device by ID**
```bash
GET /api/devices/:id
```

**Get Device Logs**
```bash
GET /api/devices/:id/logs
```

**Get Test Results**
```bash
GET /api/test-results
GET /api/test-results/:id
```

**Get Metrics**
```bash
GET /api/metrics?timeRange=24h
```

**Health Check**
```bash
GET /health
```

## 🧪 Test Cases Included

### 1. Health Check
- Verifies device is online and responding

### 2. Playback Start Performance
- Ensures playback starts within 1 second threshold
- Validates playback state is set correctly

### 3. Status API Response Validation
- Checks all required fields in response
- Validates data structure integrity

### 4. Pause/Resume Cycle
- Tests pause command
- Tests resume functionality
- Validates state transitions

### 5. Stop Command Execution
- Tests stop command
- Verifies playback is stopped
- Validates state consistency

### 6. Metrics Collection
- Verifies metrics endpoint availability
- Validates metric data types
- Checks error and success counts

### 7. Failure Recovery
- Tests retry logic
- Simulates transient failures
- Validates recovery mechanism (3 retry attempts)

### 8. Concurrent Request Handling
- Tests 5 concurrent requests
- Validates at least 4 succeed
- Checks system stability under load

## 🎮 Simulated Failure Modes

Devices randomly simulate:

| Mode | Probability | Behavior |
|------|------------|----------|
| Normal | 70% | Standard response with 10ms latency |
| Latency Spike | 15% | 1-6 second delay |
| Slow Response | 8% | 0.5-2.5 second delay |
| Network Failure | 5% | Timeout error |
| Crash | 2% | Device restarts automatically |

## 📈 Monitoring & Metrics

### Available Metrics

- **Response Latency**: Individual request timing
- **Error Rate**: Failed requests per device
- **Uptime**: Device availability percentage
- **Success Count**: Successful API calls
- **Firmware Version**: Device firmware information

### Real-Time Updates

WebSocket connections provide live updates for:

- Device status changes
- Test completion events
- Metrics updates
- Error notifications

## 🔄 Continuous Integration

### GitHub Actions Workflow

Triggered on every push to `main` or `develop`:

1. **Install Dependencies**: npm ci for all services
2. **Lint Code**: ESLint checks
3. **Start Services**: Backend API, simulators, database
4. **Run Tests**: Full test suite execution
5. **Build Docker Images**: Verify Docker builds
6. **Generate Report**: Test summary in PR

### Manual Test Trigger

```bash
# Run tests locally
cd test-runner
npm run run-tests

# With custom device URLs
DEVICE_SIMULATOR_URLS=http://localhost:3001,http://localhost:3002 npm run run-tests
```

## 🐳 Docker Images

### Available Images

```yaml
- backend-api: Node.js Express server
- device-simulator: Device simulation service
- test-runner: Test automation engine
- frontend: Nginx serving dashboard
- postgres: PostgreSQL database
```

### Build Individual Images

```bash
# Backend API
docker build -t smart-device-backend:latest ./backend-api

# Device Simulator
docker build -t smart-device-simulator:latest ./device-simulator

# Test Runner
docker build -t smart-device-tests:latest ./test-runner
```

## 📊 Dashboard Features

### Real-Time Monitoring

- **Device List**: Shows all connected devices with status
- **Device Metrics**: Uptime, error count, successful requests
- **Firmware Versions**: Current device firmware information
- **Status Indicators**: Online (🟢), Offline (⚪), Crashed (🔴)

### Test Results

- **Test History**: Recent 20 test results
- **Pass/Fail Rate**: Success percentage
- **Latency Charts**: API response times
- **Error Tracking**: Failed test details

### Statistics

- **Active Devices**: Count of online devices
- **Tests Passed**: Success count (24h)
- **Tests Failed**: Failure count (24h)
- **Avg Latency**: Average API response time

## 🔧 Configuration

### Environment Variables

**Backend API** (`.env`)
```
DATABASE_URL=postgresql://user:pass@localhost:5432/device_test_db
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Device Simulator** (`.env`)
```
DEVICE_ID=device-001
PORT=3001
BACKEND_API_URL=http://localhost:3000
NUM_DEVICES=5
SIMULATION_MODE=enabled
```

**Test Runner** (`.env`)
```
BACKEND_API_URL=http://localhost:3000
DEVICE_SIMULATOR_URLS=http://localhost:3001,http://localhost:3002
TEST_TIMEOUT=30000
RETRY_ATTEMPTS=3
```

## 📁 Project Structure

```
smart-device-framework/
├── device-simulator/          # Device simulation service
│   ├── index.js              # Main device simulator
│   ├── package.json
│   ├── Dockerfile
│   └── .env
├── test-runner/              # Test automation engine
│   ├── runTests.js           # Test suite runner
│   ├── package.json
│   └── .env
├── backend-api/              # Backend API service
│   ├── index.js              # Express server
│   ├── package.json
│   └── .env
├── frontend-dashboard/       # React dashboard
│   ├── index.html            # Dashboard UI
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml        # Docker Compose configuration
├── nginx.conf               # Nginx reverse proxy config
├── .github/workflows/       # CI/CD pipelines
│   └── ci-cd.yml           # GitHub Actions workflow
└── README.md               # This file
```

## 🧩 Advanced Features

### Firmware Version Simulation

Each device reports a firmware version. Simulate device diversity:

```javascript
const firmwareVersions = ['2.0.0', '2.1.0', '2.2.0', '3.0.0'];
deviceState.firmwareVersion = firmwareVersions[Math.floor(Math.random() * firmwareVersions.length)];
```

### Flaky Test Detection

Track tests that occasionally fail:

```javascript
const flakyTests = results.filter(r => r.status === 'failed' && r.testName === 'Test Name');
if (flakyTests.length > 2) {
  console.warn('⚠️  Potential flaky test detected');
}
```

### Performance Benchmarking

Analyze latency patterns:

```javascript
const latencies = results.map(r => r.duration);
const p95 = latencies.sort()[Math.floor(latencies.length * 0.95)];
console.log(`95th percentile latency: ${p95}ms`);
```

### Retry Logic with Exponential Backoff

```javascript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = Math.pow(2, i) * 1000;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
```

## 📝 Sample Test Output

```
🚀 Smart Device Test Automation Engine
📱 Testing 3 device(s)

🧪 Running test suite on http://localhost:3001
   ├─ Health Check...
   │  ✓ Passed (28ms)
   ├─ Playback Start Time < 1s...
   │  ✓ Passed (245ms)
   ├─ Status API Response Valid...
   │  ✓ Passed (15ms)
   ├─ Pause/Resume Cycle...
   │  ✓ Passed (512ms)
   ├─ Stop Command Execution...
   │  ✓ Passed (123ms)
   ├─ Metrics Collection Available...
   │  ✓ Passed (18ms)
   ├─ Failure Recovery & Retry...
   │  ✓ Passed (3245ms)
   ├─ Concurrent Request Handling...
   │  ✓ Passed (89ms)

============================================================
📊 TEST REPORT
============================================================
Total Tests: 24
✓ Passed: 22 (91.67%)
✗ Failed: 2 (8.33%)
Average Latency: 456.25ms
Total Duration: 10950ms
============================================================

✅ Results sent to backend
```

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
psql postgres -h localhost -U postgres

# View database logs
docker-compose logs postgres
```

### Port Conflicts

```bash
# Find what's using port 3000
lsof -i :3000

# Kill process (macOS/Linux)
kill -9 <PID>
```

### Device Simulator Connection Issues

```bash
# Check backend is reachable
curl http://localhost:3000/health

# Verify device simulator is running
curl http://localhost:3001/health
```

### WebSocket Connection Failed

- Ensure CORS is configured correctly in backend
- Check frontend URL in backend `.env`
- Verify WebSocket port is accessible

## 📚 Example Workflows

### Run Daily Test Suite

Add cron job to GitHub Actions:

```yaml
schedule:
  - cron: '0 0 * * *'  # Daily at midnight
```

### Scale to 20 Devices

Update `docker-compose.yml`:

```yaml
device-simulator-6:
  # ... copy device-simulator-5 and change port to 3006
```

Or use environment variable:

```bash
for i in {1..20}; do
  PORT=$((3000 + i)) npm start &
done
```

### Performance Testing

Add load test:

```javascript
suite.addTest('Load Test - 100 Requests', async (deviceUrl) => {
  const requests = Array(100).fill(null).map(() => 
    axios.get(`${deviceUrl}/status`)
  );
  const results = await Promise.allSettled(requests);
  const success = results.filter(r => r.status === 'fulfilled').length;
  if (success < 95) throw new Error('Load test failed');
});
```

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes and test locally
3. Run full test suite: `docker-compose exec test-runner npm run run-tests`
4. Commit and push: `git push origin feature/my-feature`
5. Create a pull request

## 📄 License

MIT

## 🎓 Learning Resources

- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js Best Practices](https://nodejs.org/en/docs/)
- [Testing Best Practices](https://jestjs.io/)
- [Docker Documentation](https://docs.docker.com/)

## ✅ Verification Checklist

- [x] Device Simulator with failure modes
- [x] Test Automation Engine with 8 test cases
- [x] Backend API with PostgreSQL
- [x] Real-time dashboard with WebSocket
- [x] Metrics collection and logging
- [x] Docker Compose setup
- [x] GitHub Actions CI/CD
- [x] Documentation and examples
- [x] Multi-device simulation (5-20 devices)
- [x] Error handling and retry logic

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review Docker logs: `docker-compose logs`
3. Check GitHub Issues
4. Contact the development team
# Smart-Device-Test-Automation-Dashboard
