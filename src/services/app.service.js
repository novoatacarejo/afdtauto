require('dotenv').config('../../.env');
const { StationService } = require('./station.service');
const { TlanticService } = require('./tlantic.service');
const { ConsincoService } = require('./consinco.service');
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
} = require('../utils');

let logger = getLogger('LOG');

const SERVICE_NAME = 'AppService';

class AppService {
  static gettingAfd = async () => {
    try {
      clearScreen();
      logger.info(`[gettingAfd][AFD] - Coleta de arquivos AFD iniciada em ${dataHoraAtual()}`);

      const stations = await StationService.getStationsInfo();
      const afdDate = returnAfdDate(0);

      if (stations.length === 0) {
        logger.info('[gettingAfd] - No Stations finded. Please, check the database connection');
        return;
      }

      await Promise.all(
        stations.map(async (station) => {
          const clock = returnObjCorrectType(station);
          const netCheck = await isDeviceOnline(clock.ip);

          if (!netCheck) {
            logger.error(`[gettingAfd][netCheck] - Station ip: ${clock.ip} not respond`);
            return;
          }

          try {
            let token = await StationService.getToken(clock.ip, clock.user, clock.pass);
            let afd = await StationService.getAfd(clock.ip, token, clock.portaria, afdDate);
            await writeAfdTxt(clock.empresaDir, clock.item, clock.ipFInal, afd);
            await StationService.logoutStation(clock.ip, token);
          } catch (error) {
            logger.error(SERVICE_NAME, `[gettingAfd][ERROR] - error processing station ip: ${clock.ip}`, error);
          }
        })
      );
    } catch (error) {
      logger.error(SERVICE_NAME, '[gettingAfd][ERROR] - ', error);
    }
  };

  static importEachAfdLine = async () => {
    try {
      clearScreen();
      logger.info(`[importEachAfdLine][INSERT] - Inserção em Tabela Oracle iniciada em ${dataHoraAtual()}`);

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
      logger.error(SERVICE_NAME, '[importEachAfdLine][ERROR] - ', error);
    }
  };

  static sendingWfmApi = async () => {
    try {
      clearScreen();
      let round = 0;
      let total = 0;

      console.log(
        `[${SERVICE_NAME}][sendingWfmApi][SEND] - Envio automático de batidas H-1 para API Tlantic iniciado em ${dataHoraAtual()}`
      );

      const punches = await ConsincoService.getPunchesByHour();

      if (punches.length === 0) {
        logger.info(`[${SERVICE_NAME}][sendingWfmApi][NO DATA] - No punches to send`);
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
        logger.info(`[[${SERVICE_NAME}][sendingWfmApi][SENDING] - Round ${round} - punches sent: ${total}`);
      }
    } catch (error) {
      logger.error(SERVICE_NAME, '[sendingWfmApi][ERROR] - ', error);
    }
  };

  static startApplication = async () => {
    try {
      let processPid = process.pid;
      logger.info(`[startApplication][STARTING] Iniciando JOB pid: ${processPid} em ${dataHoraAtual()}`);

      await configureLogService();
      await this.gettingAfd();
      await this.importEachAfdLine();
      await ConsincoService.deleteDuplicates();

      setTimeout(async () => {
        await this.sendingWfmApi();
      }, 180000);
    } catch (error) {
      logger.error(SERVICE_NAME, '[startApplication][ERROR] - ', error);
    }
  };
}

exports.AppService = AppService;
