require('dotenv').config({ path: '../../.env' });
const axios = require('axios');
const https = require('https');
const { ConsincoService } = require('./consinco.service.js');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const {
  assembleArrayObjects,
  returnJsonLine,
  readJsonClock,
  subtractHours,
  currentDate,
  getLogValue,
  convertUptime
} = require('../utils/Utils.js');
const { Logger } = require('../middleware/Logger.middleware.js');

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

const returnAxiosOptions = (url) => {
  return {
    method: 'POST',
    url,
    headers: {
      'Content-Type': 'application/json'
    },
    insecureHTTPParser: true
  };
};

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

  static async getToken(ip, login, pass, enableLog = 'n', retries = 5, delay = 1000) {
    const name = this.getToken.name;
    const log = getLogValue(enableLog);

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
          logger.replyConn(error, name, ip, attempt);
        }

        const token = await response.data.session;
        if (!token) {
          const error = {
            code: `not connected on station ip: ${ip}. no token.`
          };
          logger.replyConn(error, name, ip, attempt);
        } else {
          if (log == 1) {
            logger.info(name, `connected on station ip: ${ip} with the token ${token} on attempt: ${attempt}`);
          }
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

  static logoutStation = async (ip, token, enableLog = 'n', retries = 5, delay = 1000) => {
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

  static getClockInfo = async (ip, enableLog = 'n') => {
    const name = this.getClockInfo.name;
    const log = getLogValue(enableLog);

    try {
      const { userName, userPass } = await readJsonClock(ip, log);

      const token = await this.getToken(ip, userName, userPass, log);

      if (!token) {
        logger.error(name, `erro ao obter token da estacao ipAddr: ${ip}`);
      } else {
        if (log === 1) {
          logger.info(name, `connected on station ipAddr: ${ip} with the token ${token}`);
        }

        const url = `https://${ip}/get_info.fcgi?session=` + token;

        const response = await instance.request({
          method: 'POST',
          url,
          //contentType: 'application/json',
          headers: {
            'Content-Type': 'application/json'
          },
          insecureHTTPParser: true
        });

        this.logoutStation(ip, token, log);

        if (!response) {
          logger.error(name, `erro ao obter informacoes da estacao ipAddr: ${ip}`);
        } else {
          const uptime = response.data.uptime;
          response.data.uptime = convertUptime(uptime);

          return response.data || null;
        }
      }
    } catch (error) {
      console.log(error);
      logger.error(name, error);
    }
  };

  static getClockSystem = async (ip, enableLog = 'n') => {
    const name = this.getClockSystem.name;
    const log = getLogValue(enableLog);

    try {
      const { userName, userPass } = await readJsonClock(ip, log);

      const token = await this.getToken(ip, userName, userPass, log);

      if (!token) {
        logger.error(name, `erro ao obter token da estacao ipAddr: ${ip}`);
      } else {
        if (log === 1) {
          logger.info(name, `connected on station ipAddr: ${ip} with the token ${token}`);
        }

        const url = `https://${ip}/get_system_information.fcgi?session=` + token;

        const response = await instance.request({
          method: 'POST',
          url,
          headers: {
            'Content-Type': 'application/json'
          },
          insecureHTTPParser: true
        });

        this.logoutStation(ip, token, log);

        if (!response) {
          logger.error(name, `erro ao obter informacoes da estacao ipAddr: ${ip}`);
        } else {
          const uptime = response.data.uptime;
          response.data.uptime = convertUptime(uptime);

          return response.data || null;
        }
      }
    } catch (error) {
      console.log(error);
      logger.error(name, error);
    }
  };

  static getClockAbout = async (ip, enableLog = 'n') => {
    const name = this.getClockAbout.name;
    const log = getLogValue(enableLog);

    try {
      const { userName, userPass } = await readJsonClock(ip, log);

      const token = await this.getToken(ip, userName, userPass, log);

      if (!token) {
        logger.error(name, `erro ao obter token da estacao ipAddr: ${ip}`);
      } else {
        if (log === 1) {
          logger.info(name, `connected on station ipAddr: ${ip} with the token ${token}`);
        }

        const url = `https://${ip}/get_about.fcgi?session=` + token;

        const response = await instance.request({
          method: 'POST',
          url,
          headers: {
            'Content-Type': 'application/json'
          },
          insecureHTTPParser: true
        });

        this.logoutStation(ip, token, log);

        if (!response) {
          logger.error(name, `erro ao obter informacoes da estacao ipAddr: ${ip}`);
        } else {
          return response.data || null;
        }
      }
    } catch (error) {
      console.log(error);
      logger.error(name, error);
    }
  };

  static getClockNetwork = async (ip, enableLog = 'n') => {
    const name = this.getClockNetwork.name;
    const log = getLogValue(enableLog);

    try {
      const { userName, userPass } = await readJsonClock(ip, log);

      const token = await this.getToken(ip, userName, userPass, log);

      if (!token) {
        logger.error(name, `erro ao obter token da estacao ipAddr: ${ip}`);
      } else {
        if (log === 1) {
          logger.info(name, `connected on station ipAddr: ${ip} with the token ${token}`);
        }

        const url = `https://${ip}/set_system_network.fcgi?session=` + token;

        const response = await instance.request({
          method: 'POST',
          url,
          headers: {
            'Content-Type': 'application/json'
          },
          insecureHTTPParser: true
        });

        this.logoutStation(ip, token, log);

        if (!response) {
          logger.error(name, `erro ao obter informacoes da estacao ipAddr: ${ip}`);
        } else {
          return response.data || null;
        }
      }
    } catch (error) {
      console.log(error);
      logger.error(name, error);
    }
  };

  static getClockStatus = async (ip, user, pass, enableLog = 'n') => {
    const name = this.getClockStatus.name;
    const log = getLogValue(enableLog);

    let userName;
    let userPass;

    if (!user && !pass) {
      const clockData = await readJsonClock(ip, log);
      if (clockData) {
        ({ userName, userPass } = clockData);
      } else {
        throw new Error(`Failed to read clock data for IP: ${ip}`);
      }
    } else {
      userName = user;
      userPass = pass;
    }

    try {
      try {
        const token = await this.getToken(ip, userName, userPass, log);
      } catch (error) {
        logger.error(`${name}-token`, error);
      }

      if (!token) {
        logger.error(name, `erro ao obter token da estacao ipAddr: ${ip}`);
      } else {
        if (log === 1) {
          logger.info(name, `connected on station ipAddr: ${ip} with the token ${token}`);
        }

        const url1 = `https://${ip}/get_info.fcgi?session=` + token;

        const url2 = `https://${ip}/get_system_information.fcgi?session=` + token;

        const url3 = `https://${ip}/get_about.fcgi?session=` + token;

        try {
          const info = await instance.request(returnAxiosOptions(url1));

          const system = await instance.request(returnAxiosOptions(url2));

          const about = await instance.request(returnAxiosOptions(url3));
        } catch (error) {
          logger.error(`${name}-request`, error);
        }

        try {
          this.logoutStation(ip, token, log);
        } catch (error) {
          logger.error(`${name}-logoutStation`, error);
        }

        if (!info || !system || !about) {
          logger.error(name, `erro ao obter informacoes da estacao ipAddr: ${ip}`);
        } else {
          const uptime = info.data.uptime;
          info.data.uptime = convertUptime(uptime);

          const obj = {
            ip: ip,
            mac: about.data.mac,
            serial: about.data.nSerie,
            firmware: about.data.versionFW,
            mrp: about.data.versionMRP,
            memoriaUtilizada: system.data.memory,
            ultimoNroNSR: system.data.last_nsr,
            totalUsuarios: system.data.user_count,
            usuarios: info.data.user_count,
            usuariosAdmin: info.data.administrator_count,
            digitaisCadastradas: info.data.template_count,
            usuariosComSenha: info.data.password_count,
            codigoBarras: info.data.bars_count,
            cartoesRfid: info.data.rfid_count,
            tempoAtividade: info.data.uptime,
            totalTicketsImpressos: info.data.cuts,
            qtdBobina: system.data.coil_paper,
            totalBobina: system.data.total_paper,
            prontoImpressao: system.data.paper_ok,
            acabandoBobina:
              system.data.low_paper === null ||
              system.data.low_paper === undefined ||
              system.data.low_paper === '' ||
              system.data.low_paper === 'null' ||
              system.data.low_paper === false ||
              system.data.low_paper === 'undefined'
                ? false
                : true
          };

          return obj || null;
        }
      }
    } catch (error) {
      console.log(error);
      logger.error(name, error);
    }
  };
}

module.exports = { StationService };
