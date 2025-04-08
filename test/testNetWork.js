require('dotenv').config('.env');
//const { App } = require('../backend/controllers/index.controller.js');
const { NetworkService } = require('../backend/services/index.service.js');
const { Logger } = require('../backend/middleware/Logger.middleware.js');

const SERVICE_NAME = 'test';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('test');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
process.env.UV_THREADPOOL_SIZE = 10;

//WebService.start();
NetworkService.testConnection('y')
  .then(() => {
    logger.info(SERVICE_NAME, 'Test completed successfully.');
  })
  .catch((error) => {
    logger.error(SERVICE_NAME, `Test failed: ${error.message}`);
  });
