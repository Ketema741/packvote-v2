const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const DEFAULT_PORT = 3000;
const PORT = process.env.PORT || DEFAULT_PORT;

// Simple server-side logging function that sanitizes sensitive data
const serverLog = {
  info: (message) => {
    // In a production environment, this could be replaced with a proper logging library
    console.info(`[INFO] ${message}`);
  },
  error: (message, error) => {
    // Sanitize error details to avoid leaking sensitive information
    const sanitizedError = error ? {
      message: error.message,
      name: error.name
    } : null;
    console.error(`[ERROR] ${message}`, sanitizedError);
  }
};

// Enable CORS
app.use(cors());

// Serve static files from the 'build' directory
app.use(express.static(path.join(__dirname, 'build')));

// Global metrics object (in production, this would be stored in a more persistent way)
const metrics = {
  pageLoads: 0,
  apiCalls: 0,
  totalErrors: 0,
  navigationCount: 0,
  startTime: Date.now()
};

// Metrics endpoint - returns Prometheus-compatible metrics
app.get('/metrics', (req, res) => {
  const MILLISECONDS_PER_SECOND = 1000;
  const uptime = (Date.now() - metrics.startTime) / MILLISECONDS_PER_SECOND;

  // Format metrics for Prometheus
  const prometheusMetrics = [
    '# HELP packvote_ui_page_loads_total Total number of page loads',
    '# TYPE packvote_ui_page_loads_total counter',
    `packvote_ui_page_loads_total ${metrics.pageLoads}`,
    '# HELP packvote_ui_api_calls_total Total number of API calls',
    '# TYPE packvote_ui_api_calls_total counter',
    `packvote_ui_api_calls_total ${metrics.apiCalls}`,
    '# HELP packvote_ui_errors_total Total number of errors',
    '# TYPE packvote_ui_errors_total counter',
    `packvote_ui_errors_total ${metrics.totalErrors}`,
    '# HELP packvote_ui_navigation_total Total number of in-app navigations',
    '# TYPE packvote_ui_navigation_total counter',
    `packvote_ui_navigation_total ${metrics.navigationCount}`,
    '# HELP packvote_ui_uptime_seconds Uptime in seconds',
    '# TYPE packvote_ui_uptime_seconds gauge',
    `packvote_ui_uptime_seconds ${uptime}`
  ].join('\n');

  res.set('Content-Type', 'text/plain');
  res.send(prometheusMetrics);
});

// API endpoint to update metrics from the client
app.post('/api/metrics', express.json(), (req, res) => {
  const DEFAULT_METRIC_VALUE = 1;
  const { metric, value = DEFAULT_METRIC_VALUE } = req.body;

  // Map frontend metrics to server metrics if needed
  const metricMap = {
    'navigationCount': 'navigationCount',
    'pageLoads': 'pageLoads',
    'apiCalls': 'apiCalls',
    'totalErrors': 'totalErrors'
  };

  const serverMetric = metricMap[metric] || metric;

  // Only update known metrics
  if (serverMetric in metrics) {
    metrics[serverMetric] += value;
  }

  const SUCCESS_STATUS = 200;
  res.status(SUCCESS_STATUS).json({ success: true });
});

// For all other requests, serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  serverLog.info(`Server running on port ${PORT}`);
  serverLog.info(`Metrics available at http://localhost:${PORT}/metrics`);
});