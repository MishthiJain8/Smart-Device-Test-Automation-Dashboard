# Smart Device Test Automation Framework - Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend Layer                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │        React Dashboard (Nginx)                            │  │
│  │  • Real-time device monitoring                            │  │
│  │  • Test result visualization                              │  │
│  │  • Performance metrics charts                             │  │
│  │  • Live WebSocket updates                                 │  │
│  └────────┬──────────────────────────────────────┬───────────┘  │
└───────────┼──────────────────────────────────────┼───────────────┘
            │ HTTP/REST                             │ WebSocket
┌───────────▼──────────────────────────────────────▼───────────────┐
│                     API Layer                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │        Backend API Service (Node.js Express)              │  │
│  │  • Device management endpoints                            │  │
│  │  • Test result storage & retrieval                        │  │
│  │  • Metrics aggregation                                    │  │
│  │  • WebSocket server for real-time updates                │  │
│  └────────┬──────────────────────────────────────┬───────────┘  │
└───────────┼──────────────────────────────────────┼───────────────┘
            │ REST API                              │ SQL
┌───────────▼──────────────────────────────────────▼───────────────┐
│                  Data & Orchestration Layer                      │
│  ┌──────────────────────┐  ┌────────────────────────────────┐   │
│  │   PostgreSQL DB      │  │  Device Manager & Collector    │   │
│  │                      │  │  • Heartbeat aggregation       │   │
│  │ • Devices table      │  │  • Metrics collection          │   │
│  │ • Metrics table      │  │  • Device lifecycle mgmt       │   │
│  │ • Test results       │  │  • Error tracking              │   │
│  │ • Logs & events      │  └────────────────────────────────┘   │
│  └──────────────────────┘                                        │
└───────────────────────────────────────────────────────────────────┘
            │
            └─────────────────────┬──────────────────────┐
                                  │
        ┌─────────────────────────▼──────────────────────┐
        │         Device Simulation & Testing Layer      │
        │  ┌──────────────────────────────────────────┐  │
        │  │    Test Automation Engine                │  │
        │  │  • Test case execution                   │  │
        │  │  • Results aggregation                   │  │
        │  │  • Parallel test execution               │  │
        │  │  • Failure analysis & retry logic        │  │
        │  └──────────────────────────────────────────┘  │
        │  ┌──────────────────────────────────────────┐  │
        │  │    Simulated Device Fleet (5-20)         │  │
        │  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐ │  │
        │  │  │Dev 1 │  │Dev 2 │  │Dev 3 │  │Dev N │ │  │
        │  │  │      │  │      │  │      │  │      │ │  │
        │  │  │REST  │  │REST  │  │REST  │  │REST  │ │  │
        │  │  │APIs  │  │APIs  │  │APIs  │  │APIs  │ │  │
        │  │  └──────┘  └──────┘  └──────┘  └──────┘ │  │
        │  │                                          │  │
        │  │  • Realistic failure modes               │  │
        │  │  • Latency simulation                    │  │
        │  │  • Crash recovery testing                │  │
        │  │  • Firmware versioning                   │  │
        │  │  • Concurrent load handling              │  │
        │  └──────────────────────────────────────────┘  │
        └──────────────────────────────────────────────────┘
```

## Component Interactions

### 1. Device Lifecycle

```
Device Startup
    │
    ├─→ Initialize state (online, playback stopped, metrics 0)
    │
    ├─→ Start heartbeat thread (5s interval)
    │
    └─→ Send heartbeat to Backend API
        │
        ├─→ Backend stores device info
        │
        ├─→ Backend broadcasts update via WebSocket
        │
        └─→ Dashboard receives and displays device
```

### 2. Test Execution Flow

```
Test Suite Start
    │
    ├─→ Fetch device URLs from environment
    │
    ├─→ For each device (parallel):
    │   │
    │   ├─→ Run test cases
    │   │
    │   ├─→ Collect results (pass/fail/duration)
    │   │
    │   └─→ Store metrics
    │
    ├─→ Aggregate results
    │
    ├─→ Send to Backend API
    │
    ├─→ Backend stores in database
    │
    ├─→ Broadcast completion event via WebSocket
    │
    └─→ Dashboard updates test results display
