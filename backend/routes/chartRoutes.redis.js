const redisClient = require('../services/redis.service.js');
const { WFMDevService } = require('../services/wfmdev.service.js');
const express = require('express');
const router = express.Router();

router.get('/3', async (req, res) => {
  const { date } = req.query;
  const cacheKey = `chart3:${date}`;
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    } else {
      const result = await WFMDevService.getAfdRtAllPunches(date, 'n');
      await redisClient.set(cacheKey, JSON.stringify(result), { EX: 5 });
      return res.json(result);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('chart3', 'erro ao buscar os dados da tabela.');
  }
});

module.exports = router;
