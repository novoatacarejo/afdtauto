require('dotenv').config('../../.env');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { currentLogTimeDate, currentDateHour } = require('../utils/Utils.js');
const Logger = require('../middleware/Logger.middleware.js');

const SERVICE_NAME = 'NetworkService';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('application');

const { CLOCKS_FILE, NETWORK_FILE } = process.env;

const jsonPath = CLOCKS_FILE;

const readJson = () => {
  const name = readJson.name;
  try {
    if (!fs.existsSync(jsonPath)) {
      fs.writeFileSync(jsonPath, JSON.stringify([]));
    }
    const data = fs.readFileSync(jsonPath, 'utf8');
    return JSON.parse(data).data;
  } catch (err) {
    logger.error(name, err);
    return [];
  }
};

const readFailedPings = () => {
  const failPath = NETWORK_FILE;
  const name = readFailedPings.name;
  try {
    if (!fs.existsSync(failPath)) {
      fs.writeFileSync(failPath, JSON.stringify({ data: [] }));
    }

    const data = fs.readFileSync(failPath, 'utf8');
    return JSON.parse(data).data;
  } catch (err) {
    logger.error(name, err);
    return { data: [] };
  }
};

const writeFailedPings = (failedPings) => {
  const failPath = NETWORK_FILE;
  const name = writeFailedPings.name;
  try {
    fs.writeFileSync(failPath, JSON.stringify({ data: failedPings }, null, 2));
  } catch (err) {
    logger.error(name, err);
  }
};

const writeStatus = (clock) => {
  const name = writeStatus.name;
  try {
    fs.writeFileSync(jsonPath, JSON.stringify({ data: clock }, null, 2));
  } catch (err) {
    logger.error(name, err);
  }
};

const updateDevices = (host, success) => {
  const name = updateDevices.name;
  let clock = readJson();
  const currentTime = currentLogTimeDate();
  const errorCode = 'ETIMEDOUT';
  const errorMessage = 'Host de destino inacessivel';

  if (!Array.isArray(clock)) {
    logger.error(name, 'object clock is not an array');
    clock = [];
  }

  const existingDeviceIndex = clock.findIndex((device) => device.ip === host);

  if (existingDeviceIndex !== -1) {
    clock[existingDeviceIndex].status = success ? 'success' : 'failed';
    clock[existingDeviceIndex].lastSyncDate = currentTime;
    clock[existingDeviceIndex].errorCode = success ? 'no error' : errorCode;
    clock[existingDeviceIndex].errorMessage = success ? 'no error' : errorMessage;
  }

  writeStatus(clock);

  if (!success) {
    const failedPings = readFailedPings();
    failedPings.push({
      ip: host,
      status: 'failed',
      lastSyncTime: currentTime,
      errorCode,
      errorMessage
    });
    writeFailedPings(failedPings);
  }
};

const isDeviceOnline = (host) => {
  const name = isDeviceOnline.name;
  return new Promise((resolve) => {
    exec(`ping -n 5 ${host}`, (error, stdout) => {
      if (error) {
        logger.error(name, `[failed] - station ${host} error:\n${error}`);
        updateDevices(host, false);
        return resolve(false);
      }

      if (stdout.includes('Host de destino inacess')) {
        logger.error(name, `[failed] - host unreachable: ${host}`);
        updateDevices(host, false);
        return resolve(false);
      } else {
        logger.info(name, `[successful] - working on station: ${host}`);
        updateDevices(host, true);
        return resolve(true);
      }
    });
  });
};

class NetworkService {
  static testConn = async () => {
    const name = this.testConn.name;
    const allDevices = readJson();

    logger.info(name, `checking devices at ${currentDateHour()}`);
    logger.info(name, `checking ${allDevices.length} devices`);

    if (!Array.isArray(allDevices)) {
      logger.error(name, `all devices is not an array`);
      return;
    }

    const promises = allDevices.map((device) => isDeviceOnline(device.ip));
    await Promise.all(promises);

    logger.info(name, `all devices have been checked at ${currentDateHour()}`);
  };
}

module.exports = { NetworkService };
