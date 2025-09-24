require('dotenv').config('../.env');
const express = require('express');
const routes = require('./routes/indexRoutes.js');
const chartRoutesRedis = require('./routes/chartRoutes.redis.js');
const tableRoutesRedis = require('./routes/tableRoutes.redis.js');
const clockRoutesRedis = require('./routes/clockRoutes.redis.js');
const { Logger } = require('./middleware/Logger.middleware.js');

const SERVICE_NAME = 'WebService';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('network');

const app = express();
const { API_WEB_DIR, BACKEND_PORT, BACKEND_HOST } = process.env;

function startServer() {
  app.use(express.json());
  app.use(routes);
  app.use('/api/chart', chartRoutesRedis);
  app.use('/api/table', tableRoutesRedis);
  app.use('/api/clock', clockRoutesRedis);
  app.use(express.static(API_WEB_DIR));
  app.set('view engine', 'html');
  app.engine('html', require('ejs').renderFile);

  app.get('/', (req, res) => {
    res.render('index.html');
  });

  app.listen(BACKEND_PORT, BACKEND_HOST, () => {
    logger.info(SERVICE_NAME, `server is running on http://${BACKEND_HOST}:${BACKEND_PORT}`);
  });
}

module.exports = { startServer };
