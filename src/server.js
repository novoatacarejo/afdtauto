const express = require('express');
const { configureDirLog } = require('./utils');
const fs = require('fs');
const path = require('path');

const { getLogger } = require('log4js');
let logger = getLogger('LOG');

const app = express();
const port = 3500;

app.use(express.static(path.join('C:/node/afdtauto', 'public')));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

app.use(express.static('public'));

const startWebServer = async () => {
  await configureDirLog('application');
  try {
    const jsonPath = path.join('C:/node/afdtauto/json', 'fails.json');
    const clocksPath = path.join('C:/node/afdtauto/json', 'clocks.json');

    app.get('/logs', (req, res) => {
      try {
        const data = fs.readFileSync(jsonPath, 'utf8');
        const logs = JSON.parse(data).data;
        res.json(logs);
      } catch (err) {
        logger.error('[startWebServer][error][logs] - Error reading JSON file:', err);
        res.status(500).json({ error: 'Failed to read logs' });
      }
    });

    app.get('/clocks', (req, res) => {
      try {
        const data = fs.readFileSync(clocksPath, 'utf8');
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
