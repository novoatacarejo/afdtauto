require('dotenv').config({ path: '../.env' });
const { OracleService } = require('./services/oracle.service');
const express = require('express');
const app = express();
const port = 8086;
const { currentDateHour } = require('./utils');
const bodyParser = require('body-parser');

const SERVICE_NAME = 'ExpressService';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const dataHorAtual = {
  serviceStarted: currentDateHour().replace('/', '-').replace('/', '-'),
  timezone: 'America/Recife'
};

const server = app.listen(port, () => {
  console.log(`Server started on port ${port} at ${currentDateHour()}`);
});

app.post('/add', async (req, res) => {
  const client = await OracleService.connect();
  const data = req.body;
  console.log(data);
  const sql = `INSERT INTO
    WFM_DEV.DEV_AFD (DTAGERACAO, PROCESSO, IP, NROEMPRESA, CODPESSOA, PUNCH)
    VALUES (
      TO_DATE( :DTAGERACAO, 'YYYY-MM-DD HH24:MI:SS'),
      :PROCESSO,
      :IP,
      :NROEMPRESA,
      :CODPESSOA,
      TO_DATE(:PUNCH, 'YYYY-MM-DD HH24:MI:SS')
      )`;

  await client.execute(sql, data, (err, result) => {
    if (row.length === 0) {
      res.json({ message: `Id ${param} or user not exists!` });
    } else if (err) {
      res.status(400).send(SERVICE_NAME, 'Adding Error', err);
    } else {
      res.status(200).json({
        data: {
          status: '200',
          message: 'OK',
          body: {
            ...req.body
          }
        }
      });
    }
  });

  await client.commit();
  return;
});

app.get('/', (req, res) => {
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
