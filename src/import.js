require('dotenv').config('../.env');
const { ConsincoService } = require('./services/consinco.service');
const fs = require('fs');
const path = require('path');
const { getLogger } = require('log4js');
const { promisify } = require('util');
const {
  configureLogService,
  dataHoraAtual,
  formatDate,
  returnJsonLine,
  listTxtFiles,
  currentDate,
  subtractHours,
  clearScreen
} = require('./utils');

let logger = getLogger('LOG');
let cron = require('node-cron');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let dataHorAtual = dataHoraAtual();
const today = currentDate();

console.log(`Inserção em Tabela Oracle iniciada em ${dataHorAtual}`);

const dirPath = 'C:/node/afdtauto/afd';

const readEachLine = async (file) => {
  const readFileAsync = promisify(fs.readFile);

  try {
    const data = await readFileAsync(file);
    const result = data.toString();
    let arrayData = result.split('\r\n');

    arrayData = arrayData.map((item) => {
      return returnJsonLine(item);
    });

    let i = 0;
    for (const data of arrayData) {
      if (!data.id) {
        continue;
      }
      i++;

      data.cardId = await ConsincoService.getCodPessoa(data.id, data.lnLength);
      //delete data.lnLength;
      //delete data.id;

      // console.log(`punch ${i}:`, data);
    }
    return arrayData;
  } catch (err) {
    logger.error(err);
    throw false;
  }
};

const insertApplication = async () => {
  try {
    clearScreen();
    let round = 0;
    let processPid = process.pid;

    await configureLogService();

    logger.info(`[STARTING] Iniciando JOB pid: ${processPid} em ${dataHorAtual}`);

    const files = await listTxtFiles(dirPath);

    files.map(async (file) => {
      const punches = await readEachLine(file);

      punches.map(async (p) => {
        const ln = p.punchLength;
        const id = p.punchId;
        const h = p.hour;
        const d = p.date;
        const cardId = new String(p.cardId);

        const cod = !cardId ? await ConsincoService.getCodPessoa(id, ln) : cardId;
        const codpessoa = parseInt(cod);
        const punch = formatDate(p.punchUserTimestamp);

        let previousHour = subtractHours(new Date(), 1);

        const testHour = h > previousHour ? true : false;
        const testDate = d == today ? true : false;

        if (testHour === true && testDate === true) {
          round++;
          const obj = { codpessoa, punch };
          logger.info(`[IMPORTING] Attempt ${round} `);
          await ConsincoService.insertAfd(obj);
        }
      });
    });
  } catch (error) {
    logger.error('Error on startApplication', error);
  }
};

const insert = async () => {
  await insertApplication();
  //exitProcess(processPid);
};

//insert();

cron.schedule('5 * * * *', async () => {
  insert();
});
