require('dotenv').config('../../.env');
const { StationService } = require('./station.service');
const { TlanticService } = require('./tlantic.service');
const { ConsincoService } = require('./consinco.service');
const { getLogger } = require('log4js');
const {
  configureDirLog,
  returnAfdDay,
  returnAfdDate,
  returnObjCorrectType,
  writeAfdTxt,
  writeAfdTxtDay,
  listTxtFiles,
  makeChunk,
  readEachLine,
  currentDate,
  subtractHours,
  dataHoraAtual,
  formatDate,
  formatHour,
  clearScreen,
  readJsonClocks
} = require('../utils');

let logger = getLogger('LOG');

const SERVICE_NAME = 'AppService';

const { CLOCKS_FILE, LOG_DIR, AFD_DIR, AFDDAY_DIR, BOT_TOKEN, CHAT_ID } = process.env;
class AppService {
  static async gettingAfd(enableLog, dirLog) {
    const log =
      enableLog === 's' || enableLog === 'S' || enableLog === 'y' || enableLog === 'Y'
        ? 1
        : enableLog === 'n' || enableLog === 'N'
        ? 0
        : null;

    if (log === null) {
      logger.error(
        `[${SERVICE_NAME}][gettingAfd][error] - invalid value for enableLog. Use 's' or 'n' (case-insensitive).`
      );
    }

    await configureDirLog(`${dirLog}`);
    try {
      clearScreen();
      log === 1
        ? logger.info(`[${SERVICE_NAME}][gettingAfd][afd] - Coleta de arquivos AFD iniciada em ${dataHoraAtual()}`)
        : null;

      const stations = await readJsonClocks('success');
      const afdDate = await returnAfdDay(0);

      if (stations.length === 0) {
        logger.error(
          SERVICE_NAME,
          `[${SERVICE_NAME}][gettingAfd][afd] - No stations finded. Please, check the database connection`
        );
        return;
      }

      await Promise.all(
        stations.map(async (station) => {
          const clock = returnObjCorrectType(station);

          try {
            let token = await StationService.getToken(enableLog, clock.ip, clock.user, clock.pass);

            if (!token) {
              logger.error(
                `[${SERVICE_NAME}][gettingAfd][token] - Not Connected on Station IP: ${clock.ip} - getting no token`
              );
            } else {
              try {
                let afd = await StationService.getAfd(clock.ip, token, clock.portaria, afdDate);
                await writeAfdTxt(clock.empresaDir, clock.item, clock.ipFinal, afd);
                await StationService.logoutStation(enableLog, clock.ip, token);
              } catch (error) {
                logger.error(`[AppService][gettingAfd][error] - Error writing to file: ${error.message}`);
              }
            }
          } catch (error) {
            logger.error(`[${SERVICE_NAME}][gettingAfd][error] error processing station ip: ${clock.ip}\n`, error);
          }
        })
      );
    } catch (error) {
      logger.error(`[${SERVICE_NAME}][gettingAfd][error]\n`, error);
    }
  }

  static async gettingAfdDate(enableLog, dirLog, date) {
    const log = enableLog === 's' || enableLog === 'S' ? 1 : enableLog === 'n' || enableLog === 'N' ? 0 : null;

    if (log === null) {
      logger.error(
        `[${SERVICE_NAME}][gettingAfdDate][error] - invalid value for enableLog. Use 's' or 'n' (case-insensitive).`
      );
    }

    await configureDirLog(`${dirLog}`);
    try {
      clearScreen();
      log === 1
        ? logger.info(
            `[${SERVICE_NAME}][gettingAfdDate][afd][${date}] - Coleta de arquivos AFD iniciada em ${dataHoraAtual()}`
          )
        : null;

      const stations = await readJsonClocks('success');

      if (stations.length === 0) {
        logger.error(
          SERVICE_NAME,
          `[${SERVICE_NAME}][gettingAfdDate][afd][${date}]  - No stations finded. Please, check the database connection`
        );
        return;
      }

      await Promise.all(
        stations.map(async (station) => {
          const clock = returnObjCorrectType(station);

          try {
            let token = await StationService.getToken(enableLog, clock.ip, clock.user, clock.pass);

            if (!token) {
              logger.error(
                `[${SERVICE_NAME}][gettingAfdDate][token][${date}]  - not connected on station ip ${clock.ip} - getting no token`
              );
            } else {
              try {
                const afdDate = await returnAfdDate(date);
                const afd = await StationService.getAfd(clock.ip, token, clock.portaria, afdDate);
                await writeAfdTxtDay(clock.empresaDir, clock.item, clock.ipFinal, afd);
                await StationService.logoutStation(enableLog, clock.ip, token);
              } catch (error) {
                logger.error(`[AppService][gettingAfdDate][error][${date}]  - error writing to file: ${error.message}`);
              }
            }
          } catch (error) {
            logger.error(`[${SERVICE_NAME}][gettingAfd][error] error processing station ip: ${clock.ip}\n`, error);
          }
        })
      );
    } catch (error) {
      logger.error(`[${SERVICE_NAME}][gettingAfdDate][error]\n`, error);
    }
  }

