const express = require('express');
const router = express.Router();
const { getStatus } = require('../config/db');

router.get('/health', (req, res) => {
  const dbStatus = getStatus();
  res.json({
    status: 'healthy',
    application: 'Smart AI Crop Doctor Backend',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      connected: dbStatus.isConnected,
      host: dbStatus.host,
      database: dbStatus.database,
    },
    apis: {
      geminiFreeApi: Boolean(process.env.GEMINI_API_KEY),
      huggingFaceFreeApi: Boolean(process.env.HUGGINGFACE_API_KEY),
      openWeatherFreeApi: Boolean(process.env.OPENWEATHER_API_KEY),
    },
  });
});

module.exports = router;
