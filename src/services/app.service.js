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

class AppService {
  static async gettingAfd(enableLog, dirLog) {
    const log = parseInt(enableLog);
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
            let token = await StationService.getToken(1, clock.ip, clock.user, clock.pass);

            if (!token) {
              logger.error(
                `[${SERVICE_NAME}][gettingAfd][token] - Not Connected on Station IP: ${clock.ip} - getting no token`
              );
            } else {
              try {
                let afd = await StationService.getAfd(clock.ip, token, clock.portaria, afdDate);
                await writeAfdTxt(clock.empresaDir, clock.item, clock.ipFinal, afd);
                await StationService.logoutStation(1, clock.ip, token);
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
    const log = parseInt(enableLog);
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
            let token = await StationService.getToken(1, clock.ip, clock.user, clock.pass);

            if (!token) {
              logger.error(
                `[${SERVICE_NAME}][gettingAfdDate][token][${date}]  - not connected on station ip ${clock.ip} - getting no token`
              );
            } else {
              try {
                const afdDate = await returnAfdDate(date);
                const afd = await StationService.getAfd(clock.ip, token, clock.portaria, afdDate);
                await writeAfdTxt(clock.empresaDir, clock.item, clock.ipFinal, afd);
                await StationService.logoutStation(clock.ip, token);
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
    const log = parseInt(enableLog);
    await configureDirLog(`${dirLog}`);
    try {
      clearScreen();

      log === 1
        ? logger.info(
            `[${SERVICE_NAME}][importEachAfdLine][insert] - Inserção em Tabela Oracle iniciada em ${dataHoraAtual()}`
          )
        : null;

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

      await ConsincoService.insertMany(1, obj);
      log === 1 ? await logger.info(`[${SERVICE_NAME}][importEachAfdLine][total] - ${obj.count}`) : null;
    } catch (error) {
      logger.error(`[${SERVICE_NAME}][importEachAfdLine][error]\n`, error);
    }
  }

  static async importEachAfdLine(enableLog, dirLog) {
    const log = parseInt(enableLog);
    await configureDirLog(`${dirLog}`);
    try {
      clearScreen();

      log === 1
        ? logger.info(
            `[${SERVICE_NAME}][importEachAfdLine][insert] - Inserção em Tabela Oracle iniciada em ${dataHoraAtual()}`
          )
        : null;

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

      await ConsincoService.insertMany(1, obj);
      log === 1 ? await logger.info(`[${SERVICE_NAME}][importEachAfdLine][total] - ${obj.count}`) : null;
    } catch (error) {
      logger.error(`[${SERVICE_NAME}][importEachAfdLine][error]\n`, error);
    }
  }

  static async sendingWfmApi(enableLog, dirLog) {
    const log = parseInt(enableLog);
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

        const punches = await ConsincoService.getPunchesByHour(1);

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
              ? logger.info(`[${SERVICE_NAME}][sendingWfmApi][sending] - Round ${index + 1} - punches sent: ${total}`)
              : null;
          })
        );
      }
    } catch (error) {
      logger.error(`[${SERVICE_NAME}][sendingWfmApi][error]\n`, error);
    }
  }

  static async sendingWfmApiDate(enableLog, dirLog, date) {
    const log = parseInt(enableLog);

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

        const punches = await ConsincoService.getPunchesByDate(log, date);

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

        const chunks = makeChunk(punchesFormatted, 100);

        await Promise.all(
          chunks.map(async (chunk, index) => {
            await TlanticService.postPunch(token, chunk);
            total += chunk.length;
            log === 1
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
    const log = parseInt(enableLog);
    try {
      await configureDirLog('application');
      log === 1
        ? logger.info(
            `[${SERVICE_NAME}][startApplication][starting] starting integration on JOB pid: ${
              process.pid
            } em ${dataHoraAtual()}`
          )
        : null;
      await this.gettingAfd(log, 'application');
      await this.importEachAfdLine(log, 'database');
      await ConsincoService.deleteDuplicates(1);

      setTimeout(async () => {
        await this.sendingWfmApi(log, 'tlantic');
      }, 180000);
    } catch (error) {
      logger.error(`[${SERVICE_NAME}][startApplication][error]\n`, error);
    }
  }
}

exports.AppService = AppService;
