require('dotenv').config({ path: '../.env' });
const { ConsincoService } = require('./services/consinco.service');
const express = require('express');
const app = express();
const port = 8086;
const { currentDateHour } = require('./utils');
const bodyParser = require('body-parser');

const server = app.listen(port, () => {
  console.log(`Server Https started on port ${port} at ${currentDateHour()}`);
});

const SERVICE_NAME = 'ExpressHttpService';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const dataHorAtual = {
  serviceStarted: currentDateHour().replace('/', '-').replace('/', '-'),
  timezone: 'America/Recife'
};

app.post('/wfm/afd', async (req, res) => {
  const data = req.body;

  console.log(data);

  await ConsincoService.insertAfd(data, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.status(200).json({ data });
    }
  });
});

app.get('/wfm', (req, res) => {
  res.status(200).json({
    status: 'ready',
    port,
    serviceStarted: dataHorAtual.serviceStarted,
    currentTime: currentDateHour().replace('/', '-').replace('/', '-'),
    timezone: dataHorAtual.timezone,
    solution: 'WFM',
    manufacturer: 'Tlantic'
  });
});

/* 
app.get('/punches/date/:date', async (req, res) => {
  const client = await OracleService.connect();
  const query = `SELECT * FROM WFM_DEV.DEV_AFD WHERE TRUNC( PUNCH) = :DATE`;

  const param = [req.params.date];

  await client.execute(query, param, (err, row) => {
    if (err) {
      throw err;
    }
    if (row.length === 0) {
      res.json({ message: `date ${param} or user not exists!` });
    } else {
      console.log(row.rows);
      res.json({ ...row.rows });
    }
  });
  client.close();
});

app.get('/punches/codpessoa/:codpessoa', async (req, res) => {
  const client = await OracleService.connect();
  const query = `SELECT * FROM WFM_DEV.DEV_AFD WHERE CODPESSOA = :CODPESSOA ORDER BY PUNCH`;

  const param = [req.params.codpessoa];

  await client.execute(query, param, (err, row) => {
    if (err) {
      throw err;
    }
    if (row.length === 0) {
      res.json({ message: `codpessoa ${param} or user not exists!` });
    } else {
      console.log(row.rows);
      res.json({ ...row.rows });
    }
  });
  client.close();
});
 */
app.use((req, res) => {
  res.status(404);
});
