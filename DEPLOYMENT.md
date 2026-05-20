# Deployment Guide

## Local Development Deployment

### Prerequisites

```bash
# macOS
brew install node docker docker-compose postgresql

# Linux
sudo apt-get install nodejs npm docker.io docker-compose postgresql

# Windows
# Download and install from respective websites
```

### Quick Start

```bash
# Make setup script executable
chmod +x setup.sh

# Run setup
./setup.sh

# Verify services
open http://localhost     # Dashboard
open http://localhost:3000  # API health check
```

## Docker Compose Deployment

### Start Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### Run Tests

```bash
# Run tests once
docker-compose exec test-runner npm run run-tests

# Run with custom devices
docker-compose exec test-runner bash -c \
  'DEVICE_SIMULATOR_URLS=http://device-simulator-1:3001,http://device-simulator-2:3001 npm run run-tests'
```

### Scale Devices

```bash
# Add more device simulators
docker-compose up -d --scale device-simulator=10

# Note: Adjust port mapping in docker-compose.yml manually for additional services
```

## Production Deployment on Kubernetes

### Prerequisites

- Kubernetes cluster (1.20+)
- kubectl configured
- Container registry (Docker Hub, ECR, etc.)

### Build & Push Images

```bash
# Login to registry
docker login

# Build images
docker build -t your-registry/backend-api:latest ./backend-api
docker build -t your-registry/device-simulator:latest ./device-simulator
docker build -t your-registry/test-runner:latest ./test-runner

# Push images
docker push your-registry/backend-api:latest
docker push your-registry/device-simulator:latest
docker push your-registry/test-runner:latest
```

### Create Kubernetes Manifests

Create `k8s/backend-api-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend-api
  template:
    metadata:
      labels:
        app: backend-api
    spec:
      containers:
      - name: backend-api
        image: your-registry/backend-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: connection-string
        - name: NODE_ENV
          value: production
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: backend-api-service
spec:
  selector:
    app: backend-api
  ports:
  - protocol: TCP
    port: 3000
    targetPort: 3000
  type: LoadBalancer
```

Create `k8s/device-simulator-statefulset.yaml`:

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: device-simulator
spec:
  serviceName: device-simulator
  replicas: 5
  selector:
    matchLabels:
      app: device-simulator
  template:
    metadata:
      labels:
        app: device-simulator
    spec:
      containers:
      - name: device-simulator
        image: your-registry/device-simulator:latest
        ports:
        - containerPort: 3001
        env:
        - name: BACKEND_API_URL
          value: http://backend-api-service:3000
        - name: DEVICE_ID
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        resources:
          requests:
            memory: "64Mi"
            cpu: "100m"
          limits:
            memory: "128Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: device-simulator
spec:
  clusterIP: None
  selector:
    app: device-simulator
  ports:
  - port: 3001
    targetPort: 3001
```

Create `k8s/postgres-secret.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
type: Opaque
stringData:
  connection-string: postgresql://postgres:your-secure-password@postgres-service:5432/device_test_db
```

### Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace smart-device

# Create secrets
kubectl apply -f k8s/postgres-secret.yaml -n smart-device

# Deploy services
kubectl apply -f k8s/backend-api-deployment.yaml -n smart-device
kubectl apply -f k8s/device-simulator-statefulset.yaml -n smart-device

# Check deployment status
kubectl get all -n smart-device
kubectl logs -f deployment/backend-api -n smart-device
```

## Cloud Provider Deployments

### AWS ECS

```bash
# Create ECR repository
aws ecr create-repository --repository-name smart-device-backend

# Push image
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com
docker tag smart-device-backend:latest your-account.dkr.ecr.us-east-1.amazonaws.com/smart-device-backend:latest
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/smart-device-backend:latest

# Create ECS task definition (ecs-task-definition.json):
{
  "family": "smart-device-backend",
  "containerDefinitions": [
    {
      "name": "backend-api",
      "image": "your-account.dkr.ecr.us-east-1.amazonaws.com/smart-device-backend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "hostPort": 3000
        }
      ],
      "environment": [
        {
          "name": "DATABASE_URL",
          "value": "postgresql://user:password@rds-endpoint:5432/device_test_db"
        }
      ]
    }
  ]
}

# Register task definition
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json
```

