const redisClient = require('../services/redis.service.js');
const { SqlLiteService } = require('../services/index.service.js');
const { Logger } = require('../middleware/Logger.middleware.js');
const express = require('express');
const router = express.Router();

const SERVICE_NAME = 'clockRoutes';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('clockRoutes');

router.get('/1', async (req, res) => {
  const log = 'n';
  const cacheKey = 'clock1';
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    } else {
      // Se não existe, força atualização
      const result = await SqlLiteService.clocksRoute1(log);
      await redisClient.set(cacheKey, JSON.stringify(result), { EX: 5 });
      return res.json(result);
    }
  } catch (err) {
    logger.error(SERVICE_NAME, '[clockRoutes] /1', err);
    res.status(500).send('clock - erro ao buscar os log da estacao');
  }
});

router.get('/2', async (req, res) => {
  const log = 'n';
  const cacheKey = 'clock2';
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    } else {
      const result = await SqlLiteService.clocksRoute2(log);
      await redisClient.set(cacheKey, JSON.stringify(result), { EX: 5 });
      return res.json(result);
    }
  } catch (err) {
    logger.error(SERVICE_NAME, '[clockRoutes] /2', err);
    res.status(500).send('clock - erro ao buscar os log da estacao');
  }
});

router.get('/3', async (req, res) => {
  const log = 'n';
  const cacheKey = 'clock3';
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    } else {
      const result = await SqlLiteService.clocksRoute3(log);
      await redisClient.set(cacheKey, JSON.stringify(result), { EX: 5 });
      return res.json(result);
    }
  } catch (err) {
    logger.error(SERVICE_NAME, '[clockRoutes] /3', err);
    res.status(500).send('clock - erro ao buscar os log da estacao');
  }
});

module.exports = router;
