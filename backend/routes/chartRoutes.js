const express = require('express');
const { WFMDevService } = require('../services/wfmdev.service.js');
const router = express.Router();

router.get('/2', async (req, res) => {
  const { date } = req.query;
  try {
    const result = await WFMDevService.getAfdRtNroPunches(date, 'n');
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send('chart2', 'erro ao obter os dados do gráfico de colunas.');
  }
});

router.get('/3', async (req, res) => {
  const { date } = req.query;
  try {
    const result = await WFMDevService.getAfdRtAllPunches(date, 'n');
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send('chart3', 'erro ao buscar os dados da tabela.');
  }
});

module.exports = router;
