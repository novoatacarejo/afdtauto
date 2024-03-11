require('dotenv').config('../.env');
const { TlanticService } = require('./services/tlantic.service');
const { StationService } = require('./services/station.service');
const { getLogger } = require('log4js');
const {
  configureLogService,
  returnAfdDate,
  returnObjCorrectType,
  isDeviceOnline,
  writeAfdTxt,
  makeChunk,
  dataHoraAtual
} = require('./utils');

let logger = getLogger('LOG');
//let cron = require('node-cron');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const startApplication = async () => {
  let round = 0;
  let total = 0;

  try {
    let dataHorAtual = await dataHoraAtual();
    await configureLogService();

    logger.info(`[STARTING] Iniciando JOB em ${dataHorAtual}`);

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

        let netCheck = await isDeviceOnline(clock.ip);

        if (!netCheck) {
          logger.error(`Station ip: ${clock.ip} not respond`);
        } else {
          let token = await StationService.getToken(clock.ip, clock.user, clock.pass);

          let afd = await StationService.getAfd(clock.ip, token, clock.portaria, afdDate);

          await writeAfdTxt(clock.empresaDir, clock.item, clock.ipFInal, afd);

          await StationService.logoutStation(clock.ip, token);
        }

        const punches = await StationService.startSendLines(clock.empresaDir, clock.item, clock.ipFInal);

        if (punches.length === 0) {
          logger.info('No punches to send');
          return;
        }

        const punchesFormated = punches.map((punch) => {
          return {
            punch: {
              cardId: new String(punch.cardId),
              punchSystemTimestamp: punch.punchSystemTimestamp,
              punchUserTimestamp: punch.punchUserTimestamp,
              punchType: new String(punch.punchType)
            }
          };
        });

        const chunkLength = 100;

        const chunks = makeChunk(punchesFormated, chunkLength);

        for (const chunk of chunks) {
          await TlanticService.postPunch(chunk);
          round++;
          total += chunk.length;
          logger.info(`[SENDING] Round ${round} - punches sent: ${total}`);
        }
      })
    );
  } catch (error) {
    logger.error('Error on startApplication', error);
  } finally {
    let dataHorAtual = await dataHoraAtual();
    logger.info(`[ENDING] Finalizando JOB em ${dataHorAtual}`);
    process.exit(1);
  }
};

console.log(`Envio automático de batidas H-1 iniciado em ${dataHoraAtual()}`);

/* cron.schedule('0 * * * *', async () => {
  await startApplication();
}); */

const start = async () => {
  await startApplication();
};

start();
