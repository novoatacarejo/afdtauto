require('dotenv').config('../.env');
const { App } = require('./controllers/index.controller.js');
const { NetworkService, WebService } = require('./services/index.service.js');
const Logger = require('./middleware/Logger.middleware.js');

const cron = require('node-cron');
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

const SERVICE_NAME = 'app';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('application');

class application {
  static start(executeApp = 0, enableLog = 'n') {
    const name = 'app';
    try {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      process.env.UV_THREADPOOL_SIZE = 128;

      WebService.start();
      logger.info(name, 'starting web server');

      cron.schedule('0 * * * *', async () => {
        try {
          await App.startapp(enableLog);
          logger.info(name, 'application started');
        } catch (error) {
          logger.error(name, error);
        }
      });

      cron.schedule('0 */6 * * * *', async () => {
        try {
          await NetworkService.testConn(enableLog);
          logger.info(name, 'testing connection');
        } catch (error) {
          logger.error(name, error);
        }
      });

      if (executeApp === 1) {
        App.startapp(enableLog);
      }
    } catch (error) {
      logger.error(name, error);
    }
  }
}

module.exports = { application };
