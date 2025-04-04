require('dotenv').config('../.env');
const { App, AppDay } = require('./controllers/index.controller.js');
const { NetworkService, WebService, WFMDevService } = require('./services/index.service.js');
const { Logger } = require('./middleware/Logger.middleware.js');
const { dataHoraAtual } = require('./utils/Utils.js');
const cron = require('node-cron');

const SERVICE_NAME = 'app';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('application');

const CRON_SCHEDULES = {
  hourly: '0 * * * *',
  networkTest: '7,14,21,28,35,42,49,56 * * * *',
  updateInfo: '10,20,30,40,50 * * * *',
  dailyTask: '50 23 * * *'
};

class Application {
  static initializeEnvironment() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    process.env.UV_THREADPOOL_SIZE = 128;
  }

  static scheduleTask(cronExpression, taskName, taskFunction) {
    cron.schedule(cronExpression, async () => {
      try {
        logger.info(taskName, `Executing scheduled task at ${dataHoraAtual()}`);
        await taskFunction();
        logger.info(taskName, `Task completed successfully at ${dataHoraAtual()}`);
      } catch (error) {
        logger.error(taskName, error);
      }
    });
  }

  static start(executeApp = 0, minutes = 0, enableLog = 'n') {
    const name = this.start.name;
    const mm = Number(minutes);

    try {
      this.initializeEnvironment();

      WebService.start();
      logger.info(name, `Starting web server at ${dataHoraAtual()}`);

      // Schedule tasks
      this.scheduleTask(CRON_SCHEDULES.hourly, 'App.startapp', async () => {
        await App.startapp(mm, enableLog);
      });

      this.scheduleTask(CRON_SCHEDULES.networkTest, 'NetworkService.testNetCon', async () => {
        await NetworkService.testNetCon(enableLog);
      });

      this.scheduleTask(CRON_SCHEDULES.updateInfo, 'NetworkService.updateNetInfo', async () => {
        await NetworkService.updateNetInfo(enableLog);
      });

      this.scheduleTask(CRON_SCHEDULES.dailyTask, 'DailyTask', async () => {
        const date = dataHoraAtual().split(' ')[0];
        const obj = { date, ckInt: 100, log: 1 };

        await AppDay.gettingAfdDay(obj.date, obj.log);
        await AppDay.importEachAfdLineDay(obj.date, obj.log);
        await WFMDevService.deleteDuplicates(obj.date, obj.log);
        await WFMDevService.sendToStgWfm(obj.date, obj.log);
        //await AppDay.sendingWfmApiDay(obj.date, obj.ckInt, obj.log);
      });

      // Execute tasks immediately if executeApp is set
      if (executeApp === 1) {
        App.startapp(mm, enableLog);
        NetworkService.updateNetInfo(enableLog);
      }
    } catch (error) {
      logger.error(name, error);
    }
  }

  static async now(executeApp = 1, enableLog = 's') {
    const name = this.now.name;

    this.initializeEnvironment();

    const date = dataHoraAtual().split(' ')[0];
    const obj = { date, ckInt: 100, log: 1 };

    try {
      logger.info(name, 'Executing immediate tasks');

      await AppDay.gettingAfdDay(obj.date, obj.log);
      await AppDay.importEachAfdLineDay(obj.date, obj.log);
      await WFMDevService.deleteDuplicates(obj.date, obj.log);
      await WFMDevService.sendToStgWfm(obj.date, obj.log);
      //await AppDay.sendingWfmApiDay(obj.date, obj.ckInt, obj.log);

      logger.info(name, 'Immediate tasks completed successfully');
    } catch (error) {
      logger.error(name, error);
    }
  }
}

module.exports = { Application };
