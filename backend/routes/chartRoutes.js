const express = require('express');
const { WFMDevService } = require('../services/wfmdev.service.js');
const { SqlLiteService } = require('../services/sqlite.service.js');
const router = express.Router();

// Rota para gráfico de lojas x relógios cadastrados
router.get('/lojas-relogios', async (req, res) => {
  try {
    const result = await WFMDevService.getLojasRelogios();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send('lojasRelogiosChart', 'erro ao buscar os dados do gráfico de lojas x relógios.');
  }
});

// Rota para gráfico de status dos relógios
router.get('/status', async (req, res) => {
  try {
    // Busca status dos relógios agrupado
    const result = await WFMDevService.getClocksStatus();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send('statusChart', 'erro ao buscar os dados do gráfico de status.');
  }
});

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
