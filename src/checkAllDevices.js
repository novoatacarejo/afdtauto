const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { configureDirLog, currentLogTimeDate } = require('./utils');

const { getLogger } = require('log4js');
let logger = getLogger('LOG');

const jsonPath = path.join('C:/node/afdtauto/json', 'clocks.json');
if (!fs.existsSync(jsonPath)) {
  fs.writeFileSync(jsonPath, JSON.stringify([]));
}

const readJson = () => {
  try {
    const data = fs.readFileSync(jsonPath, 'utf8');
    return JSON.parse(data).data;
  } catch (err) {
    logger.error('[readJson][error] - error reading log file:', err);
    return [];
  }
};

const readFailedPings = () => {
  const failPath = path.join('C:/node/afdtauto/json', 'fails.json');
  try {
    if (!fs.existsSync(failPath)) {
      fs.writeFileSync(failPath, JSON.stringify([]));
    }

    const data = fs.readFileSync(failPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    logger.error('[readFailedPings][error] - error reading failed json file:', err);
    return [];
  }
};

const writeFailedPings = (failedPings) => {
  const failPath = path.join('C:/node/afdtauto/json', 'fails.json');
  try {
    fs.writeFileSync(failPath, JSON.stringify(failedPings, null, 2));
  } catch (err) {
    logger.error('[writeFailedPings][Error] - Error writing to log file:', err);
  }
};

const writeStatus = (clock) => {
  try {
    fs.writeFileSync(jsonPath, JSON.stringify({ data: clock }, null, 2));
  } catch (err) {
    logger.error('[writeStatus][error] - error writing to log file:', err);
  }
};

const updateDevices = (host, success) => {
  let clock = readJson();
  const currentTime = currentLogTimeDate();

  if (!Array.isArray(clock)) {
    logger.error('[updateDevices][error] - clock is not an array');
    clock = [];
  }

  const existingDeviceIndex = clock.findIndex((device) => device.ip === host);

  if (existingDeviceIndex !== -1) {
    clock[existingDeviceIndex].status = success ? 'success' : 'failed';
    clock[existingDeviceIndex].lastSyncDate = currentTime;
  }

  writeStatus(clock);

  if (!success) {
    const failedPings = readFailedPings();
    failedPings.push({ ip: host, status: 'failed', lastSyncTime: currentTime });
    writeFailedPings(failedPings);
  }
};

const isDeviceOnline = async (host) => {
  return new Promise((resolve) => {
    exec(`ping -n 3 ${host}`, (error, stdout) => {
      if (error) {
        logger.error(`[isDeviceOnline][network-check][failed] - station ${host} error:\n${error}`);
        updateDevices(host, false);
        return resolve(false);
      }

      if (stdout.includes('Host de destino inacess')) {
        logger.error(`[isDeviceOnline][network-check][failed] - host unreachable: ${host}`);
        updateDevices(host, false);
        return resolve(false);
      } else {
        logger.info(`[isDeviceOnline][network-check][successful] - working on station: ${host}`);
        updateDevices(host, true);
        return resolve(true);
      }
    });
  });
};

const checkAllDevices = async () => {
  const dirName = 'testPing';
  await configureDirLog(`${dirName}`);
  const allDevices = readJson();

  if (!Array.isArray(allDevices)) {
    logger.error('[checkAllDevices][error] - allDevices is not an array');
    return;
  }

  const promises = allDevices.map((device) => isDeviceOnline(device.ip));
  await Promise.all(promises);

  logger.info('[checkAllDevices] - All devices have been checked.');
};

exports.checkAllDevices = checkAllDevices;
