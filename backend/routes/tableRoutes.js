const express = require('express');
const { WFMDevService, SqlLiteService } = require('../services/index.service.js');
const router = express.Router();

router.get('/1', async (req, res) => {
  const { date } = req.query;
  try {
    const result = await WFMDevService.getAfdRtPunches(date, 'n');
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send('table', 'erro ao buscar os dados da tabela.');
  }
});

router.get('/2', async (req, res) => {
  const { date } = req.query;
  try {
    const result = await WFMDevService.getAfdRtLjPunches(date, 'n');
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'erro ao obter os dados da tabela de linhas.' });
  }
});

router.get('/3', async (req, res) => {
  const { date } = req.query;
  try {
    const sql = `SELECT a.loja, ip, ultima_hora, hoje, ultimos_7_dias, ultimos_15_dias, ultimos_30_dias, ultima_verificacao FROM clocks_vw_fato_falhas a`;

    const result = await SqlLiteService.queryDB(sql, []);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'erro ao obter os dados da tabela de linhas.' });
  }
});

module.exports = router;
