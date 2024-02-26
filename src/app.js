require('dotenv').config();
const { StationService } = require('./services/station.service');
const { ConsincoService } = require('./services/consinco.service');
const { getLogger } = require('log4js');
const { configureLogService, asyncForEach, makeChunk, returnAfdDate } = require('./utils');

let logger = getLogger('LOG');
let round = 0;
let total = 0;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const startApplication = async () => {
  try {
    await configureLogService();

    const stations = await ConsincoService.getStationsInfo();

    if (stations.length === 0) {
      logger.info('No Stations finded. Please, check the database connection');
      return;
    }

    const afdDate = returnAfdDate();

    stations.map(async (station) => {
      let token = await StationService.getToken(station.ip, station.userName, station.userPass);

      token
        ? logger.info(`Connected on Station IP: ${station.ip} with the token ${token}`)
        : logger.error(`Connected on Station IP: ${station.ip}`);

      let getData = await StationService.getAfdData(station.ip, token, station.portaria, afdDate);

      logger.info(getData);

      let logoutAfd = await StationService.logoutStation(station.ip, token);

      logger.info(logoutAfd);
    });

    /*
    // sucessfull attempt
    for (const station of stations) {
      let token = await StationService.getToken(station.ip, station.userName, station.userPass);
      logger.info(token);

      let getData = await StationService.getAfdData(station.ip, token, station.portaria, afdDate);

      logger.info(getData);

      let logoutAfd = await StationService.logoutStation(station.ip, token);

      logger.info(logoutAfd);
    }
    */
  } catch (error) {
    logger.error('Error on startApplication', error);
  } finally {
    process.exit(1);
  }
};
startApplication();
