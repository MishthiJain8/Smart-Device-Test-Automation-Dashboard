const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const http = require('http');
const socketIO = require('socket.io');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/device_test_db',
});

pool.on('error', (err) => {
  console.error('Unexpected pool error:', err);
});

// Initialize database tables
async function initializeDatabase() {
  try {
    await pool.query(`
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
        FOREIGN KEY (device_id) REFERENCES devices(id)
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
    `);
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// API Routes

// Register device heartbeat
app.post('/api/devices/heartbeat', async (req, res) => {
  try {
    const { deviceId, status, metrics, playback, firmwareVersion } = req.body;

    // Upsert device
    await pool.query(
      `INSERT INTO devices (id, status, firmware_version, last_heartbeat)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET
       status = $2, firmware_version = $3, last_heartbeat = CURRENT_TIMESTAMP`,
      [deviceId, status, firmwareVersion]
    );

    // Insert metrics
    await pool.query(
      `INSERT INTO device_metrics (device_id, uptime, error_count, successful_requests)
       VALUES ($1, $2, $3, $4)`,
      [deviceId, metrics.uptime, metrics.errorCount, metrics.successfulRequests]
    );

    // Emit real-time update via WebSocket
    io.emit('device-update', {
      deviceId,
      status,
      metrics,
      playback,
      firmwareVersion,
      timestamp: Date.now(),
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all devices
app.get('/api/devices', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, 
              dm.uptime, dm.error_count, dm.successful_requests,
              dm.recorded_at
       FROM devices d
       LEFT JOIN device_metrics dm ON d.id = dm.device_id
       ORDER BY dm.recorded_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get device by ID
app.get('/api/devices/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM devices WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get device error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get device logs
app.get('/api/devices/:id/logs', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM logs WHERE device_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [req.params.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Store test results
app.post('/api/test-results', async (req, res) => {
  try {
    const { timestamp, totalTests, passed, failed, averageLatency, results } = req.body;
    const suiteId = uuidv4();

    // Store suite summary
    await pool.query(
      `INSERT INTO test_suites (id, total_tests, passed, failed, average_latency)
       VALUES ($1, $2, $3, $4, $5)`,
      [suiteId, totalTests, passed, failed, averageLatency]
    );

    // Store individual results
    for (const result of results) {
      await pool.query(
        `INSERT INTO test_results (id, test_name, device_id, status, duration, error_message)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          uuidv4(),
          result.testName,
          result.deviceUrl,
          result.status,
          result.duration,
          result.error || null,
        ]
      );
    }

    // Emit test completion via WebSocket
    io.emit('test-completed', {
      suiteId,
      totalTests,
      passed,
      failed,
      averageLatency,
      timestamp,
    });

    res.json({ success: true, suiteId });
  } catch (error) {
    console.error('Store test results error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get test results
app.get('/api/test-results', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const result = await pool.query(
      `SELECT * FROM test_suites ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get test results error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get detailed test results by suite ID
app.get('/api/test-results/:id', async (req, res) => {
  try {
    const suiteResult = await pool.query(
      `SELECT * FROM test_suites WHERE id = $1`,
      [req.params.id]
    );

    const detailsResult = await pool.query(
      `SELECT * FROM test_results WHERE id LIKE $1 ORDER BY created_at DESC`,
      [`${req.params.id}%`]
    );

    res.json({
      suite: suiteResult.rows[0],
      details: detailsResult.rows,
    });
  } catch (error) {
    console.error('Get test details error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get metrics
app.get('/api/metrics', async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;

    let whereClause = '';
    if (timeRange === '24h') {
      whereClause = "AND recorded_at > NOW() - INTERVAL '24 hours'";
    } else if (timeRange === '7d') {
      whereClause = "AND recorded_at > NOW() - INTERVAL '7 days'";
    }

    const result = await pool.query(
      `SELECT device_id, AVG(uptime) as avg_uptime, AVG(error_count) as avg_errors,
              AVG(successful_requests) as avg_success, COUNT(*) as data_points
       FROM device_metrics
       WHERE 1=1 ${whereClause}
       GROUP BY device_id
       ORDER BY device_id`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({ status: 'healthy', timestamp: Date.now() });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });

  socket.on('request-device-list', async () => {
    try {
      const result = await pool.query('SELECT * FROM devices ORDER BY last_heartbeat DESC');
      socket.emit('device-list', result.rows);
    } catch (error) {
      console.error('Error fetching device list:', error);
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  await initializeDatabase();
  console.log(`🚀 Backend API running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing connections...');
  await pool.end();
  process.exit(0);
});
