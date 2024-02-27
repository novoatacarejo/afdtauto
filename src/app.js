require('dotenv').config();
const { StationService } = require('./services/station.service');
const { ConsincoService } = require('./services/consinco.service');
const { getLogger } = require('log4js');
const { configureLogService, returnAfdDate, writeAfdTxt, returnObjCorrectType } = require('./utils');

let logger = getLogger('LOG');
let afdw = getLogger('LOG');
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

    await Promise.all(
      stations.map(async (station) => {
        round++;
        total += station.length;
        logger.info(`[STATUS] Round ${round} - total get: ${total}/${station.length}`);

        !station
          ? logger.error(`Not station identified! Check your results of database connection!`)
          : logger.info(`[JOB ${round}][CONNECT] Working on station: ${station.ip}`);

        let clock = await returnObjCorrectType(station);

        let token = await StationService.getToken(clock.ip, clock.user, clock.pass);

        !token
          ? logger.error(`Not Connected on Station IP: ${clock.ip} or the Station not respond`)
          : logger.info(`[LOGIN] Connected on Station IP: ${clock.ip} with the token ${token}`);

        let punches = await StationService.getAfdData(clock.ip, token, clock.portaria, afdDate);

        await writeAfdTxt(clock.empresaDir, clock.item, clock.ipFInal, punches);

        let logout = await StationService.logoutStation(clock.ip, token);
        logger.info(`[LOGOUt] ip:${logout.station} | status:${logout.status} | message:${logout.message}`);
      })
    );
  } catch (error) {
    logger.error('Error on startApplication', error);
  } finally {
    process.exit(1);
  }
};
startApplication();
