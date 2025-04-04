require('dotenv').config('../../.env');
const fs = require('fs');
const fsPromises = fs.promises;
const { currentLogTimeDate, getLogValue } = require('../utils/Utils.js');
const { StationService } = require('../services/station.service.js');
const { Logger } = require('../middleware/Logger.middleware.js');

const SERVICE_NAME = 'FilesService';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('application');

const { CLOCKS_DB, CLOCKS_FILE, FAILS_FILE, INFO_FILE } = process.env;

class FilesService {
  static validateArray(data, name) {
    if (!Array.isArray(data)) {
      logger.error(name, 'Data is not an array. Resetting to an empty array.');
      return [];
    }
    return data;
  }

  static async readJsonFile(filePath, defaultData = { data: [] }) {
    try {
      if (!fs.existsSync(filePath)) {
        await fsPromises.writeFile(filePath, JSON.stringify(defaultData, null, 2));
        return defaultData.data;
      }

      const fileContent = await fsPromises.readFile(filePath, 'utf8');
      const parsedData = JSON.parse(fileContent);
      return this.validateArray(parsedData.data, 'readJsonFile');
    } catch (error) {
      logger.error('readJsonFile', `Error reading file ${filePath}: ${error.message}`);
      return defaultData.data;
    }
  }

  static async writeJsonFile(filePath, data) {
    try {
      await fsPromises.writeFile(filePath, JSON.stringify({ data }, null, 2));
      logger.info('writeJsonFile', `File ${filePath} updated successfully.`);
    } catch (error) {
      logger.error('writeJsonFile', `Error writing to file ${filePath}: ${error.message}`);
    }
  }

  static async readClocksJson(clock) {
    const name = this.readClocksJson.name;
    const jsonFilePath = clock || CLOCKS_DB;
    return this.readJsonFile(jsonFilePath);
  }

  static async readFailedPings() {
    return this.readJsonFile(FAILS_FILE);
  }

  static async writeFailedPings(failedPings) {
    return this.writeJsonFile(FAILS_FILE, failedPings);
  }

  static async writeStatus(clock) {
    const name = this.writeStatus.name;
    try {
      const existingData = await this.readJsonFile(CLOCKS_FILE);
      const existingIndex = existingData.findIndex((item) => item.ip === clock.ip);

      if (existingIndex !== -1) {
        existingData[existingIndex] = { ...existingData[existingIndex], ...clock };
      } else {
        existingData.push(clock);
      }

      await this.writeJsonFile(CLOCKS_FILE, existingData);
    } catch (error) {
      logger.error(name, `Error updating status: ${error.message}`);
    }
  }

  static async writeInfoStatus(data, enableLog = 'n') {
    const name = this.writeInfoStatus.name;
    const log = getLogValue(enableLog);
    const currentTime = currentLogTimeDate();

    try {
      const existingData = await this.readJsonFile(INFO_FILE);

      data.lastSyncDate = currentTime;
      data.status = 'success';

      const existingIndex = existingData.findIndex((item) => item.ip === data.ip);

      if (existingIndex !== -1) {
        if (log === 1) {
          logger.info(name, `Updating data for ${existingData[existingIndex].ip}`);
        }
        existingData[existingIndex] = { ...existingData[existingIndex], ...data };
      } else {
        if (log === 1) {
          logger.info(name, `Adding new clock ${data.ip}`);
        }
        existingData.push(data);
      }

      await this.writeJsonFile(INFO_FILE, existingData);
    } catch (error) {
      logger.error(name, `Error writing info status: ${error.message}`);
    }
  }

  static async updateDevices(host, success) {
    const name = this.updateDevices.name;
    const clock = await this.readClocksJson(CLOCKS_DB);
    const currentTime = currentLogTimeDate();
    const errorCode = 'ETIMEDOUT';
    const errorMessage = 'Host de destino inacessível';

    try {
      const existingDeviceIndex = clock.findIndex((device) => device.ip === host);

      const infoClock =
        existingDeviceIndex !== -1
          ? {
              nroEmpresa: clock[existingDeviceIndex].nroEmpresa,
              username: clock[existingDeviceIndex].username,
              userpass: clock[existingDeviceIndex].userpass,
              ip: clock[existingDeviceIndex].ip,
              lastSyncDate: currentTime,
              nomeEmpresa: clock[existingDeviceIndex].nomeEmpresa,
              status: success ? 'success' : 'failed',
              errorCode: success ? 'no error' : errorCode,
              errorMessage: success ? 'no error' : errorMessage
            }
          : {
              ip: host,
              lastSyncDate: currentTime,
              status: 'failed',
              errorCode,
              errorMessage
            };

      await this.writeStatus(infoClock);

      logger.info(name, `Updating device ${host} in ${CLOCKS_FILE}`);

      if (!success) {
        const failedPings = await this.readFailedPings();
        failedPings.push({
          ip: host,
          status: 'failed',
          lastSyncTime: currentTime,
          errorCode,
          errorMessage
        });

        await this.writeFailedPings(failedPings);
      }
    } catch (error) {
      logger.error(name, `Error updating device ${host}: ${error.message}`);
    }
  }

  static async updateInfo(host, username, userpass, enableLog = 'n') {
    const name = this.updateInfo.name;
    const currentTime = currentLogTimeDate();
    const log = getLogValue(enableLog);

    try {
      const clock = await StationService.getClockStatus(host, username, userpass, enableLog);

      if (!clock) {
        logger.error(name, `Station ${host} did not respond`);
        return;
      }

      if (log === 1) {
        logger.info(name, `Station ${host} responded at ${currentTime}`);
      }

      await this.writeInfoStatus(clock, log);
    } catch (error) {
      logger.error(name, `Error updating info for ${host}: ${error.message}`);
    }
  }
}

module.exports = { FilesService };
