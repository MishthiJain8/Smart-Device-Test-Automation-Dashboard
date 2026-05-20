# Troubleshooting Guide

## Service Issues

### Backend API Won't Start

**Symptom**: `docker-compose logs backend-api` shows connection errors

**Solutions**:

1. Check database is running:
```bash
docker-compose ps postgres
docker-compose logs postgres
```

2. Verify database connection string:
```bash
docker-compose exec postgres psql -U postgres -d device_test_db -c "SELECT 1"
```

3. Reset database:
```bash
docker-compose down -v
docker-compose up -d postgres
sleep 5
docker-compose up -d backend-api
```

4. Check port conflicts:
```bash
lsof -i :3000
# If in use, change PORT in .env
```

### Device Simulator Can't Connect to Backend

**Symptom**: Device logs show `Failed to send heartbeat`

**Solutions**:

1. Verify backend URL:
```bash
# From device container perspective
docker-compose exec device-simulator-1 curl http://backend-api:3000/health
```

2. Check BACKEND_API_URL in device .env:
```bash
# Should be http://backend-api:3000 (Docker DNS)
# Not http://localhost:3000
```

3. Check network connectivity:
```bash
docker-compose ps
# Verify all services have healthy status
```

4. Restart device:
```bash
docker-compose restart device-simulator-1
```

### Tests Not Running

**Symptom**: `docker-compose exec test-runner npm run run-tests` hangs or fails

**Solutions**:

1. Verify test runner dependencies:
```bash
docker-compose exec test-runner npm ls
```

2. Check device URLs are accessible:
```bash
docker-compose exec test-runner curl http://device-simulator-1:3001/health
```

3. Verify DEVICE_SIMULATOR_URLS environment:
```bash
docker-compose exec test-runner env | grep DEVICE
```

4. Run tests with verbose output:
```bash
docker-compose exec test-runner DEBUG=* npm run run-tests
```

## Database Issues

### PostgreSQL Won't Start

**Symptom**: `docker-compose logs postgres` shows errors

**Solutions**:

1. Check volume permissions:
```bash
docker-compose down -v  # Remove all volumes
docker-compose up -d postgres
sleep 10  # Wait for initialization
```

2. Check disk space:
```bash
df -h | grep /var/lib/docker
```

3. Rebuild container:
```bash
docker-compose build --no-cache postgres
docker-compose up -d postgres
```

### Database Connection Timeout

**Symptom**: `timeout expired` in logs

**Solutions**:

1. Increase pool timeout in backend .env:
```ini
DB_CONNECTION_TIMEOUT=5000  # 5 seconds
DB_POOL_SIZE=50
```

2. Check database process:
```bash
docker-compose exec postgres ps aux | grep postgres
```

3. Verify disk space on database:
```bash
docker-compose exec postgres df -h
```

### Table Already Exists Errors

**Symptom**: Database initialization fails with duplicate table errors

**Solutions**:

1. Database already initialized - just ignore the error
2. To reset completely:
```bash
docker-compose down -v
docker-compose up -d
```

## Network Issues

### Services Can't Reach Each Other

**Symptom**: Connection refused errors between containers

**Solutions**:

1. Verify Docker network:
```bash
docker network ls
docker network inspect smart-device-framework_default
```

2. Check service names in URLs:
```bash
# Correct (Docker DNS resolution)
http://backend-api:3000

# Wrong
http://localhost:3000
http://127.0.0.1:3000
```

3. Rebuild network:
```bash
docker-compose down
docker-compose up -d
```

### External Port Access Issues

**Symptom**: `curl http://localhost:3000` connection refused

**Solutions**:

1. Check port mapping:
```bash
docker-compose ps
# Verify PORT mappings show correctly
```

2. Verify service is actually listening:
```bash
docker-compose exec backend-api ss -tlnp | grep 3000
```

3. Check firewall rules:
```bash
# macOS
sudo lsof -i :3000

# Linux
sudo netstat -tlnp | grep 3000
```

4. Restart service:
```bash
docker-compose restart backend-api
```

## Performance Issues

### High CPU Usage

**Symptom**: `docker stats` shows high CPU percentage

**Solutions**:

1. Check running processes:
```bash
docker-compose exec backend-api top
```

2. Reduce polling interval:
```bash
# In frontend, increase update interval from 5s to 10s
```

3. Reduce number of devices:
```bash
docker-compose down device-simulator-4 device-simulator-5
```

4. Check for memory leaks:
```bash
docker-compose exec backend-api node --max-old-space-size=2048
```

### High Memory Usage

**Symptom**: `docker stats` shows memory near container limit

**Solutions**:

1. Increase container memory limit in docker-compose.yml:
```yaml
mem_limit: 1gb  # Increase from default
```

2. Enable memory swapping:
```bash
docker-compose down
docker-compose up -d
```

3. Check for memory leaks:
```bash
docker-compose exec backend-api node --expose-gc index.js
```

