const { getLogger } = require('log4js');
const axios = require('axios');
let logger = getLogger('LOG');
const SERVICE_NAME = 'TlanticService';

const instance = axios.create({
  baseURL: process.env.API_BASE_URL
});

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

  static async postPunch(token, chunkWithSize100) {
    try {
      if (!token) {
        throw new Error(`[${SERVICE_NAME}][postPunch][error] - error when trying to fetch the token`);
      }

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
      logger.error(`[${SERVICE_NAME}][postPunch][error]\n`, error);
      return false;
    }
  }
}

exports.TlanticService = TlanticService;
