require('dotenv').config('../.env');
const { AppService } = require('./services/app.service');
const { ConsincoService } = require('./services/consinco.service');
const { getLogger } = require('log4js');
const yargs = require('yargs');

let logger = getLogger('LOG');

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
  const data = {
    date,
    getAfd: ['s', 'y', 1, '01', '1'].includes(getAfd) ? 1 : 0,
    chunckLength: parseInt(ckLen) || 100
  };

  try {
    if (data.getAfd === 1) {
      await AppService.gettingAfdDate('s', 'applicationByDay', data.date);
      await AppService.importEachAfdLineDay('s', 'databaseByDay');
      await ConsincoService.deleteDuplicates('s');
    }

    await AppService.sendingWfmApiDate('s', 'tlanticByDay', data.date);
  } catch (error) {
    logger.error(`[sendingWfmApiDate][error]\n`, error);
  }
};

switch (argv._[0]) {
  case 'send':
    if (argv.date) {
      appDay(argv.date);
    } else {
      logger.error('Please provide a date with the --date or -d option.');
    }
    break;

  default:
    logger.error('Invalid command. Use --help to see the available commands.');
    break;
}
