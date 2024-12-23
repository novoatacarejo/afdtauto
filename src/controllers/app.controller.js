require('dotenv').config('../../.env');
const { StationService, TlanticService, ConsincoService } = require('../services/index.service.js');
const Logger = require('../middleware/Logger.middleware.js');
const {
  returnAfdDay,
  returnObjCorrectType,
  writeAfdTxt,
  listTxtFiles,
  makeChunk,
  readEachLine,
  currentDate,
  subtractHours,
  dataHoraAtual,
  formatDate,
  formatHour,
  clearScreen,
  readJsonClocks,
  getLogValue
} = require('../utils/Utils.js');

const SERVICE_NAME = 'AppController';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('application');

const { AFD_DIR } = process.env;

class App {
  static async gettingAfd(enableLog) {
    const name = this.gettingAfd.name;
    const log = getLogValue(enableLog);

    try {
      clearScreen();
      log === 1 ? logger.info(name, `coleta de arquivos AFD iniciada em ${dataHoraAtual()}`) : null;

      const stations = await readJsonClocks('success');
      const afdDate = await returnAfdDay(0);

      if (stations.length === 0) {
        logger.error(name, `no stations finded. please, check the database connection`);
        return;
      }

      await Promise.all(
        stations.map(async (station) => {
          const clock = returnObjCorrectType(station);

          try {
            let token = await StationService.getToken(log, clock.ip, clock.user, clock.pass);

            if (!token) {
              logger.error(name, `not connected on station ip: ${clock.ip} - getting no token`);
            } else {
              try {
                let afd = await StationService.getAfd(clock.ip, token, clock.portaria, afdDate);
                await writeAfdTxt(clock.empresaDir, clock.item, clock.ipFinal, afd);
                await StationService.logoutStation(log, clock.ip, token);
              } catch (error) {
                logger.error(name, `error on writing to file: ${error.message}`);
              }
            }
          } catch (error) {
            logger.error(name, `error processing station ip: ${clock.ip}\n${error}`);
          }
        })
      );
    } catch (error) {
      logger.error(name, error);
    }
  }

  static async importEachAfdLine(enableLog = 'n') {
    const name = this.importEachAfdLine.name;
    const log = getLogValue(enableLog);

    try {
      clearScreen();

      log === 1 ? logger.info(name, `inserção em tabela relacional oracle iniciada em ${dataHoraAtual()}`) : null;

      const files = await listTxtFiles(AFD_DIR);
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

      await ConsincoService.insertMany(log, obj);
      log === 1 ? await logger.info(name, `[total]-${obj.length}`) : null;
    } catch (error) {
      logger.error(name, error);
    }
  }

  static async sendingWfmApi(enableLog = 'n') {
    const name = this.sendingWfmApi.name;
    const log = getLogValue(enableLog);

    try {
      clearScreen();
      let total = 0;

      const token = await TlanticService.getToken();

      if (log === 1) {
        logger.info(name, `getting token from api tlantic`);
        logger.info(name, `[token]: ${token}`);
      }

      if (!token) {
        logger.error(name, `error when trying to fetch the token from api`);
        return;
      } else {
        log === 1
          ? logger.info(name, `envio automático de batidas H-1 para api tlantic iniciado em ${dataHoraAtual()}`)
          : null;

        const punches = await ConsincoService.getPunchesByHour(log);

        if (punches.length === 0) {
          logger.error(name, `no punches to send`);
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

        const totalChunks = punches.length;

        await Promise.all(
          chunks.map(async (chunk, index) => {
            await TlanticService.postPunch(token, chunk);
            total += chunk.length;
            const percentage = ((total / totalChunks) * 100).toFixed(2).replace('.', ',');
            log === 1
              ? logger.info(name, `[round] ${index + 1} | punches sent: ${total} | ${percentage}% | ${dataHoraAtual()}`)
              : null;
          })
        );
      }
    } catch (error) {
      logger.error(name, error);
    }
  }

  static async startapp(enableLog = 'n') {
    const name = this.startapp.name;
    const log = await getLogValue(enableLog);

    console.log(name, log);

    try {
      log === 1 ? logger.info(name, `starting integration on JOB pid: ${process.pid} em ${dataHoraAtual()}`) : null;
      await this.gettingAfd(log);
      await this.importEachAfdLine(log);
      await ConsincoService.deleteDuplicates(log);

      setTimeout(async () => {
        await this.sendingWfmApi(log);
      }, 180000);
    } catch (error) {
      logger.error(name, error);
    }
  }
}

module.exports = { App };
