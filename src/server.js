require('dotenv').config('../.env');
const express = require('express');
const { configureDirLog } = require('./utils');
const fs = require('fs');
const path = require('path');

const { getLogger } = require('log4js');
let logger = getLogger('LOG');

const app = express();
const port = 3500;

const { CLOCKS_FILE, NETWORK_FILE } = process.env;

app.use(express.static(path.join('C:/node/afdtauto', 'public')));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

app.use(express.static('public'));

const startWebServer = async () => {
  await configureDirLog('application');
  try {
    //const networkJsonFile = path.join('C:/node/afdtauto/json', 'network.json');
    //const clocksJsonFile = path.join('C:/node/afdtauto/json', 'clocks.json');

    app.get('/fails', (req, res) => {
      try {
        const data = fs.readFileSync(NETWORK_FILE, 'utf8');
        const logs = JSON.parse(data).data;
        res.json(logs);
      } catch (err) {
        logger.error('[startWebServer][error][logs] - Error reading JSON file:', err);
        res.status(500).json({ error: 'Failed to read logs' });
      }
    });

    app.get('/clocks', (req, res) => {
      try {
        const data = fs.readFileSync(CLOCKS_FILE, 'utf8');
        const clocks = JSON.parse(data).data;

        res.json(clocks);
      } catch (err) {
        logger.error('[startWebServer][error][clocks] - Error reading JSON file:', err);
        res.status(500).json({ error: 'Failed to read logs' });
      }
    });

    app.listen(port, '10.101.108.195', () => {
      logger.info(`[startWebServer][starting] - web server is running at http://10.101.108.195:${port}`);
    });
  } catch (error) {
    logger.error('[startWebServer][starting][error]', error);
  }
};

exports.startWebServer = startWebServer;
