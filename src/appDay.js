require('dotenv').config('../.env');
const { App } = require('./controllers/index.controller.js');
const { ConsincoService } = require('./services/index.service.js');
const Logger = require('./middleware/Logger.middleware.js');

const yargs = require('yargs');

let logger = new Logger();
logger.configureDirLogService('applicationDay');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
process.env.UV_THREADPOOL_SIZE = 10;

/*
Send Data:
node appDays.js send --date 20/06/202
*/

const argv = yargs
  .command('send', 'Send data to the WFM API', {
    date: {
      description: 'Date for sending data',
      alias: 'd',
      type: 'string'
    }
  })
  .help()
  .alias('help', 'h').argv;

const appDay = async (date, getAfd, ckLen) => {
  const name = AppDay.name;
  const data = {
    date,
    getAfd: ['s', 'y', 'sim', 'yes', 1, '01', '1'].includes(getAfd) ? 1 : 0,
    chunckLength: parseInt(ckLen) || 100
  };

  try {
    if (data.getAfd === 1) {
      await App.gettingAfdDate('s', 'applicationByDay', data.date);
      await App.importEachAfdLineDay('s', 'databaseByDay');
      await ConsincoService.deleteDuplicates('s');
    }

    await App.sendingWfmApiDate('s', 'tlanticByDay', data.date);
  } catch (error) {
    logger.error(name, error);
  }
};

switch (argv._[0]) {
  case 'send':
    if (argv.date) {
      appDay(argv.date);
    } else {
      logger.error('switch', 'please provide a date with the --date or -d option.');
    }
    break;

  default:
    logger.error('switch', 'invalid command. Use --help to see the available commands.');
    break;
}