  static async importEachAfdLine(enableLog, dirLog) {
    const log = enableLog === 's' || enableLog === 'S' ? 1 : enableLog === 'n' || enableLog === 'N' ? 0 : null;

    if (log === null) {
      logger.error(
        `[${SERVICE_NAME}][importEachAfdLine][error] - invalid value for enableLog. Use 's' or 'n' (case-insensitive).`
      );
    }
    await configureDirLog(`${dirLog}`);
    try {
      clearScreen();

      log === 1
        ? logger.info(
            `[${SERVICE_NAME}][importEachAfdLine][insert] - Inserção em Tabela Oracle iniciada em ${dataHoraAtual()}`
          )
        : null;

      //const dirPath = AFD_DIR;
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

      await ConsincoService.insertMany(enableLog, obj);
      log === 1 ? await logger.info(`[${SERVICE_NAME}][importEachAfdLine][total] - ${obj.count}`) : null;
    } catch (error) {
      logger.error(`[${SERVICE_NAME}][importEachAfdLine][error]\n`, error);
    }
  }

  static async importEachAfdLineDay(enableLog, dirLog) {
    const log =
      enableLog === 's' || enableLog === 'S' || enableLog === 'y' || enableLog === 'Y'
        ? 1
        : enableLog === 'n' || enableLog === 'N'
        ? 0
        : null;

    if (log === null) {
      logger.error(
        `[${SERVICE_NAME}][importEachAfdLineDay][error] - invalid value for enableLog. Use 's' or 'n' (case-insensitive).`
      );
    }
    await configureDirLog(`${dirLog}`);
    try {
      clearScreen();

      log === 1
        ? logger.info(
            `[${SERVICE_NAME}][importEachAfdLineDay][insert] - Inserção em Tabela Oracle iniciada em ${dataHoraAtual()}`
          )
        : null;

      c; //onst dirPath = 'C:/node/afdtauto/afdDay';
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
      log === 1 ? await logger.info(`[${SERVICE_NAME}][importEachAfdLineDay][total] - ${obj.count}`) : null;
    } catch (error) {
      logger.error(`[${SERVICE_NAME}][importEachAfdLineDay][error]\n`, error);
    }
  }

