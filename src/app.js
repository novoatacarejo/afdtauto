require('dotenv').config();
const { StationService } = require('./services/station.service');
const { ConsincoService } = require('./services/consinco.service');
const { getLogger } = require('log4js');
const { configureLogService, returnAfdDate, writeAfdTxt, returnObjCorrectType, isDeviceOnline } = require('./utils');

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

    const afdDate = returnAfdDate(0);
    total = stations.length;

    await Promise.all(
      stations.map(async (station) => {
        round++;
        logger.info(`[JOB ${round} - ${round}/${total}][CONNECT] Working on station: ${station.ip}`);

        let clock = returnObjCorrectType(station);

        let netCheck = await isDeviceOnline(clock.ip);

        if (netCheck) {
          let token = await StationService.getToken(clock.ip, clock.user, clock.pass);

          let punches = await StationService.getAfdData(clock.ip, token, clock.portaria, afdDate);

          await writeAfdTxt(clock.empresaDir, clock.item, clock.ipFInal, punches);

          await StationService.logoutStation(clock.ip, token);
        } else {
          logger.error(netCheck);
        }
      })
    );
  } catch (error) {
    logger.error('Error on startApplication', error);
  } finally {
    process.exit(1);
  }
};
startApplication();
