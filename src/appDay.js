require('dotenv').config('../.env');
const { AppDay } = require('./controllers/index.controller.js');
const { ConsincoService } = require('./services/index.service.js');
const { Logger } = require('./middleware/Logger.middleware.js');

const yargs = require('yargs');

const SERVICE_NAME = 'appDay';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('applicationDay');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
process.env.UV_THREADPOOL_SIZE = 10;

/*
Send Data:
node clear && node .\src\appDay.js send -d 15/12/2024 -a 1 -c 100 -l 1
*/

const argv = yargs
  .command('send', 'Get AFD files and send data to the WFM API', {
    date: {
      description: 'date to get data and for sending',
      alias: 'd',
      type: 'string'
    },
    getafd: {
      description: 'get new AFD data from date',
      alias: 'g',
      type: 'string'
    },
    cklen: {
      description: 'Chunck length for sending data',
      alias: 'c',
      type: 'string'
    },
    log: {
      description: 'Enable log',
      alias: 'l',
      type: 'string'
    },
    api: {
      description: 'send to api tlantic',
      alias: 'a',
      type: 'string'
    }
  })
  .help()
  .alias('help', 'h').argv;

const appDay = async (data) => {
  const name = appDay.name;
  const obj = {
    date: data.date,
    getAfd: data.getAfd || 0,
    ckInt: data.ckInt || 100,
    log: data.log || 0,
    api: data.api || 0
  };

  try {
    if (obj.getAfd === 1) {
      try {
        await AppDay.gettingAfdDay(obj.date, obj.log);
        await AppDay.importEachAfdLineDay(obj.date, obj.log);
        await ConsincoService.deleteDuplicates(obj.date, obj.log);
      } catch (error) {
        logger.error(name, error);
      }
    }
    if (obj.api === 1) {
      try {
        await AppDay.sendingWfmApiDay(obj.date, obj.ckInt, obj.log);
      } catch (error) {
        logger.error(name, error);
      }
    }
  } catch (error) {
    logger.error(name, error);
  }
};

switch (argv._[0]) {
  case 'send':
    if (argv.date) {
      const data = {
        date: argv.date,
        getAfd: ['s', 'y', 'sim', 'yes', 1, '01', '1'].includes(argv.getafd) ? 1 : 0,
        ckInt: parseInt(argv.cklen) || 100,
        log: ['s', 'y', 'sim', 'yes', 1, '01', '1'].includes(argv.log) ? 1 : 0,
        api: ['s', 'y', 'sim', 'yes', 1, '01', '1'].includes(argv.api) ? 1 : 0
      };

      appDay(data);
    } else {
      logger.error('switch', 'please provide a date with the --date or -d option.');
    }
    break;

  default:
    logger.error('switch', 'invalid command. Use --help to see the available commands.');
    break;
}