```

### 3. Failure Mode Simulation

```
Each Request
    │
    ├─→ Simulate failure mode (70% normal, 15% latency spike, etc.)
    │
    ├─→ Add artificial delay based on mode
    │
    ├─→ 70% → 10ms latency (normal)
    │   15% → 1-6s latency (spike)
    │   8% → 0.5-2.5s latency (slow)
    │   5% → Timeout (network failure)
    │   2% → Crash & restart
    │
    └─→ Return response or error
```

## Data Flow Diagram

```
DEVICES
  │
  ├─→ Heartbeat (5s)
  │   │
  │   └─→ Backend API
  │       │
  │       ├─→ Store in PostgreSQL
  │       │
  │       ├─→ Broadcast via WebSocket
  │       │
  │       └─→ Dashboard updates
  │
  ├─→ Test Requests
  │   │
  │   ├─→ /play, /pause, /stop, /status
  │   │
  │   ├─→ Test Runner measures latency
  │   │
  │   └─→ Aggregates into test results
  │
  └─→ Metrics
      │
      ├─→ Error count
      │
      ├─→ Success count
      │
      ├─→ Uptime
      │
      └─→ Response times

TEST RESULTS
  │
  └─→ Backend API
      │
      ├─→ PostgreSQL
      │   │
      │   └─→ Query for dashboard
      │
      ├─→ WebSocket broadcasts
      │
      └─→ Dashboard displays
          │
          ├─→ Test history table
          │
          ├─→ Pass/fail stats
          │
          └─→ Latency metrics
```

## Scaling Strategy

### Horizontal Scaling

```
Single Instance:          Multi-Instance:
  Backend                     Backend LB
    │                            │ │ │
  5 Devices               Backend Backend Backend
    │                        │      │      │
  Tests                    Devices Devices Devices
                             │      │      │
                            DB (Primary - Replica)
```

### Database Optimization

- Partitioning by device_id
- Indexing on commonly queried fields
- Connection pooling (20-40 connections)
- Query optimization for time-range queries

## Deployment Strategies

### Development
- All services in docker-compose
- Single database
- Hot reload enabled
- Debug logging

### Staging
- Multiple backend instances
- Load balancer
- Database replication
- Performance monitoring

### Production
- Kubernetes deployment
- Auto-scaling groups
- Database backup/recovery
- CDN for frontend
- Distributed tracing
- Centralized logging

## Performance Considerations

### Latency Targets

| Operation | Target | Actual |
|-----------|--------|--------|
| Device /play | < 1s | 200-300ms |
| Device /pause | < 1s | 100-200ms |
| API device fetch | < 500ms | 50-150ms |
| Dashboard update | < 2s | WebSocket instant |

### Throughput

- 5-20 concurrent devices
- 5 devices × 8 tests = 40 concurrent API calls
- Can scale to 100+ devices with load balancing

### Memory Usage

- Node.js backend: ~150MB
- Device simulator: ~50MB each
- Test runner: ~100MB
- Total for 5 devices: ~500MB

## Monitoring & Observability

### Metrics Collected

- Request latency (p50, p95, p99)
- Error rates by type
- Device uptime percentage
- Test pass rates
- Database query times

### Logging

- Application logs (backend, devices)
- Test execution logs
- Database query logs
- Error stack traces

### Alerting

- Device offline > 5 minutes
- Test failure rate > 10%
- API latency > 2s (p95)
- Database connection errors

## Security Considerations

- API input validation
- SQL injection prevention (parameterized queries)
- CORS configuration
- Rate limiting (optional)
- Authentication/Authorization (future enhancement)
- TLS/HTTPS in production

## Technology Stack Rationale

- **Node.js**: Event-driven, non-blocking I/O, perfect for concurrent device simulation
- **Express**: Lightweight, well-tested, extensive middleware ecosystem
- **PostgreSQL**: ACID compliance, excellent for time-series device metrics
- **WebSocket**: Real-time dashboard updates without polling
- **Docker**: Consistent environment across dev/staging/production
- **React**: Responsive, component-based UI (extendable)
