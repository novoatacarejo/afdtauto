require('dotenv').config('../../.env');
const { StationService, TlanticService, ConsincoService } = require('../services/index.service.js');
const { Logger } = require('../middleware/Logger.middleware.js');
const {
  returnAfdDay,
  returnObjCorrectType,
  writeAfdTxt,
  listTxtFiles,
  makeChunk,
  readEachLine,
  currentDate,
  dataHoraAtual,
  formatDate,
  clearScreen,
  readJsonClocks,
  getLogValue
} = require('../utils/Utils.js');

const SERVICE_NAME = 'AppController';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('application');

const { AFD_DIR } = process.env;

const punchInterval = (punchDate, minutes = 0, enableLog = 'n') => {
  const name = punchInterval.name;
  const log = getLogValue(enableLog);
  const dta1 = new Date();
  const dta2 = new Date(punchDate);
  const mm = Number(minutes);

  dta1.setMinutes(dta1.getMinutes() + mm);

  if (log === 1) {
    const opcoes = {
      timeZone: 'America/Recife',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    };
    const obj1 = dta1.toLocaleString('pt-BR', opcoes);
    const obj2 = dta2.toLocaleString('pt-BR', opcoes);

    logger.info(name, `punch: ${obj2} - baseDate: ${obj1} -- ${dta2 >= dta1}`);
  }

  return dta2 >= dta1;
};

const checkoutPunch = (obj, enableLog = 'n') => {
  const name = checkoutPunch.name;
  const log = getLogValue(enableLog);
  if (String(obj.id) !== '0' && obj.id !== null && obj.id !== undefined && [50, 38].includes(obj.lnLength)) {
    log === 1 ? logger.info(name, `punch: ${obj.id} - ${obj.lnLength} - true`) : null;
    return true;
  } else {
    return false;
  }
};

class App {
  static async gettingAfd(enableLog = 'n') {
    const name = this.gettingAfd.name;
    const log = getLogValue(enableLog);

    try {
      clearScreen();
      log === 1 ? logger.info(name, `coleta de arquivos afd iniciada em ${dataHoraAtual()}`) : null;

      const stations = await readJsonClocks('success');
      const afdDate = await returnAfdDay(0);

      if (stations.length === 0) {
        logger.error(name, `nenhuma estacao encontrada no arquivo json de configuração`);
        return;
      }

      await Promise.all(
        stations.map(async (station) => {
          const clock = returnObjCorrectType(station);

          try {
            let token = await StationService.getToken(clock.ip, clock.user, clock.pass, log);

            if (!token) {
              logger.error(name, `erro ao obter token da estacao ip: ${clock.ip}`);
            } else {
              try {
                let afd = await StationService.getAfd(clock.ip, token, clock.portaria, afdDate);
                await writeAfdTxt(clock.empresaDir, clock.item, clock.ipFinal, afd);
                await StationService.logoutStation(clock.ip, token, log);
              } catch (error) {
                logger.error(name, `erro ao obter afd da estacao ip: ${clock.ip}: ${error}`);
              }
            }
          } catch (error) {
            logger.error(name, `erro na estacao ip: ${clock.ip}: ${error}`);
          }
        })
      );
    } catch (error) {
      logger.error(name, error);
    }
  }

  static async importEachAfdLine(minutes = 0, enableLog = 'n') {
    const name = this.importEachAfdLine.name;
    const log = getLogValue(enableLog);
    const mm = Number(minutes);

    try {
      clearScreen();

      log === 1
        ? logger.info(name, `coletando batidas com intervalo de ${minutes} minuto(s) em ${dataHoraAtual()}`)
        : null;

      const files = await listTxtFiles(AFD_DIR);
      const obj = [];

      await Promise.all(
        files.map(async (file) => {
          const punches = await readEachLine(file);

          punches.forEach(async (p) => {
            if (checkoutPunch(p, 'n')) {
              log === 1
                ? logger.info(
                    name,
                    `[afd ${files.indexOf(file)} : ${punches.length} linhas] | ${(
                      (punches.indexOf(p) / punches.length) *
                      100
                    ).toFixed(2)}%`
                  )
                : null;

              if (punchInterval(p.punchUserTimestamp, minutes, 'n')) {
                obj.push({
                  idNumber: p.id,
                  idLength: p.lnLength,
                  punch: await formatDate(p.punchUserTimestamp)
                });
              }
            }
          });
        })
      );

      if (obj.length === 0) {
        return false;
      } else {
        return obj;
      }
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
        logger.info(name, `obtencao de token da api tlantic em ${dataHoraAtual()}`);
        logger.info(name, `[token]: ${token}`);
      }

      if (!token) {
        logger.error(name, `erro ao obter token da api tlantic em ${dataHoraAtual()}`);
        return;
      } else {
        log === 1
          ? logger.info(name, `envio automatico de batidas para api tlantic iniciado em ${dataHoraAtual()}`)
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
            log === 1 ? logger.info(name, `[round] ${index + 1} | enviado: ${total} | ${percentage}%`) : null;
          })
        );
      }
    } catch (error) {
      logger.error(name, error);
    }
  }

  static async startapp(minutes = 0, enableLog = 'n') {
    const name = this.startapp.name;
    const log = await getLogValue(enableLog);
    const today = await currentDate();
    const mm = Number(minutes);

    try {
      logger.info(name, `iniciando processo node com o pid: ${process.pid} em ${dataHoraAtual()}`);

      await this.gettingAfd(log);

      const obj = await this.importEachAfdLine(mm, log);

      if (obj) {
        log === 1 ? logger.info(name, `[total]-${obj.length} registros`) : null;
        await ConsincoService.insertMany(obj, log);
        await ConsincoService.deleteDuplicates(today, log);

        setTimeout(async () => {
          await this.sendingWfmApi(log);
        }, 180000);
      } else {
        logger.info(name, `nenhuma batida encontrada com intervalo de ${mm} minuto(s)`);
      }
    } catch (error) {
      logger.error(name, error);
    }
  }
}

module.exports = { App };
