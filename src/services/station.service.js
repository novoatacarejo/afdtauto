const { getLogger } = require('log4js');
const axios = require('axios');
let logger = getLogger('LOG');

const SERVICE_NAME = 'StationService';

const instance = axios.create({
  baseURL: process.env.API_BASE_URL
});

class StationService {
  static getToken = async (ip, login, pass) => {
    try {
      const url = `https://${ip}/login.fcgi?login=${login}&password=${pass}`;

      const headers = {
        'Content-Length': '0'
      };

      const response = await axios.request({
        method: 'POST',
        url,
        headers,
        insecureHTTPParser: true
      });

      if (!response.data) {
        throw new Error('error when trying to fetch the token');
      }

      let token = response.data.session;

      return token;
    } catch (error) {
      logger.error(SERVICE_NAME, error);
      return false;
    }
  };

  static getAfdData = async (ip, token, portaria, afdDateInfo) => {
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
        throw new Error('error when trying to fetch the token');
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

      return answer;
    } catch (error) {
      logger.error(SERVICE_NAME, error);
    }
  };
}

exports.StationService = StationService;
