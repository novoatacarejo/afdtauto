const express = require('express');
const { StationService } = require('../services/station.service.js');
const router = express.Router();

router.get('/clock', async (req, res) => {
  const { ip } = req.query;
  const log = 's';
  try {
    const result = await StationService.getClockStatus(ip, null, null, log);
    if (result === null) {
      res.status(500).send('clock - sem resposta da estação');
    } else {
      res.json(result);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('clock - erro ao buscar os log da estacao');
  }
});

router.post('/clock/:ip', async (req, res) => {
  const ip = req.params.ip;
  const data = req.body;
  if (!ip || !data) {
    return res.status(400).json({ error: 'IP e dados são obrigatórios.' });
  }
  try {
    await updateClock(ip, data);
    res.status(200).json({ message: 'Dispositivo atualizado com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar o dispositivo.' });
  }
});

module.exports = router;
