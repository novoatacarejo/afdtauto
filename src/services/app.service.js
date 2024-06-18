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
  static async gettingAfd() {
    try {
      clearScreen();
      logger.info(`[${SERVICE_NAME}][gettingAfd][afd] - Coleta de arquivos AFD iniciada em ${dataHoraAtual()}`);

      const stations = await StationService.getStationsInfo();
      const afdDate = returnAfdDate(0);

      if (stations.length === 0) {
        logger.info(
          SERVICE_NAME,
          `[${SERVICE_NAME}][gettingAfd][afd] - No Stations finded. Please, check the database connection`
        );
        return;
      }

      await Promise.all(
        stations.map(async (station) => {
          const clock = returnObjCorrectType(station);
          const netCheck = await isDeviceOnline(clock.ip);

          if (!netCheck) {
            logger.error(`[${SERVICE_NAME}][gettingAfd][netCheck] - Station ip: ${clock.ip} not respond`);
            return;
          } else {
            try {
              let token = await StationService.getToken(clock.ip, clock.user, clock.pass);
              let afd = await StationService.getAfd(clock.ip, token, clock.portaria, afdDate);
              await writeAfdTxt(clock.empresaDir, clock.item, clock.ipFInal, afd);
              await StationService.logoutStation(clock.ip, token);
            } catch (error) {
              logger.error(`[${SERVICE_NAME}][gettingAfd][error] - error processing station ip: ${clock.ip}`, error);
            }
          }
        })
      );
    } catch (error) {
      logger.error(`[${SERVICE_NAME}][gettingAfd][error]\n`, error);
    }
  }

  static async importEachAfdLine() {
    try {
      clearScreen();
      logger.info(
        `[${SERVICE_NAME}][importEachAfdLine][insert] - Inserção em Tabela Oracle iniciada em ${dataHoraAtual()}`
      );

      const dirPath = 'C:/node/afdtauto/afd';
      const files = await listTxtFiles(dirPath);
      const obj = [];

      await Promise.all(
        files.map(async (file) => {
          const punches = await readEachLine(file);
          punches.forEach(async (p) => {
            if (String(p.id) !== '0' && p.id !== null && p.id !== undefined && [50, 38].includes(p.lnLength)) {
              const hour = await formatHour(p.hour);
              const date = p.date;
              const punch = await formatDate(p.punchUserTimestamp);
              const today = await currentDate();
              const previousHour = await subtractHours(new Date(), 1);

              if (hour > previousHour && date === today) {
                obj.push({
                  idNumber: p.id,
                  idLength: p.lnLength,
                  punch
                });
              }
            }
          });
        })
      );

      await ConsincoService.insertMany(obj);
    } catch (error) {
      logger.error(`[${SERVICE_NAME}][importEachAfdLine][error]\n`, error);
    }
  }

  static async sendingWfmApi() {
    try {
      clearScreen();
      let total = 0;

      const token = await TlanticService.getToken();
      logger.info(`[${SERVICE_NAME}][sendingWfmApi][getting] - getting token from api tlantic`);
      logger.info(`[${SERVICE_NAME}][sendingWfmApi][token]: ${token}`);

      if (!token) {
        throw new Error(`[${SERVICE_NAME}][sendingWfmApi][error] - error when trying to fetch the token from api`);
      }

      logger.info(
        `[${SERVICE_NAME}][sendingWfmApi][send] - Envio automático de batidas H-1 para API Tlantic iniciado em ${dataHoraAtual()}`
      );

      const punches = await ConsincoService.getPunchesByHour();

      if (punches.length === 0) {
        logger.info(`[${SERVICE_NAME}][sendingWfmApi][no data] - No punches to send`);
        return;
      }

      const punchesFormatted = punches.map((p) => ({
        punch: {
          cardId: String(p.codPessoa),
          punchSystemTimestamp: formatDate(p.punchTime),
          punchUserTimestamp: formatDate(p.punchTime),
          punchType: '1'
        }
      }));

      const chunks = makeChunk(punchesFormatted, 100);

      await Promise.all(
        chunks.map(async (chunk, index) => {
          await TlanticService.postPunch(token, chunk);
          total += chunk.length;
          logger.info(`[${SERVICE_NAME}][sendingWfmApi][sending] - Round ${index + 1} - punches sent: ${total}`);
        })
      );
    } catch (error) {
      logger.error(`[${SERVICE_NAME}][sendingWfmApi][error]\n`, error);
    }
  }

  static async startApplication() {
    try {
      logger.info(
        `[${SERVICE_NAME}][startApplication][starting] starting integration on JOB pid: ${
          process.pid
        } em ${dataHoraAtual()}`
      );

      await configureLogService();
      await this.gettingAfd();
      await this.importEachAfdLine();
      await ConsincoService.deleteDuplicates();

      setTimeout(async () => {
        await this.sendingWfmApi();
      }, 180000);
    } catch (error) {
      logger.error(`[${SERVICE_NAME}][startApplication][error]\n`, error);
    }
  }
}

exports.AppService = AppService;
