const { getLogger } = require('log4js');
const axios = require('axios');
let logger = getLogger('LOG');

const SERVICE_NAME = 'StationService';

const instance = axios.create({
  baseURL: process.env.API_BASE_URL
});

class StationService {
  static getToken = async (url, login, pass) => {
    try {
      const headers = {
        'Content-Length': '0'
      };

      const response = await axios.request({
        method: 'POST',
        url: `https://${url}/login.fcgi?login=${login}&password=${pass}`,
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

  static getAfdData = async (url, token, portaria, afdDateInfo) => {
    try {
      let day = parseInt(afdDateInfo.day);
      let month = parseInt(afdDateInfo.month);
      let year = parseInt(afdDateInfo.year);

      const headers = {
        contentType: 'application/json',
        'Content-Type': 'application/json'
      };

      if (!token) {
        throw new Error('error when trying to fetch the token');
      }

      const options = {
        method: 'POST',
        url: `https://${url}/get_afd.fcgi?session=${token}&mode=${portaria}`,
        insecureHTTPParser: true,
        headers,
        data: { initial_date: { day, month, year } }
      };

      logger.info(options);

      const response = await instance.request(options);

      if (!response) {
        throw new Error('error when trying to post data: \n' + response);
      }

      logger.info(response.data);
      let answer = response.data;
      return answer;
    } catch (error) {
      logger.error(SERVICE_NAME, error);
    }
  };

  static logoutStation = async (url, token) => {
    try {
      const options = {
        method: 'POST',
        url: `https://${url}/logout.fcgi?session=${token}`,
        insecureHTTPParser: true
      };

      const response = await instance.request(options);

      if (!response) {
        throw new Error('error when trying to logout:\n' + response);
      }
      let answer =
        !response === null
          ? 'Logout efetuado!'
          : `\nStation: ${response.request.host}\nStatus: ${response.status}\nMessage: ${response.statusText}`;
      return answer;
    } catch (error) {
      logger.error(SERVICE_NAME, error);
    }
  };
}

exports.StationService = StationService;