### Azure Container Instances

```bash
# Create container group
az container create \
  --resource-group smart-device \
  --name backend-api \
  --image your-registry.azurecr.io/backend-api:latest \
  --cpu 1 \
  --memory 1 \
  --environment-variables \
    DATABASE_URL="postgresql://user:password@postgres:5432/device_test_db" \
    NODE_ENV="production" \
  --ports 3000
```

### Google Cloud Run

```bash
# Build and push image
gcloud builds submit \
  --tag gcr.io/your-project/backend-api:latest \
  ./backend-api

# Deploy to Cloud Run
gcloud run deploy backend-api \
  --image gcr.io/your-project/backend-api:latest \
  --platform managed \
  --region us-central1 \
  --memory 512Mi \
  --set-env-vars DATABASE_URL="postgresql://..."
```

## Database Setup for Production

### PostgreSQL Backup

```bash
# Backup database
pg_dump -h localhost -U postgres -d device_test_db > backup.sql

# Restore database
psql -h localhost -U postgres -d device_test_db < backup.sql

# Automated backup (cron job)
0 2 * * * pg_dump -h localhost -U postgres device_test_db | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz
```

### Database Replication

```sql
-- On primary server
CREATE PUBLICATION prod_pub FOR TABLE devices, device_metrics, test_results, test_suites;

-- On replica server
CREATE SUBSCRIPTION prod_sub CONNECTION 'dbname=device_test_db host=primary' 
  PUBLICATION prod_pub;
```

## Monitoring & Logging

### Health Checks

```bash
# Backend API
curl http://localhost:3000/health

# Devices
curl http://localhost:3001/health

# All devices
for i in 3001 3002 3003 3004 3005; do
  echo "Port $i: $(curl -s http://localhost:$i/health | jq -r '.status')"
done
```

### Log Aggregation

```bash
# Docker logs
docker-compose logs backend-api | grep ERROR

# Kubernetes logs
kubectl logs deployment/backend-api -n smart-device

# Tail logs
kubectl logs -f deployment/backend-api -n smart-device
```

## Performance Tuning

### Database Optimization

```sql
-- Analyze tables
ANALYZE;

-- Vacuum
VACUUM ANALYZE;

-- Connection pool size
SHOW max_connections;
ALTER SYSTEM SET max_connections = 100;
```

### Node.js Optimization

```bash
# Set memory limit
NODE_OPTIONS="--max-old-space-size=2048" npm start

# Enable clustering (multiple CPU cores)
NODE_CLUSTER_SIZE=4 npm start
```

## Rollback Procedures

### Docker Compose

```bash
# Revert to previous image
docker-compose down
git checkout HEAD~1 docker-compose.yml
docker-compose up -d
```

### Kubernetes

```bash
# Check rollout history
kubectl rollout history deployment/backend-api -n smart-device

# Rollback to previous version
kubectl rollout undo deployment/backend-api -n smart-device

# Rollback to specific revision
kubectl rollout undo deployment/backend-api --to-revision=2 -n smart-device
```

## Troubleshooting Deployment

### Check Service Status

```bash
# Docker Compose
docker-compose ps
docker-compose logs -f

# Kubernetes
kubectl get all -n smart-device
kubectl describe pod <pod-name> -n smart-device
kubectl logs <pod-name> -n smart-device
```

### Common Issues

**Database Connection Failed**
```bash
# Check PostgreSQL service
docker-compose exec postgres psql -U postgres -d device_test_db -c "SELECT NOW();"
```

**Devices Not Connecting**
```bash
# Verify backend is accessible
curl http://backend-api:3000/health
```

**Out of Memory**
```bash
# Increase limits in docker-compose.yml
mem_limit: 1gb
```

## Scaling Configuration

### For 5-10 Devices
- Single backend instance
- 1 PostgreSQL instance
- Sufficient for development/testing

### For 10-50 Devices
- 2-3 backend instances (load balanced)
- 1 PostgreSQL primary + 1 read replica
- Caching layer (Redis) optional

### For 50+ Devices
- 5-10 backend instances (auto-scaling)
- PostgreSQL cluster with replication
- Message queue (RabbitMQ) for test distribution
- Distributed tracing (Jaeger)
- Centralized logging (ELK stack)
