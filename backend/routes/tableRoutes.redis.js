const redisClient = require('../services/redis.service.js');
const { WFMDevService, SqlLiteService } = require('../services/index.service.js');
const express = require('express');
const router = express.Router();

router.get('/1', async (req, res) => {
  const { date } = req.query;
  const cacheKey = `table1:${date}`;
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    } else {
      const result = await WFMDevService.getAfdRtPunches(date, 'n');
      await redisClient.set(cacheKey, JSON.stringify(result), { EX: 5 });
      return res.json(result);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('table', 'erro ao buscar os dados da tabela.');
  }
});

router.get('/3', async (req, res) => {
  const cacheKey = `table3`;
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    } else {
      const sql = `SELECT a.loja, ip, ultima_hora, hoje, ultimos_7_dias, ultimos_15_dias, ultimos_30_dias, ultima_verificacao FROM clocks_vw_fato_falhas a`;
      const result = await SqlLiteService.queryDB(sql, []);
      await redisClient.set(cacheKey, JSON.stringify(result), { EX: 5 });
      return res.json(result);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'erro ao obter os dados da tabela de linhas.' });
  }
});

module.exports = router;
