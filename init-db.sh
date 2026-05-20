#!/bin/bash

# Database initialization script

echo "🗄️  Initializing PostgreSQL Database"

# Create database
createdb device_test_db 2>/dev/null || true

# Run SQL initialization
psql device_test_db << 'EOF'
CREATE TABLE IF NOT EXISTS devices (
  id VARCHAR(255) PRIMARY KEY,
  status VARCHAR(50),
  firmware_version VARCHAR(50),
  last_heartbeat TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS device_metrics (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(255),
  uptime INTEGER,
  error_count INTEGER,
  successful_requests INTEGER,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS test_results (
  id VARCHAR(255) PRIMARY KEY,
  test_name VARCHAR(255),
  device_id VARCHAR(255),
  status VARCHAR(50),
  duration INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_suites (
  id VARCHAR(255) PRIMARY KEY,
  total_tests INTEGER,
  passed INTEGER,
  failed INTEGER,
  average_latency NUMERIC,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(255),
  level VARCHAR(50),
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_metrics_device ON device_metrics(device_id);
CREATE INDEX IF NOT EXISTS idx_test_results_device ON test_results(device_id);
CREATE INDEX IF NOT EXISTS idx_logs_device ON logs(device_id);

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

EOF

echo "✅ Database initialized successfully"
