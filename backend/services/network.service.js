require('dotenv').config('../../.env');
const { exec } = require('child_process');
const { currentDateHour, getLogValue } = require('../utils/Utils.js');
const { FilesService } = require('../controllers/files.controller.js');
const { Logger } = require('../middleware/Logger.middleware.js');

const SERVICE_NAME = 'NetworkService';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('application');

const { CLOCKS_DB } = process.env;

class NetworkService {
  static validateArray(data, name) {
    if (!Array.isArray(data)) {
      logger.error(name, 'Data is not an array. Resetting to an empty array.');
      return [];
    }
    return data;
  }

  static logMessage(log, name, message) {
    if (log === 1) {
      logger.info(name, message);
    }
  }

  static getClocksInfo = async (enableLog = 'n') => {
    const name = this.getClocksInfo.name;
    const log = getLogValue(enableLog);

    try {
      this.logMessage(log, name, `Getting all devices at ${currentDateHour()}`);
      const clocks = await FilesService.readClocksJson(CLOCKS_DB);

      if (!this.validateArray(clocks, name)) return;

      const successDevices = clocks.filter((device) => device.status === 'success' || device.status === 'failed');
      if (successDevices.length === 0) {
        this.logMessage(log, name, `No devices found with status success or failed`);
        return;
      }

      this.logMessage(log, name, `Found ${successDevices.length} devices with status success`);

      return successDevices;
    } catch (error) {
      logger.error(name, error);
    }
  };

  static testNetCon = async (enableLog = 'n') => {
    const name = this.testNetCon.name;
    const log = getLogValue(enableLog);

    try {
      const clocks = await this.getClocksInfo(log);
      if (!this.validateArray(clocks, name)) return;

      const promises = clocks.map((device) => this.isDeviceOnline(device.ip, log));
      await Promise.all(promises);

      this.logMessage(log, name, `All devices have been checked at ${currentDateHour()}`);
    } catch (error) {
      logger.error(name, error);
    }
  };

  static updateNetInfo = async (enableLog = 'n') => {
    const name = this.updateNetInfo.name;
    const log = getLogValue(enableLog);

    try {
      const clocks = await this.getClocksInfo(log);
      if (!this.validateArray(clocks, name)) return;

      this.logMessage(log, name, `Updating ${clocks.length} devices at ${currentDateHour()}`);

      const promises = clocks.map((device) =>
        FilesService.updateInfo(device.ip, device.username, device.userpass, log)
      );
      await Promise.all(promises);

      this.logMessage(log, name, `All devices have been updated at ${currentDateHour()}`);
    } catch (error) {
      logger.error(name, error);
    }
  };

  static async isDeviceOnline(host, enableLog = 'n') {
    const name = this.isDeviceOnline.name;
    const log = getLogValue(enableLog);

    try {
      return new Promise((resolve) => {
        exec(`ping -n 7 ${host}`, async (error, stdout) => {
          if (error || stdout.includes('Host de destino inacess')) {
            logger.error(name, `[failed] - host unreachable: ${host}`);
            await FilesService.updateDevices(host, false);
            return resolve(false);
          }

          await FilesService.updateDevices(host, true);
          this.logMessage(log, name, `[successful] - working on station: ${host}`);
          return resolve(true);
        });
      });
    } catch (error) {
      logger.error(name, error);
      return false;
    }
  }
}

module.exports = { NetworkService };