4. Clear old metrics from database:
```bash
docker-compose exec postgres psql -U postgres -d device_test_db \
  -c "DELETE FROM device_metrics WHERE recorded_at < NOW() - INTERVAL '7 days';"
```

### Slow Response Times

**Symptom**: Tests report average latency > 1000ms

**Solutions**:

1. Check database query performance:
```bash
docker-compose logs backend-api | grep "query time"
```

2. Optimize queries - add indexes:
```bash
docker-compose exec postgres psql -U postgres -d device_test_db \
  -c "CREATE INDEX idx_metrics_device_date ON device_metrics(device_id, recorded_at);"
```

3. Reduce device count temporarily:
```bash
docker-compose ps | grep device
# Scale down if too many
```

4. Check system resources:
```bash
docker stats
top
```

## Data Issues

### Lost Data After Restart

**Symptom**: Database empty after `docker-compose up`

**Solutions**:

1. Verify volume persistence:
```bash
# Check docker-compose.yml has volumes section
volumes:
  postgres_data:
```

2. Check volume exists:
```bash
docker volume ls | grep postgres_data
```

3. Check volume mount point:
```bash
docker-compose exec postgres mount | grep postgres
```

4. Recreate volume:
```bash
docker volume create smart-device-framework_postgres_data
docker-compose up -d postgres
```

### Test Results Not Saving

**Symptom**: Run tests, but no results appear in API

**Solutions**:

1. Check backend received results:
```bash
docker-compose logs backend-api | grep "test-results"
```

2. Verify database inserts:
```bash
docker-compose exec postgres psql -U postgres -d device_test_db \
  -c "SELECT COUNT(*) FROM test_results;"
```

3. Check test runner is sending results:
```bash
docker-compose exec test-runner npm run run-tests 2>&1 | grep "Results sent"
```

## Frontend Issues

### Dashboard Not Loading

**Symptom**: Browser shows blank page or connection errors

**Solutions**:

1. Check Nginx is running:
```bash
docker-compose logs frontend
```

2. Check frontend volume mount:
```bash
docker-compose exec frontend ls -la /usr/share/nginx/html/
```

3. Verify backend API accessible:
```bash
curl http://localhost:3000/health
```

4. Check browser console for errors (F12)

5. Restart frontend:
```bash
docker-compose restart frontend
```

### WebSocket Connection Failed

**Symptom**: Browser console shows WebSocket errors

**Solutions**:

1. Check CORS configuration in backend:
```bash
# Verify FRONTEND_URL in backend .env
FRONTEND_URL=http://localhost
```

2. Restart backend:
```bash
docker-compose restart backend-api
```

3. Clear browser cache:
```bash
# Cmd+Shift+R (macOS)
# Ctrl+Shift+R (Linux/Windows)
```

4. Check WebSocket is enabled:
```bash
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost/socket.io/
```

## Docker Issues

### Image Build Fails

**Symptom**: `docker-compose build` errors

**Solutions**:

1. Clear build cache:
```bash
docker-compose build --no-cache
```

2. Check Node version:
```bash
docker-compose exec backend-api node -v
```

3. Rebuild specific service:
```bash
docker-compose build --no-cache backend-api
```

4. Check Dockerfile syntax:
```bash
docker build --file=backend-api/Dockerfile ./backend-api
```

### Container Keeps Restarting

**Symptom**: `docker-compose ps` shows container constantly restarting

**Solutions**:

1. Check startup logs:
```bash
docker-compose logs backend-api
```

2. Check resource limits:
```bash
docker-compose ps  # Check memory/CPU
```

3. Check environment variables:
```bash
docker-compose config | grep -A 20 "backend-api:"
```

4. Increase startup wait time:
```bash
sleep 10 && docker-compose up -d
```

## Debugging Commands

### Enable Debug Logging

```bash
# Backend
docker-compose exec backend-api DEBUG=* npm start

# Device Simulator
docker-compose exec device-simulator-1 DEBUG=* npm start
```

### Inspect Container

```bash
# Shell into container
docker-compose exec backend-api /bin/sh

# View environment
docker-compose exec backend-api env

# View running processes
docker-compose exec backend-api ps aux
```

### Network Debugging

```bash
# Check DNS resolution
docker-compose exec backend-api nslookup postgres

# Test connectivity
docker-compose exec backend-api ping postgres

# Check listening ports
docker-compose exec backend-api ss -tlnp
```

### Database Debugging

```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d device_test_db

# List tables
\dt

# Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Check recent records
SELECT * FROM devices ORDER BY last_heartbeat DESC LIMIT 5;
```

## Getting Help

1. **Check logs first**: `docker-compose logs`
2. **Review documentation**: README.md, ARCHITECTURE.md
3. **Check configuration**: Verify .env files
4. **Restart services**: `docker-compose restart`
5. **Reset everything**: `docker-compose down -v && docker-compose up -d`

## Still Having Issues?

Create an issue with:
1. Error message from logs
2. Output of `docker-compose ps`
3. Output of `docker-compose config`
4. Steps to reproduce
5. Expected behavior