  static async sendingWfmApi(enableLog, dirLog) {
    const log =
      enableLog === 's' || enableLog === 'S' || enableLog === 'y' || enableLog === 'Y'
        ? 1
        : enableLog === 'n' || enableLog === 'N'
        ? 0
        : null;

    if (log === null) {
      logger.error(
        `[${SERVICE_NAME}][sendingWfmApi][error] - invalid value for enableLog. Use 's' or 'n' (case-insensitive).`
      );
    }
    await configureDirLog(`${dirLog}`);
    try {
      clearScreen();
      let total = 0;

      const token = await TlanticService.getToken();

      if (log === 1) {
        logger.info(`[${SERVICE_NAME}][sendingWfmApi][getting] - getting token from api tlantic`);
        logger.info(`[${SERVICE_NAME}][sendingWfmApi][token]: ${token}`);
      }

      if (!token) {
        throw new Error(`[${SERVICE_NAME}][sendingWfmApi][error] - error when trying to fetch the token from api`);
        return;
      } else {
        log === 1
          ? logger.info(
              `[${SERVICE_NAME}][sendingWfmApi][send] - Envio automático de batidas H-1 para API Tlantic iniciado em ${dataHoraAtual()}`
            )
          : null;

        const punches = await ConsincoService.getPunchesByHour(enableLog);

        if (punches.length === 0) {
          logger.error(`[${SERVICE_NAME}][sendingWfmApi][no data] - No punches to send`);
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
            log === 1
              ? logger.info(
                  `[${SERVICE_NAME}][sendingWfmApi][sending] - Round ${
                    index + 1
                  } - punches sent: ${total} - ${currentDate()}`
                )
              : null;
          })
        );
      }
    } catch (error) {
      logger.error(`[${SERVICE_NAME}][sendingWfmApi][error]\n`, error);
    }
  }

  static async sendingWfmApiDate(enableLog, dirLog, date, ckLen) {
    const log =
      enableLog === 's' || enableLog === 'S' || enableLog === 'y' || enableLog === 'Y'
        ? 1
        : enableLog === 'n' || enableLog === 'N'
        ? 0
        : null;

    if (log === null) {
      logger.error(
        `[${SERVICE_NAME}][sendingWfmApi][error] - invalid value for enableLog. Use 's' or 'n' (case-insensitive).`
      );
    }

    await configureDirLog(`${dirLog}`);
    try {
      clearScreen();
      let total = 0;

      const token = await TlanticService.getToken();

      if (log === 1) {
        logger.info(`[${SERVICE_NAME}][sendingWfmApi][getting][date][${date}] - getting token from api tlantic`);
        logger.info(`[${SERVICE_NAME}][sendingWfmApi][token][date][${date}]: ${token}`);
      }

      if (!token) {
        //throw new Error(
        logger.error(
          `[${SERVICE_NAME}][sendingWfmApi][error][date][${date}] - error when trying to fetch the token from api`
        );
        return;
      } else {
        log === 1
          ? logger.info(
              `[${SERVICE_NAME}][sendingWfmApi][send][date][${date}] - Envio automático de batidas por Data para API Tlantic iniciado em ${dataHoraAtual()}`
            )
          : null;

        const punches = await ConsincoService.getPunchesByDate(enableLog, date);

        if (punches.length === 0) {
          logger.error(`[${SERVICE_NAME}][sendingWfmApi][no data][date][${date}] - no punches to send`);
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
        logger.info(`[${SERVICE_NAME}][sendingWfmApi][send][date][${date}] - Chunck length: ${chunckLength}`);
        const chunks = makeChunk(punchesFormatted, chunckLength);

        await Promise.all(
          chunks.map(async (chunk, index) => {
            await TlanticService.postPunch(token, chunk);

            /*      setInterval(async () => {
              await new Promise((resolve) => setTimeout(resolve, 5000));
              await TlanticService.postPunch(token, chunk);
            }, 5000);
 */
            total += chunk.length;
            log == 1
              ? logger.info(
                  `[${SERVICE_NAME}][sendingWfmApi][sending][date][${date}] - Round ${
                    index + 1
                  } - punches sent: ${total}`
                )
              : null;
          })
        );
      }
    } catch (error) {
      logger.error(`[${SERVICE_NAME}][sendingWfmApi][error][date][${date}]\n`, error);
    }
  }

  static async startApplication(enableLog) {
    const log =
      enableLog === 's' || enableLog === 'S' || enableLog === 'y' || enableLog === 'Y'
        ? 1
        : enableLog === 'n' || enableLog === 'N'
        ? 0
        : null;

    if (log === null) {
      logger.error(
        `[${SERVICE_NAME}][startApplication][error] - invalid value for enableLog. Use 's' or 'n' (case-insensitive).`
      );
    }

    try {
      await configureDirLog('application');
      log === 1
        ? logger.info(
            `[${SERVICE_NAME}][startApplication][starting] starting integration on JOB pid: ${
              process.pid
            } em ${dataHoraAtual()}`
          )
        : null;
      await this.gettingAfd(enableLog, 'application');
      await this.importEachAfdLine(enableLog, 'database');
      await ConsincoService.deleteDuplicates(enableLog);

      setTimeout(async () => {
        await this.sendingWfmApi(enableLog, 'tlantic');
      }, 180000);
    } catch (error) {
      logger.error(`[${SERVICE_NAME}][startApplication][error]\n`, error);
    }
  }
}

exports.AppService = AppService;
