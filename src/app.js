require('dotenv').config('../.env');
const { AppService } = require('./services/app.service');
const { testConn } = require('./others/testConn');
const { startWebServer } = require('./server');
const { getLogger } = require('log4js');

let logger = getLogger('LOG');
let cron = require('node-cron');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
process.env.UV_THREADPOOL_SIZE = 10;

//AppService.startApplication();
//testConn();

startWebServer();

cron.schedule('0 * * * *', async () => {
  await AppService.startApplication();
});

cron.schedule('0 */6 * * * *', async () => {
  await testConn();
});

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
