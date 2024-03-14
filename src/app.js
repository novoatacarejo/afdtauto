require('dotenv').config('../.env');
const { TlanticService } = require('./services/tlantic.service');
const { StationService } = require('./services/station.service');
const { ConsincoService } = require('./services/consinco.service');
const { getLogger } = require('log4js');
const {
  configureLogService,
  returnAfdDate,
  returnObjCorrectType,
  isDeviceOnline,
  writeAfdTxt,
  makeChunk,
  dataHoraAtual,
  formatDate
} = require('./utils');

let logger = getLogger('LOG');
let cron = require('node-cron');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let dataHorAtual = dataHoraAtual();

console.log(`Envio automático de batidas H-1 iniciado em ${dataHorAtual}`);

const startApplication = async () => {
  try {
    let round = 0;
    let total = 0;
    let processPid = process.pid;

    await configureLogService();

    logger.info(`[STARTING] Iniciando JOB pid: ${processPid} em ${dataHorAtual}`);

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

        const netCheck = await isDeviceOnline(clock.ip);

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

        punches.map(async (p) => {
          const punchFormat = formatDate(p.punchUserTimestamp);
          const ln = p.punchLength;
          const id = p.punchId;
          const cardId = new String(p.cardId);

          const cod = !cardId ? await ConsincoService.getCodPessoa(id, ln) : cardId;

          const obj = { codpessoa: parseInt(cod), punch: punchFormat };

          await ConsincoService.insertAfd(obj);
        });

        const punchesFormated = punches.map((punch) => {
          const punchFormat = formatDate(punch.punchUserTimestamp);
          const ln = punch.punchLength;
          const id = punch.punchId;
          const cardId = new String(punch.cardId);

          const cod = !cardId ? ConsincoService.getCodPessoa(id, ln) : cardId;

          return {
            punch: {
              cardId: new String(cod),
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
          logger.info(`[SENDING] Round ${round} - punches sent: ${total}`);
        }
      })
    );
  } catch (error) {
    logger.error('Error on startApplication', error);
  }
};

const start = async () => {
  await startApplication();
  //exitProcess(processPid);
};

//

//start();

cron.schedule('0 * * * *', async () => {
  start();
});
