require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const { ConsincoService } = require('./consinco.service');
const axios = require('axios');
const https = require('https');
const { returnJsonLine, subtractHours } = require('../utils');
const { promisify } = require('util');
const { getLogger } = require('log4js');
let logger = getLogger('LOG');

const SERVICE_NAME = 'StationService';

axios.defaults.timeout = 30000;

const instance = axios.create({
  baseURL: process.env.API_BASE_URL,
  timeout: 60000,
  httpAgent: new https.Agent({ keepAlive: true })
});

class StationService {
  static getToken = async (ip, login, pass) => {
    try {
      const url = `https://${ip}/login.fcgi?login=${login}&password=${pass}`;

      const headers = {
        'Content-Length': '0'
      };

      const response = await instance.request({
        method: 'POST',
        url,
        headers,
        insecureHTTPParser: true
      });

      if (!response.data) {
        throw new Error(
          `getToken - error when trying to fetch the token on ip:${ip} with login: ${login} and password: ${pass}`
        );
      }

      let token = response.data.session;

      !token
        ? logger.error(`Not Connected on Station IP: ${ip} or the Station not respond`)
        : logger.info(`[LOGIN] Connected on Station IP: ${ip} with the token ${token}`);

      return token;
    } catch (error) {
      logger.error(SERVICE_NAME, error);
      return false;
    }
  };

  static getAfd = async (ip, token, portaria, afdDateInfo) => {
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

      if (!token) {
        throw new Error(
          `getAfd - error when trying to fetch the token on ip:${ip} with login: ${login} and password: ${pass}`
        );
      }

      const options = {
        method: 'POST',
        url,
        insecureHTTPParser: true,
        headers,
        data: { initial_date: { day: previousDate.day, month: previousDate.month, year: previousDate.year } }
      };

      const response = await instance.request(options);

      if (!response) {
        throw new Error('error when trying to post data: \n' + response);
      }

      let answer = response.data;

      return answer;
    } catch (error) {
      logger.error(SERVICE_NAME, error);
    }
  };

  static getStationsInfo = async () => {
    try {
      const result = await ConsincoService.getStationsInfo();
      return result;
    } catch (err) {
      logger.error(err);
    }
  };

  static startSendLines = async (emp, it, ip) => {
    const readFileAsync = promisify(fs.readFile);

    const dir = `./afd/${emp}/`;
    const filename = `afd_${emp}_rlg${it}_ip${ip}.txt`;
    const file = path.join(dir, filename);

    if (!file) {
      logger.error(`${file} not found`);
    }

    try {
      const data = await readFileAsync(file);
      const result = data.toString();
      let arrayData = result.split('\r\n');

      arrayData = arrayData.map((item) => {
        return returnJsonLine(item);
      });

      //let i = 0;
      const arr = [];
      for (const data of arrayData) {
        if (!data.id) {
          continue;
        }

        let punchHour = data.hour;
        let previousHour = subtractHours(new Date(), 1);
        let testHour = punchHour >= previousHour ? true : false;

        if (testHour === true) {
          //i++;
          const cod = await ConsincoService.getCodPessoa(data.id, data.lnLength);

          data.cardId = cod;
          delete data.lnLength;
          delete data.id;
          delete data.hour;

          const punch = {
            cardId: data.cardId,
            punchSystemTimestamp: data.punchSystemTimestamp,
            punchUserTimestamp: data.punchUserTimestamp,
            punchType: data.punchType
          };

          arr.push(punch);
        }
      }
      return arr;

      return;
    } catch (err) {
      logger.error(err);
      throw false;
    }
  };

  static logoutStation = async (ip, token) => {
    try {
      const url = `https://${ip}/logout.fcgi?session=${token}`;

      const options = {
        method: 'POST',
        url,
        insecureHTTPParser: true
      };

      const response = await instance.request(options);

      if (!response) {
        throw new Error('error when trying to logout:\n' + response);
      }
      let answer = {
        station: response.request.host,
        status: response.status,
        message: response.statusText
      };

      logger.info(`[LOGOUT] ip:${answer.station} | status:${answer.status} | message:${answer.message}`);

      return answer;
    } catch (error) {
      logger.error(SERVICE_NAME, error);
    }
  };

  static sendWfmOrcl = async (data) => {
    try {
      const url = `http://localhost:8086/wfm/afd`;

      const options = {
        method: 'POST',
        url,
        insecureHTTPParser: false,
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'node-js' },
        data
      };

      axios
        .request(options)
        .then((response) => {
          //logger.info(JSON.stringify(response.data));
          console.log(response.data);
        })
        .catch((error) => {
          console.error(error);
        });

      if (!response) {
        throw new Error('error when trying to logout:\n' + response);
      }
      return;
    } catch (error) {
      logger.error(SERVICE_NAME, error);
    }
  };
}

exports.StationService = StationService;
