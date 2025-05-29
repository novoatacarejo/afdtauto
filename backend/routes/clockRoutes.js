const express = require('express');
const { SqlLiteService } = require('../services/index.service.js');
const router = express.Router();

// all clocks
router.get('/1', async (req, res) => {
  const log = 'n';
  try {
    const result = await SqlLiteService.clocksRoute1(log);

    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Nenhum dispositivo encontrado.' });
    }
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

router.get('/2', async (req, res) => {
  const log = 'n';
  try {
    const result = await SqlLiteService.clocksRoute2(log);

    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Nenhum dispositivo encontrado.' });
    }
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

router.get('/3', async (req, res) => {
  const log = 'n';
  try {
    const result = await SqlLiteService.clocksRoute3(log);

    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Nenhum dispositivo encontrado.' });
    }
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

/* router.post('/1/:ip', async (req, res) => {
  const ip = req.params.ip;
  const data = req.body;
  if (!ip || !data) {
    return res.status(400).json({ error: 'IP e dados são obrigatórios.' });
  }
  try {
    //await getClockStatus(ip, data);
    res.status(200).json({ message: 'Dispositivo atualizado com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar o dispositivo.' });
  }
}); */

module.exports = router;
