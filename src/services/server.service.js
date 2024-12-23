require('dotenv').config('../.env');
const express = require('express');
const fs = require('fs');
const Logger = require('../middleware/Logger.middleware.js');

const SERVICE_NAME = 'WebService';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('service');

const { CLOCKS_FILE, NETWORK_FILE, API_WEB_DIR } = process.env;

class WebService {
  static start = async () => {
    const name = this.start.name;

    const app = express();
    const PORT = 3500;
    const IPADDR = '10.101.108.195';

    app.use(express.static(API_WEB_DIR));
    app.set('view engine', 'html');
    app.engine('html', require('ejs').renderFile);

    app.use(express.static('public'));
    try {
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
          res.status(500).json({ error: 'clocks - failed to read logs' });
        }
      });

      app.listen(PORT, IPADDR, () => {
        logger.info(name, `web server is running at http://${IPADDR}:${PORT}`);
      });
    } catch (error) {
      logger.error(name, error);
    }
  };
}

module.exports = { WebService };
