const express = require('express');
const { WFMDevService } = require('../services/wfmdev.service.js');
const router = express.Router();

router.get('/table1', async (req, res) => {
  const { date } = req.query;
  try {
    const result = await WFMDevService.getAfdRtPunches(date, 'n');
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send('table', 'erro ao buscar os dados da tabela.');
  }
});

router.get('/table2', async (req, res) => {
  const { date } = req.query;
  try {
    const result = await WFMDevService.getAfdRtLjPunches(date, 'n');
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'erro ao obter os dados da tabela de linhas.' });
  }
});

module.exports = router;
