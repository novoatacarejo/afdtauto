require('dotenv').config({ path: '../../.env' });
const axios = require('axios');
const https = require('https');
const { ConsincoService } = require('./consinco.service.js');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const { returnJsonLine, subtractHours, currentDate, getLogValue } = require('../utils/Utils.js');
const Logger = require('../middleware/Logger.middleware.js');

const SERVICE_NAME = 'StationService';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('application');

const { AFD_DIR, API_BASE_URL, API_LOCAL_ADDRESS } = process.env;

axios.defaults.timeout = 30000;

const instance = axios.create({
  baseURL: API_BASE_URL,
  localAddress: API_LOCAL_ADDRESS,
  timeout: 60000,
  httpAgent: new https.Agent({ keepAlive: true })
});

class StationService {
  static async isServerReachable(ip, login, pass) {
    const name = this.isServerReachable.name;
    try {
      await axios.get(`https://${ip}/login.fcgi?login=${login}&password=${pass}`, { timeout: 5000 });
      logger.info(name, `server on ip: ${ip} with login: ${login} is reachable`);
      return true;
    } catch (error) {
      logger.error(
        name,
        `error when trying to reach the server on ip: ${ip} with login: ${login} and password: ${pass}`
      );
      return false;
    }
  }

  static async getToken(enableLog, ip, login, pass, retries = 3, delay = 1000) {
    const name = this.getToken.name;
    const url = `https://${ip}/login.fcgi?login=${login}&password=${pass}`;
    const headers = {
      'Content-Length': '0'
    };

    const log = getLogValue(enableLog);

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await instance.request({
          method: 'POST',
          url,
          headers,
          insecureHTTPParser: true
        });

        if (!response.data) {
          const error = {
            code: `error when trying to fetch the token on ip: ${ip} with login: ${login}`
          };
          logger.replyConn(error, name, ip, attempt);
        }

        const token = response.data.session;
        if (!token) {
          const error = {
            code: `not connected on station ip: ${ip}. no token.`
          };
          logger.replyConn(error, name, ip, attempt);
        } else {
          log == 1
            ? logger.info(name, `connected on station ip: ${ip} with the token ${token} on attempt: ${attempt}`)
            : null;
        }

        return token;
      } catch (error) {
        logger.replyConn(error, name, ip, attempt);

        if (attempt < retries) {
          const waitTime = delay * Math.pow(2, attempt);
          logger.info(name, `- retrying in ${waitTime} ms...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        } else {
          logger.replyConn(error, name, ip, attempt);
          return false;
        }
      }
    }
  }

  static getAfd = async (ip, token, portaria, afdDateInfo) => {
    const name = this.getAfd.name;
    if (!token) {
      const error = {
        code: `error when trying to fetch the token on ip:${ip} with login: ${login} and password: ${pass}`
      };
      logger.replyConn(error, name, ip, 1);
    }
    try {
      const previousDate = {
        day: parseInt(afdDateInfo.day),
        month: parseInt(afdDateInfo.month),
        year: parseInt(afdDateInfo.year)
      };

      const url = `https://${ip}/get_afd.fcgi?session=${token}&mode=${portaria}`;

      const headers = {
        'Content-Type': 'application/json'
      };

      const options = {
        method: 'POST',
        url,
        insecureHTTPParser: true,
        headers,
        data: { initial_date: { day: previousDate.day, month: previousDate.month, year: previousDate.year } }
      };

      const response = await instance.request(options);

      if (!response) {
        const error = { code: `error when trying to post data: ${response.config.data}` };
        logger.replyConn(error, name, ip, 1);
      }

      let answer = response.data;

      return answer;
    } catch (error) {
      logger.replyConn(error, name, ip, 1);
    }
  };

  static getStationsInfo = async () => {
    const name = this.getStationsInfo.name;
    try {
      logger.info(name, `getting stations info`);
      const result = await ConsincoService.getStationsInfo();
      return result;
    } catch (error) {
      logger.replyConn(error, name, 'localhost', 1);
    }
  };

  static startSendLines = async (emp, it, ip) => {
    const name = this.startSendLines.name;
    const readFileAsync = promisify(fs.readFile);
    const dir = path.join(AFD_DIR, `${emp}`);
    const filename = `afd_${emp}_rlg${it}_ip${ip}.txt`;
    const file = path.join(dir, filename);

    if (!file) {
      const error = {
        code: `${file} not found`
      };
      logger.replyConn(error, name, ip, 1);
    }

    try {
      const data = await readFileAsync(file);
      const result = data.toString();
      let arrayData = result.split('\r\n');

      arrayData = arrayData.map((item) => {
        return returnJsonLine(item);
      });

      const arr = [];
      for (const data of arrayData) {
        if (!data.id) {
          continue;
        }

        let punchHour = data.hour;
        let punchDate = data.date;
        let today = currentDate();

        let previousHour = subtractHours(new Date(), 1);
        let testHour = punchHour >= previousHour ? true : false;
        let testDate = punchDate == today ? true : false;

        if (testHour === true && testDate === true) {
          const cod = await ConsincoService.getCodPessoa(data.id, data.lnLength);

          data.cardId = cod;
          delete data.hour;

          const punch = {
            cardId: data.cardId,
            punchSystemTimestamp: data.punchSystemTimestamp,
            punchUserTimestamp: data.punchUserTimestamp,
            punchType: data.punchType,
            punchLength: data.lnLength,
            punchId: data.id
          };

          arr.push(punch);
        }
      }
      return arr;
    } catch (error) {
      logger.replyConn(error, name, ip, 1);
      throw false;
    }
  };

  static logoutStation = async (enableLog, ip, token, retries = 3, delay = 1000) => {
    const name = this.logoutStation.name;
    const url = `https://${ip}/logout.fcgi?session=${token}`;
    const log = getLogValue(enableLog);

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const options = {
          method: 'POST',
          url,
          insecureHTTPParser: true
        };
        const response = await instance.request(options);

        if (!response) {
          const error = {
            code: `error when trying to logout on station ${ip} with token ${token}`
          };
          logger.replyConn(error, name, ip, attempt);
        } else {
          log == 1
            ? logger.info(
                name,
                `logout-ip:${response.request.host} | status:${response.status} | message:${response.statusText}`
              )
            : null;
        }
        return true;
      } catch (error) {
        logger.replyConn(error, name, ip, attempt);

        if (attempt < retries) {
          const waitTime = delay * Math.pow(2, attempt);
          logger.info(name, `-retrying in ${waitTime} ms...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        } else {
          logger.replyConn(error, name, ip, attempt);
          return false;
        }
      }
    }
  };
}

module.exports = { StationService };
