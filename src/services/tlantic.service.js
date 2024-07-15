const { getLogger } = require('log4js');
const axios = require('axios');
let logger = getLogger('LOG');
const SERVICE_NAME = 'TlanticService';

const instance = axios.create({
  baseURL: process.env.API_BASE_URL,
  localAddress: process.env.API_LOCAL_ADDRESS
});

const errorMessage = (error, service, name, ip, attempt) => {
  //const dirName = 'application';
  //await configureDirLog(`${dirName}`);
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

class TlanticService {
  static async getToken() {
    try {
      const headers = {
        domain: process.env.DOMAIN,
        'app-key': process.env.APPKEY,
        'Tlan-Bff-name': process.env.TLANBFFNAME,
        'Tlan-Bff-enrolment-id': process.env.TLANBFFENROLMENTID,
        'Tlan-Bff-channel': process.env.TLANBFFCHANNEL,
        AuthenticationKey: process.env.TLANBFFAUTHKEY,
        'Tlan-Bff-culture-code': process.env.TLANBFFCULTCODE
      };

      const response = await axios.request({
        method: 'POST',
        url: process.env.API_URL_AUTH,
        headers
      });

      if (!response.data.success) {
        throw new Error(`[${SERVICE_NAME}][getToken][error] - error when trying to fetch the token`);
      }
      const token = response.data.data.token;

      return token;
    } catch (error) {
      logger.error(`[${SERVICE_NAME}][getToken][error]\n`, error);
      return false;
    }
  }

  static async postPunch(token, chunkWithSize100, retries = 3, delay = 1000) {
    if (!token) {
      throw new Error(`[${SERVICE_NAME}][postPunch][error] - error when trying to fetch the token`);
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const options = {
          method: 'POST',
          url: process.env.API_BASE_URL,
          headers: {
            'Content-Type': 'application/json',
            'Tlan-Bff-name': process.env.TLANBFFNAME,
            'Tlan-Bff-enrolment-id': process.env.TLANBFFENROLMENTID,
            'Tlan-Bff-channel': process.env.TLANBFFCHANNEL,
            'Tlan-Bff-culture-code': process.env.TLANBFFCULTCODE,
            Authorization: 'Bearer ' + token
          },
          data: chunkWithSize100
        };

        const response = await instance.request(options);

        if (!response.data.success) {
          throw new Error(
            `[${SERVICE_NAME}][postPunch][error] - error when trying to post data \nStatus: ${response.data.data.result[0].status} \nMessage: ${response.data.data.result[0].message}`
          );
        }

        return true;
      } catch (error) {
        errorMessage(error, `${SERVICE_NAME}`, `postPunch`, `localhost`, `${attempt}`);

        if (attempt < retries) {
          const waitTime = delay * Math.pow(2, attempt);
          logger.info(`[${SERVICE_NAME}][postPunch][retry] - retrying in ${waitTime} ms...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        } else {
          errorMessage(error, `${SERVICE_NAME}`, `postPunch`, `${ip}`, `${attempt}`);
          return false;
        }
      }
    }
  }
}

exports.TlanticService = TlanticService;
