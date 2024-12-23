require('dotenv').config('../../.env');
const { configure, getLogger } = require('log4js');
const path = require('path');

const { LOG_DIR } = process.env;

class Logger {
  constructor(app = 'app', message = 'constructor de logger', service = 'service', dirLog = 'log') {
    this.app = app;
    this.message = message.error || message;
    this.service = service;
    this.dirLog = dirLog;
    this.logger = getLogger('LOG');
    this.configureDirLogService(this.dirLog);
  }

  configureLogService = () => {
    const logFileName = `${logCurrentDatetime()}.log`;
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

  configureDirLogService = async (dirname) => {
    const dir = dirname || 'no_name';
    return new Promise((res) => {
      configure({
        appenders: {
          logger: {
            type: 'file',
            filename: path.join(LOG_DIR, `${dir}.log`)
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

      res(true);
    });
  };

  replyConn = (error, name, ip, attempt) => {
    const ipAddress = !ip ? `localhost` : ip;

    if (error.code === 'ETIMEDOUT') {
      this.error(name, `[${this.service}]${error.code}-connection to ${ipAddress} timed out on attempt ${attempt}.`);
    } else if (error.code === 'ECONNRESET') {
      name, this.error(`[${this.service}][${error.code}]-connection to ${ipAddress} reset on attempt ${attempt}.`);
    } else if (error.code === 'ERR_BAD_RESPONSE') {
      name, this.error(`[${this.service}][${error.code}]-bad response from ${ipAddress} on attempt ${attempt}.`);
    } else if (error.code === 'ECONNABORTED') {
      this.error(name, `[${this.service}][${error.code}]-connection to ${ipAddress} aborted on attempt ${attempt}.`);
    } else {
      this.error(name, `[${this.service}][error]-station: ${ipAddress} after 3 attempts-${error.code}`);
    }
  };

  info(app = this.app, message = this.message, service = this.service) {
    this.logger.info(`[${service}][${app}]-${message}`);
  }

  error(app = this.app, message = this.message, service = this.service) {
    this.logger.error(`[${service}][${app}][error]-${message}`);
  }
}

const logCurrentDatetime = () => {
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

module.exports = Logger;
