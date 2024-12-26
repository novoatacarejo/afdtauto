require('dotenv').config('../.env');
const { App } = require('./controllers/index.controller.js');
const { NetworkService, WebService } = require('./services/index.service.js');
const Logger = require('./middleware/Logger.middleware.js');

const cron = require('node-cron');

const SERVICE_NAME = 'app';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('application');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
process.env.UV_THREADPOOL_SIZE = 10;

WebService.start();
const enableLog = 'n';
logger.info('start', 'starting web server');

cron.schedule('0 * * * *', async () => {
  try {
    await App.startapp(enableLog);
    logger.info('cron-App.start', 'application started');
  } catch (error) {
    logger.error('cron-App.start', error);
  }
});

cron.schedule('0 */6 * * * *', async () => {
  try {
    await NetworkService.testConn(enableLog);
    logger.info('cron-testConn()', 'testing connection');
  } catch (error) {
    logger.error('cron-testConn()', error);
  }
});

//App.startapp('s');

//NetworkService.testConn();

/*
 # ┌────────────── second (optional)
 # │ ┌──────────── minute
 # │ │ ┌────────── hour
 # │ │ │ ┌──────── day of month
 # │ │ │ │ ┌────── month
 # │ │ │ │ │ ┌──── day of week
 # │ │ │ │ │ │
 # │ │ │ │ │ │
 # * * * * * *
*/
