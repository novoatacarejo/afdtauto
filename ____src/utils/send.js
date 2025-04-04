require('dotenv').config('../.env');
const { StationService, TlanticService } = require('../services/index.service.js');
const Logger = require('../middleware/Logger.middleware.js');
const {
  returnAfdDate,
  returnObjCorrectType,
  writeAfdTxt,
  makeChunk,
  dataHoraAtual,
  formatDate,
  clearScreen
} = require('./Utils.js');

const SERVICE_NAME = 'send';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('send');

let cron = require('node-cron');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let dataHorAtual = dataHoraAtual();

console.log(`Envio automático de batidas H-1 iniciado em ${dataHorAtual}`);

const startApplication = async () => {
  const name = startApplication.name;
  try {
    clearScreen();
    let round = 0;
    let total = 0;
    let processPid = process.pid;

    await configureLogService();

    logger.info(name, `iniciando JOB pid: ${processPid} em ${dataHorAtual}`);

    const stations = await StationService.getStationsInfo();
    const afdDate = returnAfdDate(0);

    if (stations.length === 0) {
      logger.info(name, 'no Stations finded. please, check the database connection');
      return;
    }

    await Promise.all(
      stations.map(async (station) => {
        round++;
        let clock = returnObjCorrectType(station);

        const netCheck = await isDeviceOnline(clock.ip);

        if (!netCheck) {
          logger.error(name, `station ip: ${clock.ip} not respond`);
        } else {
          let token = await StationService.getToken(clock.ip, clock.user, clock.pass);

          let afd = await StationService.getAfd(clock.ip, token, clock.portaria, afdDate);

          await writeAfdTxt(clock.empresaDir, clock.item, clock.ipFInal, afd);

          await StationService.logoutStation(clock.ip, token);
        }

        const punches = await StationService.startSendLines(clock.empresaDir, clock.item, clock.ipFInal);

        if (punches.length === 0) {
          logger.info(name, 'no punches to send');
          return;
        }

        const punchesFormated = punches.map((punch) => {
          const punchFormat = formatDate(punch.punchUserTimestamp);

          return {
            punch: {
              cardId: new String(punch.cardId),
              punchSystemTimestamp: punchFormat,
              punchUserTimestamp: punchFormat,
              punchType: new String(punch.punchType)
            }
          };
        });

        const chunkLength = 100;

        const chunks = makeChunk(punchesFormated, chunkLength);

        for (const chunk of chunks) {
          const result = await TlanticService.postPunch(chunk);

          round++;
          total += chunk.length;
          logger.info(name, `round ${round} - punches sent: ${total}`);
        }
      })
    );
  } catch (error) {
    logger.error(name, error);
  }
};

const send = async () => {
  await startApplication();
};

//

send();

cron.schedule('0 * * * *', async () => {
  send();
});
