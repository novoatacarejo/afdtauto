const { StationService } = require('./services/station.service');
const { getLogger } = require('log4js');
const { configureLogService, returnAfdDate, returnObjCorrectType, isDeviceOnline } = require('./utils');

let logger = getLogger('LOG');
let round = 0;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const startApplication = async () => {
  try {
    await configureLogService();

    const stations = await StationService.getStationsInfo();
    const afdDate = returnAfdDate(0);

    if (stations.length === 0) {
      logger.info('No Stations finded. Please, check the database connection');
      return;
    }

    await Promise.all(
      stations.map(async (station) => {
        round++;
        let clock = returnObjCorrectType(station);

        /*
        let netCheck = await isDeviceOnline(clock.ip);

        if (!netCheck) {
          console.log(`Station ip: ${clock.ip} not respond`);
        } else {
          
          let token = await StationService.getToken(clock.ip, clock.user, clock.pass);

          let punches = await StationService.getAfd(clock.ip, token, clock.portaria, afdDate);

          await writeAfdTxt(clock.empresaDir, clock.item, clock.ipFInal, punches);

          await StationService.logoutStation(clock.ip, token);
          */

        // }

        await StationService.startSendLines(clock.empresaDir, clock.item, clock.ipFInal);
      })
    );
  } catch (error) {
    logger.error('Error on startApplication', error);
  } finally {
    process.exit(1);
  }
};
startApplication();
