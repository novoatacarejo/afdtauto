require('dotenv').config('../.env');
const { App, AppDay } = require('./controllers/index.controller.js');
const { NetworkService, WebService, ConsincoService } = require('./services/index.service.js');
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
const minutesApp = '9,18,27,36,45,54,63,72';

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

      cron.schedule('0 * * * *', async () => {
        try {
          logger.info(name, 'scheduling task App.startapp every hour');
          await App.startapp(mm, enableLog);
          logger.info(name, 'application started at ' + dataHoraAtual());
        } catch (error) {
          logger.error(name, error);
        }
      });

      cron.schedule('7,14,21,28,35,42,49,56 * * * *', async () => {
        try {
          logger.info(
            name,
            'scheduling task NetworkService.testConn for running at every ' + minutesNetwork + ' minutes'
          );
          await NetworkService.testConn(enableLog);
          logger.info(name, `testing connection with stations at ${dataHoraAtual()}`);
        } catch (error) {
          logger.error(name, error);
        }
      });

      cron.schedule('10,20,30,40,50 * * * *', async () => {
        try {
          logger.info(
            name,
            'scheduling task NetworkService.updateInfo for running at every ' + minutesApp + ' minutes'
          );
          await NetworkService.updateInfo(enableLog);
          logger.info(name, `connecting stations at ${dataHoraAtual()}`);
        } catch (error) {
          logger.error(name, error);
        }
      });

      cron.schedule('50 23 * * *', async () => {
        const date = dataHoraAtual().split(' ')[0];
        const obj = {
          date: date,
          ckInt: 100,
          log: 1
        };
        try {
          logger.info(name, 'getting all today punches and sending to tlantic api at 23:50');

          await AppDay.gettingAfdDay(obj.date, obj.log);
          await AppDay.importEachAfdLineDay(obj.date, obj.log);
          await ConsincoService.deleteDuplicates(obj.date, obj.log);
          await AppDay.sendingWfmApiDay(obj.date, obj.ckInt, obj.log);
        } catch (error) {
          logger.error(name, error);
        }
      });

      if (executeApp === 1) {
        App.startapp(mm, enableLog);
        NetworkService.updateInfo(enableLog);
      }
    } catch (error) {
      logger.error(name, error);
    }
  }
}

module.exports = { application };
