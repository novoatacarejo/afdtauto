require('dotenv').config('../../.env');
const { configure, getLogger } = require('log4js');
const path = require('path');

const { NETWORK_LOG_DIR, APPLICATION_LOG_DIR, DATABASE_LOG_DIR, TLANTIC_LOG_DIR, TLANTICDAY, LOG_DIR } = process.env;

class Logger {
  constructor(app = 'app', message = 'constructor de logger') {
    this.app = app;
    this.message = message.error || message;
    this.logger = getLogger('LOG');
    this.configureLogService();
  }

  configureLogService = () => {
    const logFileName = `${this.logCurrentDatetime()}.log`;
    const logName = path.join(LOG_DIR, logFileName);

    configure({
      appenders: {
        logger: {
          type: 'file',
          filename: `${logName}`
        },
        console: {
          type: 'console'
        }
      },
      categories: {
        default: {
          appenders: ['logger', 'console'],
          level: 'info'
        }
      }
    });
  };

  logCurrentDatetime = () => {
    const currentDate = new Date();
    const formatDateComponent = (component) => component.toString().padStart(2, '0');
    const year = currentDate.getFullYear();
    const month = formatDateComponent(currentDate.getMonth() + 1);
    const day = formatDateComponent(currentDate.getDate());
    const hours = formatDateComponent(currentDate.getHours());
    const minutes = formatDateComponent(currentDate.getMinutes());
    const seconds = formatDateComponent(currentDate.getSeconds());

    return `${day}-${month}-${year}_${hours}h${minutes}m${seconds}s`;
  };

  info(app = this.app, message = this.message) {
    this.logger.info(`[${app}] ${message}`);
  }

  error(app = this.app, message = this.message) {
    this.logger.error(`[error][${app}] ${message}`);
  }
}

module.exports = Logger;
