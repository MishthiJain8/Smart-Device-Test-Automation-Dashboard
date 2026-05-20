const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Test suite configuration
class TestSuite {
  constructor() {
    this.tests = [];
    this.results = [];
  }

  addTest(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async run(deviceUrl) {
    const suiteId = uuidv4();
    console.log(`\n🧪 Running test suite on ${deviceUrl}`);

    for (const test of this.tests) {
      try {
        console.log(`   ├─ ${test.name}...`);
        const startTime = Date.now();
        await test.testFn(deviceUrl);
        const duration = Date.now() - startTime;

        this.results.push({
          suiteId,
          testName: test.name,
          deviceUrl,
          status: 'passed',
          duration,
          timestamp: Date.now(),
        });

        console.log(`   │  ✓ Passed (${duration}ms)`);
      } catch (error) {
        const duration = Date.now() - startTime;
        this.results.push({
          suiteId,
          testName: test.name,
          deviceUrl,
          status: 'failed',
          error: error.message,
          duration,
          timestamp: Date.now(),
        });

        console.log(`   │  ✗ Failed: ${error.message}`);
      }
    }

    return this.results;
  }

  async runOnMultipleDevices(deviceUrls) {
    const allResults = [];

    // Run tests in parallel across all devices
    const promises = deviceUrls.map(url => this.run(url));
    const results = await Promise.allSettled(promises);

    results.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        allResults.push(...result.value);
      } else {
        console.error(`Device ${deviceUrls[idx]} test suite failed:`, result.reason);
      }
    });

    return allResults;
  }

  printReport(results) {
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const avgLatency = totalDuration / results.length;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 TEST REPORT`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Total Tests: ${results.length}`);
    console.log(`✓ Passed: ${passed} (${((passed / results.length) * 100).toFixed(2)}%)`);
    console.log(`✗ Failed: ${failed} (${((failed / results.length) * 100).toFixed(2)}%)`);
    console.log(`Average Latency: ${avgLatency.toFixed(2)}ms`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`${'='.repeat(60)}\n`);

    // Group failures
    const failures = results.filter(r => r.status === 'failed');
    if (failures.length > 0) {
      console.log('❌ Failed Tests:');
      failures.forEach(f => {
        console.log(`   - ${f.testName} on ${f.deviceUrl}: ${f.error}`);
      });
      console.log();
    }

    return { passed, failed, totalDuration, avgLatency };
  }
}

// Define test cases
function createTestSuite() {
  const suite = new TestSuite();

  // Test 1: Health Check
  suite.addTest('Health Check', async (deviceUrl) => {
    const response = await axios.get(`${deviceUrl}/health`, {
      timeout: 30000,
    });
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
  });

  // Test 2: Playback Start Performance
  suite.addTest('Playback Start Time < 1s', async (deviceUrl) => {
    const startTime = Date.now();
    const response = await axios.post(`${deviceUrl}/play`, {
      mediaId: 'test-media-123',
    });
    const duration = Date.now() - startTime;

    if (duration > 1000) {
      throw new Error(`Playback start took ${duration}ms, threshold is 1000ms`);
    }

    if (response.data.state !== 'playing') {
      throw new Error('Playback state not set to playing');
    }
  });

  // Test 3: Device Status Validation
  suite.addTest('Status API Response Valid', async (deviceUrl) => {
    const response = await axios.get(`${deviceUrl}/status`, {
      timeout: 30000,
    });

    if (!response.data.deviceId) {
      throw new Error('Missing deviceId in response');
    }

    if (!response.data.status) {
      throw new Error('Missing status in response');
    }

    if (!response.data.playback) {
      throw new Error('Missing playback object in response');
    }
  });

  // Test 4: Pause and Resume
  suite.addTest('Pause/Resume Cycle', async (deviceUrl) => {
    // Start playback
    await axios.post(`${deviceUrl}/play`, {
      mediaId: 'test-media-456',
    });

    // Pause
    const pauseResponse = await axios.post(`${deviceUrl}/pause`);
    if (pauseResponse.data.state !== 'paused') {
      throw new Error('Pause command failed');
    }

    // Resume
    const playResponse = await axios.post(`${deviceUrl}/play`, {
      mediaId: 'test-media-456',
    });
    if (playResponse.data.state !== 'playing') {
      throw new Error('Resume command failed');
    }
  });

  // Test 5: Stop Command
  suite.addTest('Stop Command Execution', async (deviceUrl) => {
    await axios.post(`${deviceUrl}/play`, {
      mediaId: 'test-media-789',
    });

    const stopResponse = await axios.post(`${deviceUrl}/stop`);
    if (stopResponse.data.state !== 'stopped') {
      throw new Error('Stop command failed');
    }

    const statusResponse = await axios.get(`${deviceUrl}/status`);
    if (statusResponse.data.playback.state !== 'stopped') {
      throw new Error('Device state not stopped after stop command');
    }
  });

  // Test 6: Metrics Collection
  suite.addTest('Metrics Collection Available', async (deviceUrl) => {
    const response = await axios.get(`${deviceUrl}/metrics`);

    if (!response.data.metrics) {
      throw new Error('Missing metrics object');
    }

    if (typeof response.data.metrics.errorCount !== 'number') {
      throw new Error('Invalid error count metric');
    }

    if (typeof response.data.metrics.successfulRequests !== 'number') {
      throw new Error('Invalid successful requests metric');
    }
  });

  // Test 7: Failure Recovery
  suite.addTest('Failure Recovery & Retry', async (deviceUrl) => {
    let recovered = false;
    for (let i = 0; i < 3; i++) {
      try {
        const response = await axios.get(`${deviceUrl}/health`, {
          timeout: 30000,
        });
        if (response.status === 200) {
          recovered = true;
          break;
        }
      } catch (error) {
        console.log(`      Attempt ${i + 1} failed, retrying...`);
      }
    }

    if (!recovered) {
      throw new Error('Device did not recover after 3 retry attempts');
    }
  });

  // Test 8: Concurrent Request Handling
  suite.addTest('Concurrent Request Handling', async (deviceUrl) => {
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(axios.get(`${deviceUrl}/status`));
    }

    const results = await Promise.allSettled(requests);
    const successful = results.filter(r => r.status === 'fulfilled').length;

    if (successful < 4) {
      throw new Error(`Only ${successful}/5 concurrent requests succeeded`);
    }
  });

  return suite;
}

// Main test runner
async function runTests() {
  const deviceUrls = (process.env.DEVICE_SIMULATOR_URLS || 'http://localhost:3001').split(',');

  console.log('🚀 Smart Device Test Automation Engine');
  console.log(`📱 Testing ${deviceUrls.length} device(s)`);

  const suite = createTestSuite();
  const allResults = await suite.runOnMultipleDevices(deviceUrls);

  const report = suite.printReport(allResults);

  // Send results to backend
  try {
    await axios.post(
      `${process.env.BACKEND_API_URL || 'http://localhost:3000'}/api/test-results`,
      {
        timestamp: Date.now(),
        totalTests: allResults.length,
        passed: report.passed,
        failed: report.failed,
        averageLatency: report.avgLatency,
        results: allResults,
      }
    );
    console.log('✅ Results sent to backend');
  } catch (error) {
    console.error('⚠️  Could not send results to backend:', error.message);
  }

  process.exit(report.failed > 0 ? 1 : 0);
}

module.exports = { TestSuite, createTestSuite, runTests };

// Run if this is the main module
if (require.main === module) {
  runTests();
}
