const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { configureDirLog, currentLogTimeDate } = require('../utils');

const { getLogger } = require('log4js');
let logger = getLogger('LOG');

const jsonPath = path.join('C:/node/afdtauto/json', 'clocks.json');

const readJson = () => {
  try {
    if (!fs.existsSync(jsonPath)) {
      fs.writeFileSync(jsonPath, JSON.stringify([]));
    }
    const data = fs.readFileSync(jsonPath, 'utf8');
    return JSON.parse(data).data;
  } catch (err) {
    logger.error('[readJson][error] - error reading json file:', err);
    return [];
  }
};

const readFailedPings = () => {
  const failPath = path.join('C:/node/afdtauto/json', 'network.json');
  try {
    if (!fs.existsSync(failPath)) {
      fs.writeFileSync(failPath, JSON.stringify({ data: [] }));
    }

    const data = fs.readFileSync(failPath, 'utf8');
    return JSON.parse(data).data;
  } catch (err) {
    logger.error('[readFailedPings][error] - error reading failed json file:', err);
    return { data: [] };
  }
};

const writeFailedPings = (failedPings) => {
  const failPath = path.join('C:/node/afdtauto/json', 'network.json');
  try {
    fs.writeFileSync(failPath, JSON.stringify({ data: failedPings }, null, 2));
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

const updateDevices = async (host, success) => {
  let clock = await readJson();
  const currentTime = currentLogTimeDate();
  const errorCode = new String('ETIMEDOUT');
  const errorMessage = new String('Host de destino inacessivel');

  if (!Array.isArray(clock)) {
    logger.error('[updateDevices][error] - clock is not an array');
    clock = [];
  }

  const existingDeviceIndex = clock.findIndex((device) => device.ip === host);

  if (existingDeviceIndex !== -1) {
    clock[existingDeviceIndex].status = success ? 'success' : 'failed';
    clock[existingDeviceIndex].lastSyncDate = currentTime;
    clock[existingDeviceIndex].errorCode = errorCode;
    clock[existingDeviceIndex].errorMessage = errorMessage;
  }

  writeStatus(clock);

  if (!success) {
    const failedPings = await readFailedPings();
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

const isDeviceOnline = async (host) => {
  await configureDirLog('network');
  return new Promise((resolve) => {
    exec(`ping -n 5 ${host}`, (error, stdout) => {
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
        // logger.info(`[isDeviceOnline][network-check][successful] - working on station: ${host}`);
        updateDevices(host, true);
        return resolve(true);
      }
    });
  });
};

const testConn = async () => {
  const allDevices = readJson();
  const dirName = 'network';
  await configureDirLog(`${dirName}`);

  if (!Array.isArray(allDevices)) {
    logger.error(`[testConn][error] - allDevices is not an array`);
    return;
  }

  const promises = allDevices.map((device) => isDeviceOnline(device.ip));
  await Promise.all(promises);

  // logger.info(`[testConn] - All devices have been checked at ${currentDateHour()}`);
};

exports.testConn = testConn;
