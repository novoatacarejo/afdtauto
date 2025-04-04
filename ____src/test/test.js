require('dotenv').config('.env');
const { App } = require('../controllers/index.controller.js');
const { NetworkService, WebService } = require('../services/index.service.js');
const Logger = require('../middleware/Logger.middleware.js');

const SERVICE_NAME = 'test2';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('test2');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
process.env.UV_THREADPOOL_SIZE = 10;

//WebService.start();
console.log(logger.service);
logger.info('start', 'starting web server on test2');
