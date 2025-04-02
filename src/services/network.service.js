require('dotenv').config('../../.env');
const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const { exec } = require('child_process');
const { currentLogTimeDate, currentDateHour, getLogValue } = require('../utils/Utils.js');
const { StationService } = require('../services/station.service.js');
const { Logger } = require('../middleware/Logger.middleware.js');
const stripJsonComments = require('strip-json-comments').default;

const SERVICE_NAME = 'NetworkService';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('network');

const { CLOCKS_DB, CLOCKS_FILE, FAILS_FILE, INFO_FILE } = process.env;

const clocksDBPath = CLOCKS_DB;
const clocksJsonPath = CLOCKS_FILE;
const infoJsonPath = INFO_FILE;
const failJsonPath = FAILS_FILE;

const clocksDB = fs.existsSync(clocksDBPath) ? stripJsonComments(fs.readFileSync(clocksDBPath, 'utf8')) : '{}';

const clocksJson = fs.existsSync(clocksJsonPath) ? stripJsonComments(fs.readFileSync(clocksJsonPath, 'utf8')) : '{}';

const infoJson = fs.existsSync(infoJsonPath) ? stripJsonComments(fs.readFileSync(infoJsonPath, 'utf8')) : '{}';

const failJson = fs.existsSync(failJsonPath) ? stripJsonComments(fs.readFileSync(failJsonPath, 'utf8')) : '{}';

const readClocksJson = async () => {
  const name = readClocksJson.name;
  try {
    /* if (!fs.existsSync(clocksJson)) {
      // 02/04/2025 - desativando para testar se é esse trecho que está limpando o arquivo clocks.jon em public
      // await fsPromises.writeFile(jsonPath, JSON.stringify({ data: [] }));

      logger.error(name, `file ${clocksJson} does not exist`); // Adicionei esta linha para verificar se o arquivo existe

      await fs.copyFileSync(clocksDB, clocksJson, (err) => {
        if (err) {
          logger.error(name, `error copying file: ${err}`);
        } else {
          logger.info(name, `file ${clocksDB} copied to ${clocksJson}`);
        }
      });
    } */
    const data = await fsPromises.readFile(clocksDB, 'utf8');
    const parsedData = JSON.parse(data);
    if (!Array.isArray(parsedData.data)) {
      throw new Error('JSON data is not an array');
    }
    return parsedData.data;
  } catch (err) {
    logger.error(name, err);
    return [];
  }
};

const readFailedPings = async () => {
  const name = readFailedPings.name;
  try {
    if (!fs.existsSync(failJson)) {
      await fsPromises.writeFile(failJson, JSON.stringify({ data: [] }));
    }

    const data = await fsPromises.readFile(failJson, 'utf8');
    return JSON.parse(data).data;
  } catch (err) {
    logger.error(name, err);
    return { data: [] };
  }
};

const writeFailedPings = async (failedPings) => {
  const name = writeFailedPings.name;
  try {
    await fsPromises.writeFile(failJson, JSON.stringify({ data: failedPings }, null, 2));
  } catch (err) {
    logger.error(name, err);
  }
};

const writeStatus = (clock) => {
  const name = writeStatus.name;
  try {
    fs.writeFileSync(clocksJson, JSON.stringify({ data: clock }, null, 2));
  } catch (err) {
    logger.error(name, err);
  }
};

const writeInfoStatus = async (data, enableLog = 'n') => {
  const name = writeInfoStatus.name;
  const log = getLogValue(enableLog);
  const currentTime = currentLogTimeDate();

  try {
    let existingData = { data: [] };
    if (fs.existsSync(infoJson)) {
      const fileContent = await fsPromises.readFile(infoJson, 'utf8');
      try {
        existingData = JSON.parse(fileContent);
      } catch (error) {
        logger.error(name, `erro ao analisar JSON existente em ${infoJson}:\n${error}`);
        existingData.data = [];
      }
    }

    if (!Array.isArray(existingData.data)) {
      logger.error(name, 'object existingData.data is not an array');
      existingData.data = [];
    }

    data.lastSyncDate = currentTime;
    data.status = 'success';

    const existingIndex = existingData.data.findIndex((item) => item.ip === data.ip);

    if (existingIndex !== -1) {
      if (log === 1) {
        logger.info(name, `escrevendo dados de ${existingData.data[existingIndex].ip}`);
      }
      existingData.data[existingIndex] = { ...existingData.data[existingIndex], ...data };
    } else {
      if (log === 1) {
        logger.info(name, `inserindo novo relogio ${data.ip}`);
      }
      existingData.data.push(data);
    }

    await fsPromises.writeFile(infoJson, JSON.stringify(existingData, null, 2));
    logger.info(name, `dados escritos com sucesso em ${infoJson}`);
  } catch (error) {
    logger.error(name, `erro ao escrever dados em ${infoJson}:\n ${error}`);
  }
};

