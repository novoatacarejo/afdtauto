require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const { ConsincoService } = require('./consinco.service');
const axios = require('axios');
const https = require('https');
const { returnJsonLine, subtractHours, currentDate } = require('../utils');
const { promisify } = require('util');
const { getLogger } = require('log4js');
let logger = getLogger('LOG');

const SERVICE_NAME = 'StationService';

axios.defaults.timeout = 30000;

const instance = axios.create({
  baseURL: process.env.API_BASE_URL,
  localAddress: process.env.API_LOCAL_ADDRESS,
  timeout: 60000,
  httpAgent: new https.Agent({ keepAlive: true })
});

const errorMessage = (error, service, name, ip, attempt) => {
  const ipAddress = !ip ? `localhost` : ip;

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

class StationService {
  static async isServerReachable(ip, login, pass) {
    try {
      await axios.get(`https://${ip}/login.fcgi?login=${login}&password=${pass}`, { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  static async getToken(ip, login, pass, retries = 3, delay = 1000) {
    const url = `https://${ip}/login.fcgi?login=${login}&password=${pass}`;
    const headers = {
      'Content-Length': '0'
    };

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
          const name = `getToken`;
          const errorMessage = errorMessage(error, SERVICE_NAME, name, ip, attempt);
          throw new Error(errorMessage);
        }

        const token = response.data.session;
        if (!token) {
          const error = {
            code: `not connected on Station IP: ${ip}. No token.`
          };
          const name = `getToken`;
          const errorMessage = errorMessage(error, SERVICE_NAME, name, ip, attempt);
          throw new Error(errorMessage);
        } else {
          //logger.info(
          // `[${SERVICE_NAME}][getToken][login] - connected on station ip: ${ip} with the token ${token} on attempt: ${attempt}`
          // );
        }

        return token;
      } catch (error) {
        errorMessage(error, `${SERVICE_NAME}`, `getToken`, `${ip}`, `${attempt}`);

        if (attempt < retries) {
          const waitTime = delay * Math.pow(2, attempt);
          logger.info(`[${SERVICE_NAME}][getToken][retry] - retrying in ${waitTime} ms...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        } else {
          errorMessage(error, `${SERVICE_NAME}`, `getToken`, `${ip}`, `${attempt}`);
          return false;
        }
      }
    }
  }

  static getAfd = async (ip, token, portaria, afdDateInfo) => {
    if (!token) {
      const error = {
        code: `error when trying to fetch the token on ip:${ip} with login: ${login} and password: ${pass}`
      };
      const name = `getAfd`;
      const errorMessage = errorMessage(error, SERVICE_NAME, name, ip, 1);
      throw new Error(errorMessage);
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
        const name = `getAfd`;
        const errorMessage = errorMessage(error, SERVICE_NAME, name, ip, 1);
        throw new Error(errorMessage);
      }

      let answer = response.data;

      return answer;
    } catch (error) {
      errorMessage = (error, `${SERVICE_NAME}`, `getAfd`, ip, 1);
    }
  };

  static getStationsInfo = async () => {
    try {
      //logger.info(`[${SERVICE_NAME}][getStationsInfo][getting] - getting stations info`);
      const result = await ConsincoService.getStationsInfo();
      return result;
    } catch (error) {
      errorMessage = (error, `${SERVICE_NAME}`, `getStationsInfo`, ip, 1);
    }
  };

  static startSendLines = async (emp, it, ip) => {
    const readFileAsync = promisify(fs.readFile);
    const dir = `./afd/${emp}/`;
    const filename = `afd_${emp}_rlg${it}_ip${ip}.txt`;
    const file = path.join(dir, filename);

    if (!file) {
      const error = {
        code: `${file} not found`
      };
      const name = `startSendLines`;
      const errorMessage = errorMessage(error, SERVICE_NAME, name, ip, 1);
      throw new Error(errorMessage);
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
          //i++;
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
      errorMessage = (error, `${SERVICE_NAME}`, `startSendLines`, ip, 1);
      throw false;
    }
  };

  static logoutStation = async (ip, token, retries = 3, delay = 1000) => {
    const url = `https://${ip}/logout.fcgi?session=${token}`;

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
          const name = 'logoutStation';
          const errorMessage = errorMessage(error, SERVICE_NAME, name, ip, attempt);
          throw new Error(errorMessage);
        } else {
          // logger.info(
          //   `[${SERVICE_NAME}][logoutStation][logout] ip:${response.request.host} | status:${response.status} | message:${response.statusText}`
          // );
        }
        return true;
      } catch (error) {
        errorMessage(error, `${SERVICE_NAME}`, `logoutStation`, `${ip}`, `${attempt}`);

        if (attempt < retries) {
          const waitTime = delay * Math.pow(2, attempt);
          logger.info(`[${SERVICE_NAME}][logoutStation][retry] - retrying in ${waitTime} ms...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        } else {
          errorMessage(error, `${SERVICE_NAME}`, `logoutStation`, `${ip}`, `${attempt}`);
          return false;
        }
      }
    }
  };
}

exports.StationService = StationService;
