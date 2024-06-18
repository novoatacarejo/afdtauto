require('dotenv').config({ path: '../.env' });
const { ConsincoService } = require('../services/consinco.service');
const express = require('express');
const app = express();
const port = 8086;
const { currentDateHour } = require('../utils');
const bodyParser = require('body-parser');

const SERVICE_NAME = 'ExpressHttpService';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const dataHorAtual = {
  serviceStarted: currentDateHour().replace('/', '-').replace('/', '-'),
  timezone: 'America/Recife'
};

const serverInfo = () => {
  return {
    status: 'ready',
    port,
    serviceStarted: dataHorAtual.serviceStarted,
    currentTime: currentDateHour().replace('/', '-').replace('/', '-'),
    timezone: dataHorAtual.timezone,
    solution: 'WFM',
    manufacturer: 'Tlantic'
  };
};

const startServerHttp = async () => {
  const server = app.listen(port, () => {
    console.log(`Server Https started on port ${port} at ${currentDateHour()}`);
  });

  app.post('/wfm/afd', async (req, res) => {
    const data = req.body;

    console.log(data);

    await ConsincoService.insertAfd(data);
    res.status(200).json({ data });
  });

  app.get('/wfm', (req, res) => {
    res.status(200).json(serverInfo());
  });

  app.use((req, res) => {
    res.status(404);
  });
};

startServerHttp();