const updateDevices = async (host, success) => {
  const name = updateDevices.name;
  let clock = await readClocksJson();
  const currentTime = currentLogTimeDate();
  const errorCode = 'ETIMEDOUT';
  const errorMessage = 'Host de destino inacessivel';

  try {
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

    await writeStatus(clock);

    if (!success) {
      const failedPings = await readFailedPings();

      if (!Array.isArray(failedPings)) {
        logger.error(name, 'object failedPings is not an array');
        failedPings = [];
      }

      failedPings.push({
        ip: host,
        status: 'failed',
        lastSyncTime: currentTime,
        errorCode,
        errorMessage
      });
      await writeFailedPings(failedPings);
    }
  } catch (error) {
    logger.error(name, error);
  }
};

const updateInfo = async (host, username, userpass, enableLog = 'n') => {
  const name = updateInfo.name;
  const currentTime = currentLogTimeDate();
  const log = getLogValue(enableLog);

  try {
    const clock = await StationService.getClockStatus(host, username, userpass, enableLog);

    if (clock === null) {
      logger.error(name, `station ${host} did not respond`);
      //await updateDevices(host, false);
      return;
    }

    if (log === 1) {
      logger.info(name, `station ${host} responded at ${currentTime}`);
    }

    await writeInfoStatus(clock, log);
  } catch (error) {
    logger.error(name, error);
  }
};

const isDeviceOnline = (host, enableLog = 'n') => {
  const name = isDeviceOnline.name;
  const log = getLogValue(enableLog);
  try {
    return new Promise((resolve) => {
      exec(`ping -n 7 ${host}`, async (error, stdout) => {
        if (error) {
          logger.error(name, `[failed] - station ${host}: ${error}`);
          await updateDevices(host, false);
          return resolve(false);
        }

        if (stdout.includes('Host de destino inacess')) {
          logger.error(name, `[failed] - host unreachable: ${host}`);
          await updateDevices(host, false);
          return resolve(false);
        } else {
          /*  if (log === 1) {
            logger.info(name, `[successful] - working on station: ${host}`);
          } */
          await updateDevices(host, true);
          return resolve(true);
        }
      });
    });
  } catch (error) {
    logger.error(name, error);
    return false;
  }
};

class NetworkService {
  static getClocksInfo = async (enableLog = 'n') => {
    const name = this.getClocksInfo.name;
    const log = getLogValue(enableLog);

    try {
      if (log === 1) {
        logger.info(name, `getting all devices at ${currentDateHour()}`);
      }
      const clocks = await readClocksJson();

      if (!Array.isArray(clocks)) {
        logger.error(name, `all devices is not an array`);
        return;
      }

      const successDevices = clocks.filter((device) => device.status === 'success');

      return successDevices;
    } catch (error) {
      logger.error(name, error);
    }
  };

  static testConn = async (enableLog = 'n') => {
    const name = this.testConn.name;
    const log = getLogValue(enableLog);
    const clocks = await this.getClocksInfo(log);

    try {
      /*      if (log === 1) {
        logger.info(name, `checking ${allDevices.length} devices at ${currentDateHour()}`);
        logger.info(name, `checking ${allDevices.length} devices`);
      } */

      if (!Array.isArray(clocks)) {
        logger.error(name, `all devices is not an array`);
        return;
      }

      const promises = clocks.map((device) => isDeviceOnline(device.ip, device.username, device.userpass, log));
      await Promise.all(promises);

      if (log === 1) {
        logger.info(name, `all devices have been checked at ${currentDateHour()}`);
      }
    } catch (error) {
      logger.error(name, error);
    }
  };

  static updateInfo = async (enableLog = 'n') => {
    const name = this.updateInfo.name;
    const log = getLogValue(enableLog);
    const clocks = await this.getClocksInfo(log);

    try {
      if (!Array.isArray(clocks)) {
        logger.error(name, `all devices is not an array`);
        return;
      }

      if (log === 1) {
        logger.info(name, `updating ${clocks.length} devices at ${currentDateHour()}`);
      }

      //const successDevices = clocks.filter((device) => device.status === 'success');
      const promises = clocks.map((device) => updateInfo(device.ip, device.username, device.userpass, log));

      //console.log(promises);
      await Promise.all(promises);

      if (log === 1) {
        logger.info(name, `all devices have been updated at ${currentDateHour()}`);
      }
    } catch (error) {
      logger.error(name, error);
    }
  };
}

module.exports = { NetworkService };
