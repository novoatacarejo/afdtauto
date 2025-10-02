const express = require('express');
const { WFMDevService } = require('../services/wfmdev.service.js');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const rows = await WFMDevService.getDevLogRows();
    res.json(rows);
  } catch (err) {
    console.error('Erro ao consultar logs:', err);
    res.status(500).json({ error: 'Erro ao consultar logs.' });
  }
});

module.exports = router;
