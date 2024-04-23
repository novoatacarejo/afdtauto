require('dotenv').config('../.env');
const { StationService } = require('./services/station.service');
const { TlanticService } = require('./services/tlantic.service');
const { ConsincoService } = require('./services/consinco.service');
const { getLogger } = require('log4js');
const {
  configureLogService,
  returnAfdDate,
  returnObjCorrectType,
  isDeviceOnline,
  writeAfdTxt,
  listTxtFiles,
  makeChunk,
  readEachLine,
  currentDate,
  subtractHours,
  dataHoraAtual,
  formatDate,
  clearScreen
} = require('./utils');

let logger = getLogger('LOG');
let cron = require('node-cron');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const dirPath = 'C:/node/afdtauto/afd';

const gettingAfd = async () => {
  try {
    clearScreen();
    let dataHorAtual = dataHoraAtual();

    let processPid = process.pid;

    logger.info(`[STARTING] Iniciando JOB pid: ${processPid} em ${dataHorAtual}`);

    const stations = await StationService.getStationsInfo();
    const afdDate = returnAfdDate(0);

    if (stations.length === 0) {
      logger.info('No Stations finded. Please, check the database connection');
      return;
    }

    await Promise.all(
      stations.map(async (station) => {
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
      })
    );
  } catch (error) {
    logger.error('Error on startApplication', 'gettingAfdFiles', error);
  }
};

const importEachAfdLine = async () => {
  try {
    let round = 0;
    clearScreen();
    dataHorAtual = dataHoraAtual();

    console.log(`Inserção em Tabela Oracle iniciada em ${dataHorAtual}`);

    const files = await listTxtFiles(dirPath);

    files.map(async (file) => {
      const punches = await readEachLine(file);

      await punches.map(async (p) => {
        const h = p.hour;
        const d = p.date;
        const punch = formatDate(p.punchUserTimestamp);
        const date = p.date;

        if (new String(p.id) !== '0' && (p.lnLength === 50 || p.lnLength === 38)) {
          let today = currentDate();
          let previousHour = subtractHours(new Date(), 1);

          const testHour = h > previousHour ? true : false;
          const testDate = d == today ? true : false;

          if (testHour === true && testDate === true) {
            round++;
            const obj = {
              idNumber: p.id,
              idLength: p.lnLength,
              punch
            };

            logger.info(`[IMPORTING] Attempt ${round} --> Id: ${p.id}, punch: ${punch} `);
            await ConsincoService.insertwfmDevAfd(obj);
          }
        }
      });
    });
  } catch (error) {
    logger.error('Error on startApplication', error);
  }
};

const sendingWfmApi = async () => {
  try {
    let round = 0;
    let total = 0;
    clearScreen();
    dataHorAtual = dataHoraAtual();

    console.log(`Envio automático de batidas H-1 iniciado em ${dataHorAtual}`);

    const punches = await ConsincoService.getPunchesByHour();

    if (punches.length === 0) {
      logger.info('sendingWfmApi', 'No punches to send');
      return;
    }

    const punchesFormated = punches.map((p) => {
      const cardId = new String(p.codPessoa);
      const punchFormat = formatDate(p.punchTime);
      const punchType = new String(1);

      return {
        punch: {
          cardId,
          punchSystemTimestamp: punchFormat,
          punchUserTimestamp: punchFormat,
          punchType
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
  } catch (error) {
    logger.error('Error on startApplication', error);
  }
};

const startApplication = async () => {
  await configureLogService();

  await gettingAfd();

  await importEachAfdLine();

  setTimeout(async () => {
    await sendingWfmApi();
  }, 360000);
};

const app = async () => {
  await startApplication();
};

//

app();

cron.schedule('0 * * * *', async () => {
  app();
});
