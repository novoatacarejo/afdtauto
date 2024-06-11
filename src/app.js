require('dotenv').config('../.env');
const { AppService } = require('./services/app.service');
const { getLogger } = require('log4js');

let logger = getLogger('LOG');
let cron = require('node-cron');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

cron.schedule('0 * * * *', async () => {
  await AppService.startApplication();
});
