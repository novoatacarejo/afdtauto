require('dotenv').config('../../.env');
const { StationService, TlanticService, ConsincoService } = require('../services/index.service.js');
const Logger = require('../middleware/Logger.middleware.js');
const {
  returnAfdDate,
  returnObjCorrectType,
  writeAfdTxtDay,
  listTxtFiles,
  makeChunk,
  readEachLine,
  dataHoraAtual,
  formatDate,
  formatHour,
  clearScreen,
  readJsonClocks,
  getLogValue
} = require('../utils/Utils.js');

const SERVICE_NAME = 'AppDay';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('applicationDay');

const { AFDDAY_DIR } = process.env;

class AppDay {
  static async gettingAfdDay(date, enableLog = 'n') {
    const name = this.gettingAfdDay.name;
    const log = getLogValue(enableLog);

    try {
      clearScreen();
      log === 1 ? logger.info(name, `[${date}] - coleta de arquivos AFD iniciada em ${dataHoraAtual()}`) : null;

      const stations = await readJsonClocks('success');

      if (stations.length === 0) {
        logger.error(name, `[${date}] - no stations finded. please, check the database connection`);
        return;
      }

      await Promise.all(
        stations.map(async (station) => {
          const clock = returnObjCorrectType(station);

          try {
            let token = await StationService.getToken(clock.ip, clock.user, clock.pass, log);

            if (!token) {
              logger.error(name, `[${date}] - not connected on station ip ${clock.ip} - getting no token`);
            } else {
              try {
                const afdDate = await returnAfdDate(date);
                const afd = await StationService.getAfd(clock.ip, token, clock.portaria, afdDate);
                await writeAfdTxtDay(clock.empresaDir, clock.item, clock.ipFinal, afd);
                await StationService.logoutStation(clock.ip, token, log);
              } catch (error) {
                logger.error(name, `[${date}] - error writing to file: ${error.message}`);
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

  static async importEachAfdLineDay(enableLog = 'n') {
    const name = this.importEachAfdLineDay.name;
    const log = getLogValue(enableLog);

    try {
      clearScreen();

      log === 1 ? logger.info(name, `inserção em tabela oracle iniciada em ${dataHoraAtual()}`) : null;

      const files = await listTxtFiles(AFDDAY_DIR);
      const obj = [];

      await Promise.all(
        files.map(async (file) => {
          const punches = await readEachLine(file);
          punches.forEach(async (p) => {
            if (String(p.id) !== '0' && p.id !== null && p.id !== undefined && [50, 38].includes(p.lnLength)) {
              const hour = await formatHour(p.hour);
              const date = p.date;
              const punch = await formatDate(p.punchUserTimestamp);
              //const today = await currentDate();
              //const previousHour = await subtractHours(new Date(), 1);

              //
              //if (hour > previousHour && date === today) {

              obj.push({
                idNumber: p.id,
                idLength: p.lnLength,
                punch
              });

              //}
            }
          });
        })
      );

      //console.log(obj);
      await ConsincoService.insertMany(obj, log);
      log === 1 ? await logger.info(name, `[total] - ${obj.length}`) : null;
    } catch (error) {
      logger.error(name, error);
    }
  }

  static async sendingWfmApiDay(date, ckLen, enableLog = 'n') {
    const name = this.sendingWfmApiDay.name;
    const log = getLogValue(enableLog);

    try {
      clearScreen();
      let total = 0;

      const token = await TlanticService.getToken();

      if (log === 1) {
        logger.info(name, `[${date}] - getting token from api tlantic`);
        logger.info(name, `[${date}]: token ${token}`);
      }

      if (!token) {
        //throw new Error(
        logger.error(name, `[${date}] - error when trying to fetch the token from api`);
        return;
      } else {
        log === 1
          ? logger.info(
              name,
              `[${date}] - envio automático de batidas por data para api tlantic iniciado em ${dataHoraAtual()}`
            )
          : null;

        const punches = await ConsincoService.getPunchesByDate(date, log);

        const totalChunks = punches.length;

        if (punches.length === 0) {
          logger.error(name, `[${date}] - no punches to send to the api from date ${dataHoraAtual()}`);
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

        const chunckLength = ckLen || 100;
        logger.info(name, `[${date}] - chunck length: ${chunckLength}`);
        const chunks = makeChunk(punchesFormatted, chunckLength);

        await Promise.all(
          chunks.map(async (chunk, index) => {
            await TlanticService.postPunch(token, chunk);
            total += chunk.length;
            const percentage = ((total / totalChunks) * 100).toFixed(2).replace('.', ',');
            log === 1
              ? logger.info(
                  name,
                  `[${date}][round] ${index + 1} | punches sent: ${total} | ${percentage}% | ${dataHoraAtual()}`
                )
              : null;
          })
        );
      }
    } catch (error) {
      logger.error(name, `[${date}]\n${error}`);
    }
  }

  static async startappDay(date, ckLen, enableLog = 'n') {
    const name = this.startappDay.name;
    const log = getLogValue(enableLog);

    try {
      log === 1 ? logger.info(name, `starting integration on JOB pid: ${process.pid} em ${dataHoraAtual()}`) : null;
      await this.gettingAfdDay(date, log);
      await this.importEachAfdLineDay(log);
      await ConsincoService.deleteDuplicates(date, log);

      setTimeout(async () => {
        await this.sendingWfmApiDay(date, ckLen, log);
      }, 180000);
    } catch (error) {
      logger.error(name, error);
    }
  }
}

module.exports = { AppDay };
