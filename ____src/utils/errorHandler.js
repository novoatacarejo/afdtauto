const Logger = require('../middleware/Logger.middleware.js');

const SERVICE_NAME = 'errorHandler';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('error-handler');

const errorConnMessage = async (error, service, name, ip, attempt, logDir) => {
  const ipAddress = !ip ? `localhost` : ip;
  if (logDir) (await configureDirLog(`${logDir}`)) || null;

  if (error.code === 'ETIMEDOUT') {
    logger.error(`[${service}][${name}][${error.code}] - connection to ${ipAddress} timed out on attempt ${attempt}.`);
  } else if (error.code === 'ECONNRESET') {
    logger.error(`[${service}][${name}][${error.code}] - connection to ${ipAddress} reset on attempt ${attempt}.`);
  } else if (error.code === 'ERR_BAD_RESPONSE') {
    logger.error(`[${service}][${name}][${error.code}] - bad response from ${ipAddress} on attempt ${attempt}.`);
  } else if (error.code === 'ECONNABORTED') {
    logger.error(`[${service}][${name}][${error.code}] - connection to ${ipAddress} aborted on attempt ${attempt}.`);
  } else {
    logger.error(`[${service}][${name}][error][${error.code}] - station: ${ipAddress} after 3 attempts - ${error}`);
  }
};

exports.errorConnMessage = errorConnMessage;
