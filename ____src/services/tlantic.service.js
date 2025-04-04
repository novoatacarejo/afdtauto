require('dotenv').config({ path: '../../.env' });
const axios = require('axios');
const { Logger } = require('../middleware/Logger.middleware.js');

const SERVICE_NAME = 'TlanticService';

let logger = new Logger(SERVICE_NAME);
logger.service = SERVICE_NAME;
logger.configureDirLogService('application');

const {
  API_BASE_URL,
  API_URL_AUTH,
  API_LOCAL_ADDRESS,
  DOMAIN,
  APPKEY,
  TLANBFFNAME,
  TLANBFFENROLMENTID,
  TLANBFFCHANNEL,
  TLANBFFAUTHKEY,
  TLANBFFCULTCODE
} = process.env;

const instance = axios.create({
  baseURL: API_BASE_URL,
  localAddress: API_LOCAL_ADDRESS
});

class TlanticService {
  static async getToken() {
    const name = this.getToken.name;
    try {
      const headers = {
        domain: DOMAIN,
        'app-key': APPKEY,
        'Tlan-Bff-name': TLANBFFNAME,
        'Tlan-Bff-enrolment-id': TLANBFFENROLMENTID,
        'Tlan-Bff-channel': TLANBFFCHANNEL,
        AuthenticationKey: TLANBFFAUTHKEY,
        'Tlan-Bff-culture-code': TLANBFFCULTCODE
      };

      const response = await axios.request({
        method: 'POST',
        url: API_URL_AUTH,
        headers
      });

      if (!response.data.success) {
        logger.error(name, `error when trying to fetch the token`);
      }
      const token = response.data.data.token;

      return token;
    } catch (error) {
      logger.error(name, error);
      return false;
    }
  }

  static async postPunch(token, chunkWithSize100, retries = 5, delay = 1000) {
    const name = this.postPunch.name;
    if (!token) {
      logger.error(name, `error when trying to fetch the token`);
      return false;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const options = {
          method: 'POST',
          url: API_BASE_URL,
          headers: {
            'Content-Type': 'application/json',
            'Tlan-Bff-name': TLANBFFNAME,
            'Tlan-Bff-enrolment-id': TLANBFFENROLMENTID,
            'Tlan-Bff-channel': TLANBFFCHANNEL,
            'Tlan-Bff-culture-code': TLANBFFCULTCODE,
            Authorization: 'Bearer ' + token
          },
          data: chunkWithSize100
        };

        const response = await instance.request(options);

        if (!response.data.success) {
          logger.error(
            name,
            `error when trying to post data \nstatus: ${response.data.data.result[0].status} \nmessage: ${response.data.data.result[0].message}`
          );
          return false;
        }

        return true;
      } catch (error) {
        logger.replyConn(error, name, 'localhost', attempt);

        if (attempt < retries) {
          const waitTime = delay * Math.pow(2, attempt);
          logger.info(name, `- retrying in ${waitTime} ms...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        } else {
          logger.replyConn(error, name, 'localhost', attempt);
          return false;
        }
      }
    }
  }
}

module.exports = { TlanticService };
