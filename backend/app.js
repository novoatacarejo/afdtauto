require('dotenv').config('../.env');
const { App, AppDay } = require('./controllers/index.controller.js');
const { NetworkService, WFMDevService } = require('./services/index.service.js');
const { Logger } = require('./middleware/Logger.middleware.js');
const { dataHoraAtual } = require('./utils/Utils.js');
const cron = require('node-cron');

const SERVICE_NAME = 'app';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('application');

const CRON_SCHEDULES = {
  hourly: '0 * * * *',
  testConnection: '7,14,21,28,35,42,49,56 * * * *',
  clocksInfo: '10,20,30,40,50 * * * *',
  getallPunches: '50 23 * * *'
};

class Application {
  static initializeEnvironment() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    process.env.UV_THREADPOOL_SIZE = 128;
  }

  static scheduleTask(cronExpression, taskName, taskFunction) {
    cron.schedule(cronExpression, async () => {
      try {
        logger.info(taskName, `executando tarefa agendada em ${dataHoraAtual()}`);
        await taskFunction();
        logger.info(taskName, `task concluída com sucesso em ${dataHoraAtual()}`);
      } catch (error) {
        logger.error(taskName, `erro ao executar tarefa: ${error.message}`);
      }
    });
  }

  static async getAllPunches(obj) {
    await AppDay.gettingAfdDay(obj.date, obj.log);
    await AppDay.importEachAfdLineDay(obj.date, obj.log);
    await WFMDevService.deleteDuplicates(obj.date, obj.log);
    await WFMDevService.sendToStgWfm(obj.date, obj.log);
  }

  static start(executeApp = 0, minutes = 0, enableLog = 'n') {
    const name = this.start.name;
    const mm = Number(minutes);

    try {
      if (executeApp === 1) {
        App.startapp(mm, enableLog);
      } else if (executeApp === 0) {
        this.initializeEnvironment();

        this.scheduleTask(CRON_SCHEDULES.hourly, 'app.hourly', async () => {
          await App.startapp(mm, enableLog);
        });

        this.scheduleTask(CRON_SCHEDULES.testConnection, 'testConnection', async () => {
          await NetworkService.testConnection(enableLog);
        });

        this.scheduleTask(CRON_SCHEDULES.getallPunches, 'getallPunches', async () => {
          const date = dataHoraAtual().split(' ')[0];
          const obj = { date, ckInt: 100, log: 1 };
          await this.getAllPunches(obj);
        });
      } else {
        logger.error(
          name,
          `valor inválido para executeApp: ${executeApp}.\nUse 0 para o agendamento ou 1 para executar agora.`
        );
      }
    } catch (error) {
      logger.error(name, error);
    }
  }
}

module.exports = { Application };
