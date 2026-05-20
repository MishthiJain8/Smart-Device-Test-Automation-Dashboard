# Smart Device Framework - Quick Reference Guide

## 🚀 Quick Start (5 minutes)

```bash
# 1. Navigate to project
cd smart-device-framework

# 2. Make scripts executable
chmod +x setup.sh launch-devices.sh run-tests.sh init-db.sh

# 3. Run setup (starts all services)
./setup.sh

# 4. View dashboard
open http://localhost

# 5. Run tests
docker-compose exec test-runner npm run run-tests
```

## 📋 Common Commands

### Start/Stop Services

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Stop and clean data
docker-compose down -v

# View logs
docker-compose logs -f
docker-compose logs -f backend-api
docker-compose logs -f device-simulator-1
```

### Check Status

```bash
# List running containers
docker-compose ps

# Check backend health
curl http://localhost:3000/health

# Check device 1
curl http://localhost:3001/health

# List all devices
curl http://localhost:3000/api/devices

# Get test results
curl http://localhost:3000/api/test-results
```

### Run Tests

```bash
# Run full test suite
docker-compose exec test-runner npm run run-tests

# Run tests locally (after npm install)
cd test-runner
npm run run-tests

# Run tests with custom devices
DEVICE_SIMULATOR_URLS=http://localhost:3001,http://localhost:3002 npm run run-tests
```

### Manage Devices

```bash
# Start N devices locally
./launch-devices.sh 5 3001

# Stop all devices
pkill -f "node.*index.js"

# View device metrics
curl http://localhost:3001/metrics
curl http://localhost:3002/metrics
```

## 🔧 Configuration Quick Reference

### Backend API (.env)
```ini
DATABASE_URL=postgresql://postgres:password@localhost:5432/device_test_db
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Device Simulator (.env)
```ini
DEVICE_ID=device-001
PORT=3001
BACKEND_API_URL=http://localhost:3000
NUM_DEVICES=5
SIMULATION_MODE=enabled
```

### Test Runner (.env)
```ini
BACKEND_API_URL=http://localhost:3000
DEVICE_SIMULATOR_URLS=http://localhost:3001,http://localhost:3002
TEST_TIMEOUT=30000
RETRY_ATTEMPTS=3
```

## 📊 Dashboard Features

| Feature | URL | Notes |
|---------|-----|-------|
| Dashboard | http://localhost | Real-time monitoring |
| Backend Health | http://localhost:3000/health | API status |
| Device 1 | http://localhost:3001 | Device APIs |
| Device 2 | http://localhost:3002 | Device APIs |
| Devices List | http://localhost:3000/api/devices | JSON endpoint |
| Test Results | http://localhost:3000/api/test-results | JSON endpoint |

## 🧪 Test Cases Summary

| Test | Target | Metric |
|------|--------|--------|
| Health Check | Device availability | Response status |
| Playback Start | Latency < 1s | Response time |
| Status API | Data validation | Response structure |
| Pause/Resume | State transitions | Playback state |
| Stop Command | Cleanup | State consistency |
| Metrics | Collection | Data availability |
| Failure Recovery | Retry logic | Recovery success |
| Concurrent | Load handling | Success rate |

## 🎯 Development Workflows

### Add New Test Case

1. Edit `test-runner/runTests.js`
2. Add test in `createTestSuite()` function:

```javascript
suite.addTest('New Test Name', async (deviceUrl) => {
  // Your test code
  if (condition) {
    throw new Error('Test failed');
  }
});
```

3. Run tests: `npm run run-tests`

### Add Device Endpoint

1. Edit `device-simulator/index.js`
2. Add endpoint:

```javascript
app.post('/new-endpoint', async (req, res) => {
  try {
    // Your code
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

3. Restart simulator: `docker-compose restart device-simulator-1`

### Scale Devices to 10

```bash
# Update docker-compose.yml to have 10 device services
# Then:
docker-compose up -d
```

Or manually:
```bash
for i in {1..10}; do
  PORT=$((3000 + i)) npm start &
done
```

## 🐛 Common Issues & Fixes

### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill it
kill -9 <PID>

# Or change port in .env
PORT=4000
```

### Database Connection Error

```bash
# Check PostgreSQL
docker-compose exec postgres psql -U postgres -d device_test_db -c "SELECT 1"

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

### Devices Not Connecting

```bash
# Check backend is running
curl http://localhost:3000/health

# Check device is running
curl http://localhost:3001/health

# View logs
docker-compose logs device-simulator-1
```

### WebSocket Connection Failed

```bash
# Check CORS in backend
# Update FRONTEND_URL in .env if needed
FRONTEND_URL=http://your-frontend-url
```

## 📈 Monitoring Commands

```bash
# Real-time metrics
watch 'curl -s http://localhost:3000/api/metrics | jq .'

# Device status
watch 'curl -s http://localhost:3000/api/devices | jq ".[] | {id, status}"'

# Test results count
curl -s http://localhost:3000/api/test-results | jq 'length'

# Failed tests
curl -s http://localhost:3000/api/test-results | jq '.[] | select(.failed > 0)'
```

## 🔄 Deployment Quick Steps

### Local Development
```bash
./setup.sh
open http://localhost
```

### Docker Compose
```bash
docker-compose up -d
docker-compose exec test-runner npm run run-tests
```

### Kubernetes
```bash
kubectl apply -f k8s/
kubectl get all
kubectl logs deployment/backend-api
```

## 📞 API Quick Reference

```bash
# Device APIs (http://localhost:3001)
POST /play {"mediaId": "test-123"}
POST /pause
POST /stop
GET /status
GET /metrics
GET /health

# Backend APIs (http://localhost:3000)
GET /api/devices
GET /api/devices/:id
GET /api/devices/:id/logs
GET /api/test-results
GET /api/test-results/:id
GET /api/metrics
POST /api/devices/heartbeat
POST /api/test-results
GET /health
```

## 🎓 Learning Path

1. **Understand Architecture**: Read `ARCHITECTURE.md`
2. **Setup Locally**: Run `./setup.sh`
3. **Explore Dashboard**: Open `http://localhost`
4. **Run Tests**: `npm run run-tests` in test-runner
5. **Check API**: Review `API.md`
6. **Scale Devices**: `docker-compose up -d --scale device-simulator=10`
7. **Deploy**: Follow `DEPLOYMENT.md`

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| README.md | Full project documentation |
| ARCHITECTURE.md | System design and components |
| API.md | Complete API reference |
| DEPLOYMENT.md | Deployment guides for all platforms |
| QUICK_REFERENCE.md | This file - quick lookups |

## 💡 Pro Tips

1. **Use `docker-compose logs -f`** to debug issues
2. **Scale devices first**, then run tests to see load handling
3. **Monitor dashboard** during test execution for real-time updates
4. **Check database** directly for advanced queries: `docker-compose exec postgres psql -U postgres`
5. **Keep terminals open** for logs when developing

## 🚨 Emergency Commands

```bash
# Reset everything
docker-compose down -v && docker-compose up -d

# Stop all services
docker-compose down

# Kill all node processes
pkill -f "node"

# Clear logs
docker-compose logs --tail 0

# Fresh database
docker-compose exec postgres dropdb -U postgres device_test_db
docker-compose exec postgres createdb -U postgres device_test_db
```

## ✅ Verification Checklist

- [ ] Docker Desktop running
- [ ] Port 80 (frontend) is free
- [ ] Port 3000 (backend) is free
- [ ] Port 5432 (database) is free
- [ ] Ports 3001-3005 (devices) are free
- [ ] PostgreSQL installed (local dev)
- [ ] Node.js 18+ installed
