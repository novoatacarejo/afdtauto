require('dotenv').config('../../.env');
const { StationService, TlanticService, ConsincoService } = require('../services/index.service.js');
const Logger = require('../middleware/Logger.middleware.js');
const {
  //configureDirLog,
  returnAfdDay,
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
  readJsonClocks
} = require('../utils/Utils.js');

const SERVICE_NAME = 'AppByDay';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('app-by-day');

const { AFDDAY_DIR } = process.env;

class AppByDay {
  static async gettingAfdDay(enableLog = 'n', date) {
    const name = this.gettingAfdDay.name;

    const log = enableLog.toLocaleLowerCase === 's' ? 1 : enableLog.toLocaleLowerCase === 'n' ? 0 : null;

    if (log === null) {
      logger.error(name, `invalid value for enableLog. use 's' or 'n' (case-insensitive).`);
    }

    //await configureDirLog(`${dirLog}`);
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
            let token = await StationService.getToken(enableLog, clock.ip, clock.user, clock.pass);

            if (!token) {
              logger.error(name, `[${date}] - not connected on station ip ${clock.ip} - getting no token`);
            } else {
              try {
                const afdDate = await returnAfdDate(date);
                const afd = await StationService.getAfd(clock.ip, token, clock.portaria, afdDate);
                await writeAfdTxtDay(clock.empresaDir, clock.item, clock.ipFinal, afd);
                await StationService.logoutStation(enableLog, clock.ip, token);
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

    const log =
      enableLog === 's' || enableLog === 'S' || enableLog === 'y' || enableLog === 'Y'
        ? 1
        : enableLog === 'n' || enableLog === 'N'
        ? 0
        : null;

    if (log === null) {
      logger.error(name, `invalid value for enableLog. use 's' or 'n' (case-insensitive).`);
    }
    //await configureDirLog(`${dirLog}`);
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
      await ConsincoService.insertMany(enableLog, obj);
      log === 1 ? await logger.info(name, `[total] - ${obj.length}`) : null;
    } catch (error) {
      logger.error(name, error);
    }
  }

  static async sendingWfmApiDate(enableLog = 'n', date, ckLen) {
    const name = this.sendingWfmApiDate.name;

    const log =
      enableLog === 's' || enableLog === 'S' || enableLog === 'y' || enableLog === 'Y'
        ? 1
        : enableLog === 'n' || enableLog === 'N'
        ? 0
        : null;

    if (log === null) {
      logger.error(name, `invalid value for enableLog. use 's' or 'n' (case-insensitive).`);
    }

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

        const punches = await ConsincoService.getPunchesByDate(enableLog, date);

        if (punches.length === 0) {
          logger.error(name, `[${date}] - no punches to send`);
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
            log == 1 ? logger.info(name, `[${date}] round ${index + 1} - punches sent: ${total}`) : null;
          })
        );
      }
    } catch (error) {
      logger.error(name, `[${date}]\n${error}`);
    }
  }

  static async startappDate(enableLog = 'n') {
    const name = this.startappDate.name;
    const log =
      enableLog === 's' || enableLog === 'S' || enableLog === 'y' || enableLog === 'Y'
        ? 1
        : enableLog === 'n' || enableLog === 'N'
        ? 0
        : null;

    if (log === null) {
      logger.error(name, `invalid value for enableLog. use 's' or 'n' (case-insensitive).`);
    }

    try {
      //await configureDirLog('app');
      log === 1 ? logger.info(name, `starting integration on JOB pid: ${process.pid} em ${dataHoraAtual()}`) : null;
      await this.gettingAfdDay(enableLog);
      await this.importEachAfdLineDay(enableLog);
      await ConsincoService.deleteDuplicates(enableLog);

      setTimeout(async () => {
        await this.sendingWfmApiDate(enableLog);
      }, 180000);
    } catch (error) {
      logger.error(name, error);
    }
  }
}

exports.AppByDay = AppByDay;
