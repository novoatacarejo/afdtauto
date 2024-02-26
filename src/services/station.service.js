const { getLogger } = require('log4js');
const axios = require('axios');
let logger = getLogger('LOG');

const SERVICE_NAME = 'StationService';

const instance = axios.create({
  baseURL: process.env.API_BASE_URL
});

class StationService {
  static getToken = async (stationUrlInfo) => {
    try {
      const headers = {
        'Content-Length': '0'
      };

      const response = await axios.request({
        method: 'POST',
        url: stationUrlInfo,
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

  static getAfdData = async (stationUrlInfo, tokenInfo, afdDateInfo) => {
    try {
      const initial_date = {
        day: afdDateInfo.day,
        month: afdDateInfo.month,
        year: afdDateInfo.year
      };

      const headers = {
        contentType: 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': '85'
      };

      if (!tokenInfo) {
        throw new Error('error when trying to fetch the token');
      }

      const options = {
        method: 'POST',
        url: stationUrlInfo,
        insecureHTTPParser: true,
        headers,
        initial_date
      };

      logger.info(options);

      const response = await instance.request(options);

      if (!response) {
        throw new Error('error when trying to post data: \n' + response);
      }

      logger.info(response);
      let answer = response;
      return answer;
    } catch (error) {
      logger.error(SERVICE_NAME, error);
    }
  };

  static logoutStation = async (stationUrlInfo) => {
    try {
      const options = {
        method: 'POST',
        url: stationUrlInfo,
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
