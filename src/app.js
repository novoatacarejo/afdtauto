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
      logger.info('No Stations finded');
      return;
    }

    const afdDate = returnAfdDate();

    for (const station of stations) {
      let employerDir = `../afd/${station.empresaDir}`;
      let txtFileName = `${employerDir}/afd_${station.empresaDir}_rlg${station.item}_ip${station.ipFinal}.txt`;
      let stationUrlLogin = `https://${station.ip}/login.fcgi?login=${station.userName}&password=${station.userPass}`;

      let token = await StationService.getToken(stationUrlLogin);
      logger.info(token);

      let stationUrlGetData = `https://${station.ip}/get_afd.fcgi?session=${token}&mode=${station.portaria}`;
      let stationUrlLogout = `https://${station.ip}/logout.fcgi?session=${token}`;

      let getData = await StationService.getAfdData(stationUrlGetData, token, afdDate);

      logger.info(getData);

      let logoutAfd = await StationService.logoutStation(stationUrlLogout);

      logger.info(logoutAfd);
    }
  } catch (error) {
    logger.error('Error on startApplication', error);
  } finally {
    process.exit(1);
  }
};
startApplication();
