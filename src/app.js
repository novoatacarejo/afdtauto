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
  formatHour,
  clearScreen
} = require('./utils');

let logger = getLogger('LOG');
let cron = require('node-cron');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

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

        if (netCheck === false) {
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

    const dirPath = 'C:/node/afdtauto/afd';

    const files = await listTxtFiles(dirPath);

    const obj = [];

    files.map(async (file) => {
      const punches = await readEachLine(file);

      await punches.map(async (p) => {
        if (
          (new String(p.id) !== '0' || p.id !== null || p.id !== undefined) &&
          (p.lnLength === 50 || p.lnLength === 38)
        ) {
          const hour = await formatHour(p.hour);
          const date = p.date;
          const punch = await formatDate(p.punchUserTimestamp);
          let today = await currentDate();
          let previousHour = await subtractHours(new Date(), 1);

          if (hour > previousHour === true && (date == today) === true) {
            obj.push({
              idNumber: p.id,
              idLength: p.lnLength,
              punch
            });
          }
        }
      });
    });

    await ConsincoService.insertMany(obj);
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

    console.log(`Envio automático de batidas H-1 para API Tlantic iniciado em ${dataHorAtual}`);

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
  await ConsincoService.deleteDuplicates();

  setTimeout(async () => {
    await sendingWfmApi();
  }, 180000);
};

const app = async () => {
  await startApplication();
};

//

app();

cron.schedule('0 * * * *', async () => {
  app();
});
