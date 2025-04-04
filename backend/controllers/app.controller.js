require('dotenv').config('../../.env');
const { StationService, TlanticService, WFMDevService } = require('../services/index.service.js');
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
  readClocksInfo,
  getLogValue
} = require('../utils/Utils.js');

const SERVICE_NAME = 'AppController';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('application');

const { AFD_DIR } = process.env;

const checkPunch = (obj, minutes = 0, enableLog = 'n') => {
  const name = checkPunch.name;
  const log = getLogValue(enableLog);
  const dta1 = new Date();
  const mm = Number(minutes);

  dta1.setMinutes(dta1.getMinutes() + mm);

  if (
    String(obj.id) !== '0' &&
    obj.id !== null &&
    obj.id !== undefined &&
    [50, 38].includes(obj.lnLength) &&
    new Date(obj.punchUserTimestamp) >= dta1
  ) {
    if (log === 1) {
      const dta2 = new Date(obj.punchUserTimestamp);
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
      logger.info(name, `punch: ${obj.id} - ${obj.lnLength} - true`);
    }
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

      //const stations = await readJsonClocks('success');
      const stations = await readClocksInfo();
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
            if (checkPunch(p, minutes, 'n')) {
              obj.push({
                idNumber: p.id,
                idLength: p.lnLength,
                punch: await formatDate(p.punchUserTimestamp)
              });

              log === 1
                ? logger.info(
                    name,
                    `[afd ${files.indexOf(file)}:${punches.length}] | ${(
                      (punches.indexOf(p) / punches.length) *
                      100
                    ).toFixed(2)}%`
                  )
                : console.log('no log');
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

        const punches = await WFMDevService.getPunchesByHour(log);

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
              ? logger.info(name, `[round] ${index + 1} | total: ${total} | ${percentage}%`)
              : console.log(null);
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
    const date = dataHoraAtual().split(' ')[0];

    try {
      logger.info(name, `iniciando processo node com o pid: ${process.pid} em ${dataHoraAtual()}`);

      await this.gettingAfd(log);

      const obj = await this.importEachAfdLine(mm, log);

      if (obj) {
        log === 1 ? logger.info(name, `[total]-${obj.length} registros`) : console.log('no log');
        await WFMDevService.insertMany(obj, log);
        await WFMDevService.deleteDuplicates(today, log);

        logger.info(name, `[procedure]-enviando batidas via procedure para o Stage WFM`);
        await WFMDevService.sendToStgWfm(date, log);

        /* 03/04/2025 - substituicao do envio por procedure
        setTimeout(async () => {
          await this.sendingWfmApi(log);
        }, 180000);
         */
      } else {
        logger.info(name, `nenhuma batida encontrada com intervalo de ${mm} minuto(s)`);
      }
    } catch (error) {
      logger.error(name, error);
    }
  }
}

module.exports = { App };
