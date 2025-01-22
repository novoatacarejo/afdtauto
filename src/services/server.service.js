require('dotenv').config('../.env');
const express = require('express');
const fs = require('fs');
const { ConsincoService } = require('../services/consinco.service.js');
const { StationService } = require('../services/station.service.js');
const { readJsonClock } = require('../utils/Utils.js');
const { Logger } = require('../middleware/Logger.middleware.js');

const SERVICE_NAME = 'WebService';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('application');

const { CLOCKS_FILE, FAILS_FILE, INFO_FILE, API_WEB_DIR } = process.env;

class WebService {
  static start = async () => {
    const name = this.start.name;

    const app = express();
    const PORT = process.env.PORT || 3500;
    const IPADDR = '10.101.108.195';

    app.use(express.static(API_WEB_DIR));
    app.set('view engine', 'html');
    app.engine('html', require('ejs').renderFile);

    app.use(express.static('public'));

    try {
      app.get('/', (req, res) => {
        res.render('index.html');
      });

      app.get('/chart2', async (req, res) => {
        const { date } = req.query;

        try {
          const result = await ConsincoService.getAfdRtNroPunches(date, 'n');
          res.json(result);
        } catch (err) {
          console.error(err);
          res.status(500).send('chart2', 'erro ao obter os dados do gráfico de colunas.');
        }
      });

      app.get('/chart3', async (req, res) => {
        const { date } = req.query;

        try {
          const result = await ConsincoService.getAfdRtAllPunches(date, 'n');
          //console.log(result);
          res.json(result);
        } catch (err) {
          console.error(err);
          res.status(500).send('chart3', 'erro ao buscar os dados da tabela.');
        }
      });

      app.get('/table1', async (req, res) => {
        const { date } = req.query;

        try {
          const result = await ConsincoService.getAfdRtPunches(date, 'n');
          res.json(result);
        } catch (err) {
          console.error(err);
          res.status(500).send('table', 'erro ao buscar os dados da tabela.');
        }
      });

      app.get('/table2', async (req, res) => {
        const { date } = req.query;

        try {
          const result = await ConsincoService.getAfdRtLjPunches(date, 'n');
          res.json(result);
        } catch (err) {
          console.error(err);
          res.status(500).send({ error: 'erro ao obter os dados da tabela de linhas.' });
        }
      });

      app.get('/info', (req, res) => {
        try {
          const data = fs.readFileSync(INFO_FILE, 'utf8');
          const logs = JSON.parse(data).data;
          res.json(logs);
        } catch (err) {
          logger.error(name, `${err}`);
          res.status(500).json({ error: 'fails - failed to read logs' });
        }
      });

      app.get('/clock', async (req, res) => {
        const { ip } = req.query;
        const log = 's';

        try {
          const result = await StationService.getClockStatus(ip, null, null, log);

          if (result === null) {
            res.status(500).send('clock', 'sem resposta da estação');
          } else {
            res.json(result);
          }
        } catch (err) {
          console.error(err);
          res.status(500).send('clock', 'erro ao buscar os log da estacao');
        }
      });

      app.get('/fails', (req, res) => {
        try {
          const data = fs.readFileSync(FAILS_FILE, 'utf8');
          const logs = JSON.parse(data).data;
          res.json(logs);
        } catch (err) {
          logger.error(name, `${err}`);
          res.status(500).json({ error: 'fails - failed to read logs' });
        }
      });

      app.get('/clocks', (req, res) => {
        try {
          const data = fs.readFileSync(CLOCKS_FILE, 'utf8');
          const clocks = JSON.parse(data).data;

          res.json(clocks);
        } catch (err) {
          logger.error(name, `${err}`);
          res.status(500).json({ error: 'clocks - failed to read clocks' });
        }
      });

      app.listen(PORT, IPADDR, () => {
        console.log(`Server is running on http://${IPADDR}:${PORT}`);
      });
    } catch (error) {
      logger.error(name, error);
    }
  };
}

module.exports = { WebService };
