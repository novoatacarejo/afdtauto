require('dotenv').config('../.env');
const express = require('express');
const { ConsincoService } = require('../services/consinco.service.js');
const fs = require('fs');
const { Logger } = require('../middleware/Logger.middleware.js');

const SERVICE_NAME = 'WebService';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('application');

const { CLOCKS_FILE, NETWORK_FILE, API_WEB_DIR } = process.env;

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

      app.get('/date', async (req, res) => {
        const { date } = req.query;

        try {
          const result = await ConsincoService.getAfdRtPunches(date, 's');
          res.json(result);
        } catch (err) {
          console.error(err);
          res.status(500).send('Erro ao buscar os dados.');
        }
      });

      app.get('/fails', (req, res) => {
        try {
          const data = fs.readFileSync(NETWORK_FILE, 'utf8');
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
