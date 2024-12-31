require('dotenv').config('../.env');
const { App } = require('./controllers/index.controller.js');
const { NetworkService, WebService } = require('./services/index.service.js');
const { Logger } = require('./middleware/Logger.middleware.js');
const { dataHoraAtual } = require('./utils/Utils.js');

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

const minutesNetwork = '7,14,21,28,35,42,49,56';

class application {
  static start(executeApp = 0, minutes = 0, enableLog = 'n') {
    const cron = require('node-cron');
    const name = this.start.name;
    const mm = Number(minutes);
    try {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      process.env.UV_THREADPOOL_SIZE = 128;

      WebService.start();
      logger.info(name, 'starting web server at ' + dataHoraAtual());

      logger.info(name, 'scheduling task App.startapp every hour');
      cron.schedule('0 * * * *', async () => {
        try {
          await App.startapp(mm, enableLog);
          logger.info(name, 'application started at ' + dataHoraAtual());
        } catch (error) {
          logger.error(name, error);
        }
      });

      logger.info(name, 'scheduling task NetworkService.testConn for running at every ' + minutesNetwork + ' minutes');
      cron.schedule('7,14,21,28,35,42,49,56 * * * *', async () => {
        try {
          await NetworkService.testConn(enableLog);
          logger.info(name, `testing connection at ${dataHoraAtual()}`);
        } catch (error) {
          logger.error(name, error);
        }
      });

      if (executeApp === 1) {
        App.startapp(mm, enableLog);
      }
    } catch (error) {
      logger.error(name, error);
    }
  }
}

module.exports = { application };
