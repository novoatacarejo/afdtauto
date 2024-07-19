require('dotenv').config('../.env');
const { configure } = require('log4js');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const { Telegraf } = require('telegraf');

const { getLogger } = require('log4js');
let logger = getLogger('LOG');

const assembleArrayObjects = (columnsName, lines) => {
  const qtColumns = columnsName.length;
  const qtLines = lines.length;
  const objects = [];

  for (let line = 0; line < qtLines; line++) {
    let object = {};

    for (let column = 0; column < qtColumns; column++) {
      object[columnsName[column].name] = lines[line][column];
    }

    objects.push(object);
  }

  return objects;
};

const returnObjCorrectType = (arrayObj) => {
  let data = {
    ip: new String(arrayObj.ip),
    portaria: parseInt(arrayObj.portaria),
    user: new String(arrayObj.userName),
    pass: new String(arrayObj.userPass),
    empresa: new String(arrayObj.empresa),
    empresaDir: new String(arrayObj.empresaDir),
    item: parseInt(arrayObj.item),
    ipFinal: parseInt(arrayObj.ipFinal)
  };

  return data;
};

const configureLogWithTelegram = async () => {
  const logname = `./logs/${returnCurrentDateAndTime()}.log`;

  setTimeout(() => {
    sendLogToTelegram(`${logname}`);
  }, 190000);

  return new Promise((res) => {
    configure({
      appenders: {
        logger: {
          type: 'file',
          filename: `${logname}`
        },
        console: {
          type: 'console'
        }
      },
      categories: {
        default: {
          appenders: ['logger', 'console'],
          level: 'info'
        }
      }
    });

    res(true);
  });
};

const configureLogService = async () => {
  return new Promise((res) => {
    configure({
      appenders: {
        logger: {
          type: 'file',
          filename: `./logs/${returnCurrentDateAndTime()}.log`
        },
        console: {
          type: 'console'
        }
      },
      categories: {
        default: {
          appenders: ['logger', 'console'],
          level: 'info'
        }
      }
    });

    res(true);
  });
};

const configureDirLog = async (dirname) => {
  const dir = !dirname ? 'no_name' : dirname;
  return new Promise((res) => {
    configure({
      appenders: {
        logger: {
          type: 'file',
          filename: `./logs/${dir}.log`
        },
        console: {
          type: 'console'
        }
      },
      categories: {
        default: {
          appenders: ['logger', 'console'],
          level: 'info'
        }
      }
    });

    res(true);
  });
};

const writeAfdTxt = async (dirName, dirItem, dirIpFinal, arrayData) => {
  return new Promise((res, rej) => {
    try {
      const dir = `C:/node/afdtauto/afd/${dirName}`;
      const filename = `afd_${dirName}_rlg${dirItem}_ip${dirIpFinal}.txt`;
      const outputFilePath = path.join(dir, filename);

      fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });

      if (typeof arrayData !== 'string' && !Buffer.isBuffer(arrayData)) {
        throw new TypeError('[writeAfdTxt] - The "data" argument must be of type string or an instance of Buffer.');
      }

      fs.writeFileSync(outputFilePath, arrayData);
      res(true);
    } catch (error) {
      rej(error);
    }
  });
};

const returnJsonLine = (ln) => {
  const lnLength = ln.length;

  let id = lnLength === 50 ? ln.slice(35, 46) : lnLength === 38 ? ln.slice(23, 34) : 0;
  let tipoId = lnLength === 50 ? 'cpf' : lnLength === 38 ? 'pis' : '';

  if (id.length !== 11 && lnLength === 50) {
    throw new Error(`Error: ${id} is not a valid cpf number`);
  }

  if (id.length !== 11 && lnLength === 38) {
    throw new Error(`Error: ${id} is not a valid pis number`);
  }

  let punchUserTimestamp =
    lnLength === 50
      ? ln.slice(10, 26).replace('T', ' ')
      : lnLength === 38
      ? ln
          .slice(14, 18)
          .concat('-', ln.slice(12, 14))
          .concat('-', ln.slice(10, 12))
          .concat(' ', new String(ln.slice(18, 20)).concat(':', new String(ln.slice(20, 22))))
      : '01/01/1900 00:00';

  let hour = lnLength === 50 ? ln.slice(21, 26) : lnLength === 38 ? ln.slice(18, 20).concat(':', ln.slice(20, 22)) : 0;

  const punchSystemTimestamp = punchUserTimestamp;
  const punchType = parseInt(1);

  let date =
    lnLength === 50
      ? new String(ln.slice(18, 20)) + '/' + new String(ln.slice(15, 17)) + '/' + ln.slice(10, 14)
      : lnLength === 38
      ? ln.slice(10, 12) + '/' + ln.slice(12, 14) + '/' + ln.slice(14, 18)
      : '01/01/1900';

  const result = {
    id,
    punchSystemTimestamp,
    punchUserTimestamp,
    punchType,
    lnLength,
    hour,
    date
  };

  return result;
};

const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

const makeChunk = (array, length) => {
  let chunks = [];
  let i = 0;

  while (i < array.length) {
    chunks.push(array.slice(i, (i += length)));
  }
  return chunks;
};

const subtractHours = (date, hours) => {
  date.setHours(date.getHours() - hours);

  const hour = date.toLocaleTimeString();

  const etl = hour.split(':');

  return `${etl[0]}:${etl[1]}`;
};

const dataHoraAtual2 = () => {
  const dataHora = new Date();
  const opcoes = {
    timeZone: 'America/Recife',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
  };
  const dataHoraBrasil = dataHora.toLocaleString('pt-BR', opcoes);

  return dataHoraBrasil;
};

const dataHoraAtual = () => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  let month = currentDate.getMonth() + 1;
  let day = currentDate.getDate();
  let hours = currentDate.getHours();
  let minutes = currentDate.getMinutes();
  let seconds = currentDate.getSeconds();

  if (day < 10) {
    day = '0' + day;
  }

  if (month < 10) {
    month = '0' + month;
  }

  if (hours < 10) {
    hours = '0' + hours;
  }

  if (minutes < 10) {
    minutes = '0' + minutes;
  }

  if (seconds < 10) {
    seconds = '0' + seconds;
  }

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

const returnCurrentDateAndTime = () => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  let month = currentDate.getMonth() + 1;
  let day = currentDate.getDate();
  let hours = currentDate.getHours();
  let minutes = currentDate.getMinutes();
  let seconds = currentDate.getSeconds();

  if (day < 10) {
    day = '0' + day;
  }

  if (month < 10) {
    month = '0' + month;
  }

  if (hours < 10) {
    hours = '0' + hours;
  }

  if (minutes < 10) {
    minutes = '0' + minutes;
  }

  if (seconds < 10) {
    seconds = '0' + seconds;
  }

  return `${day}-${month}-${year}_${hours}h${minutes}m`;
};

const returnHourMinute = (type) => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  if (type === 'hh') {
    return `${currentHour}`;
  } else if (type === 'hhmm') {
    return `${currentHour}:${currentMinute}`;
  } else if (type === 'mm') {
    return `${currentMinute}`;
  } else {
    return null;
  }
};

const returnAfdDate = (days) => {
  const date = new Date();
  const previousDate = new Date(date.setDate(date.getDate() + days));
  const year = previousDate.getFullYear();
  let month = previousDate.getMonth() + 1;
  let day = previousDate.getDate();

  return {
    year: `${year}`,
    month: `${month}`,
    day: `${day}`
  };
};

const currentDateHour = () => {
  const options = { timeZone: 'America/Recife' };
  let dataAtual = new Date();
  let dataHoraBrasil = dataAtual.toLocaleString('pt-BR', options);

  return dataHoraBrasil;
};

const currentLogTimeDate = () => {
  const options = { timeZone: 'America/Recife', hour12: false };
  const date = new Date();

  const year = date.toLocaleString('en-CA', { ...options, year: 'numeric' });
  const month = date.toLocaleString('en-CA', { ...options, month: '2-digit' });
  const day = date.toLocaleString('en-CA', { ...options, day: '2-digit' });
  let hours = date.toLocaleString('en-CA', { ...options, hour: '2-digit' });
  let minutes = date.toLocaleString('en-CA', { ...options, minute: '2-digit' });
  let seconds = date.toLocaleString('en-CA', { ...options, second: '2-digit' });

  hours = hours.length === 1 ? new String(`0${hours}`) : hours;
  hours = new String(hours) === '24' ? new String(`00`) : hours;
  minutes = minutes.length === 1 ? new String(`0${minutes}`) : minutes;
  seconds = seconds.length === 1 ? new String(`0${seconds}`) : seconds;

  const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  return formattedDate;
};

const currentDate = () => {
  const options = { timeZone: 'America/Recife' };
  let dataAtual = new Date();
  let dataHoraBrasil = dataAtual.toLocaleString('pt-BR', options);

  let date = dataHoraBrasil.slice(0, 10);

  return date;
};

const exitProcess = async (pid) => {
  let dataHorAtual = await dataHoraAtual('hhmm');
  logger.info(`[exitProcess][ENDING] - Finalizando JOB pid: ${pid} em ${dataHorAtual}`);

  setTimeout((pid) => {
    process.kill(pid, 2);
  }, 180000);

  logger.info(`[exitProcess][ENDING] - Finalizado!`);
};

const formatDate = (dateStr) => {
  const [datePart, timePart] = dateStr.split(' ');

  if (timePart.includes(':')) {
    const [hours, minutes] = timePart.split(':');

    const paddedHours = hours.length === 1 ? hours.padStart(2, '0') : hours;
    const paddedMinutes = minutes.length === 1 ? minutes.padStart(2, '0') : minutes;

    const paddedTimePart = `${paddedHours}:${paddedMinutes}`;

    const paddedDateString = `${datePart} ${paddedTimePart}`;

    return paddedDateString;
  } else {
    return dateStr;
  }
};

const formatHour = (hour) => {
  const [hours, minutes] = hour.split(':');

  const paddedHours = hours.length === 1 ? hours.padStart(2, '0') : hours;
  const paddedMinutes = minutes.length === 1 ? minutes.padStart(2, '0') : minutes;

  const paddedTimePart = `${paddedHours}:${paddedMinutes}`;

  return paddedTimePart;
};

const listTxtFiles = (dir) => {
  let files = [];
  let fullDir = [];

  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      files.push(listTxtFiles(filePath));
    } else {
      if (path.extname(file).toLowerCase() === '.txt') {
        files.push(filePath);
      }
    }
  });

  files.map(async (item) => {
    let itemA = new String(item);
    let itemB = itemA.replace(/\s/g, '');
    let itemC = itemB.split(',');

    for (let file of itemC) {
      fullDir.push(file);
    }
  });

  return fullDir;
};

const clearScreen = () => {
  process.stdout.write('\x1B[2J\x1B[H');
};

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
      if (!data.id && data.id === 0 && data.id === undefined) {
        continue;
      }
      i++;
    }
    return arrayData;
  } catch (err) {
    logger.error(`[readEachLine][error]\n`, err);
    throw false;
  }
};

const sendLogToTelegram = (logname) => {
  const telegram = {
    token: process.env.BOT_TOKEN,
    chatId: process.env.CHAT_ID
  };

  const bot = new Telegraf(telegram.token);

  const filename = `${logname}`;

  fs.readFile(filename, 'utf8', async (err, data) => {
    if (err) throw err;
    let file = 'File: ' + filename;
    let msg = `Integração Tlantic: \n\n\n${file} \n\n\n${data}`;

    await bot.telegram.sendMessage(telegram.chatId, msg);
  });

  logger.info(`[TELEGRAM] send log to Telegram Group`);
};

const readJsonClocks = async (success) => {
  const jsonPath = await path.join('C:/node/afdtauto/json', 'clocks.json');
  if (!fs.existsSync(jsonPath)) {
    fs.writeFileSync(jsonPath, JSON.stringify([]));
  }
  try {
    const data = fs.readFileSync(jsonPath, 'utf8');
    const parsedData = JSON.parse(data).data;

    const successRecords = parsedData.filter((record) => record.status === `${success}`);

    return successRecords;
  } catch (err) {
    logger.error('[readJson][error] - error reading json clocks file:', err);
    return [];
  }
};

/*

const errorMessage = (error, service, name, ip, attempt) => {

  const errorCode = !error.code ? `ERRMYCODE` : errorCode;
  const ipAddress = !ip ? `localhost` : ip;

  if (error.code === 'ETIMEDOUT') {
    logger.error(`[${service}][${name}][${error.code}] - connection to ${ipAddress} timed out on attempt ${attempt}.`);
  } else if (error.code === 'ECONNRESET') {
    logger.error(`[${service}][${name}][${error.code}] - connection to ${ipAddress} reset on attempt ${attempt}.`);
  } else if (error.code === 'ERR_BAD_RESPONSE') {
    logger.error(`[${service}][${name}][${error.code}] - bad response from ${ipAddress} on attempt ${attempt}.`);
  } else if (error.code === 'ECONNABORTED') {
    logger.error(`[${service}][${name}][${error.code}] - connection to ${ipAddress} aborted on attempt ${attempt}.`);
  } else {
    logger.error(`[${service}][${name}][error][${error.code}] - station: ${ipAddress} after 3 attempts - ${error}`);
  }
};
*/

exports.assembleArrayObjects = assembleArrayObjects;
exports.configureLogService = configureLogService;
exports.configureDirLog = configureDirLog;
exports.configureLogWithTelegram = configureLogWithTelegram;
exports.asyncForEach = asyncForEach;
exports.makeChunk = makeChunk;
exports.returnAfdDate = returnAfdDate;
exports.writeAfdTxt = writeAfdTxt;
exports.returnObjCorrectType = returnObjCorrectType;
exports.returnJsonLine = returnJsonLine;
exports.subtractHours = subtractHours;
exports.dataHoraAtual = dataHoraAtual;
exports.dataHoraAtual2 = dataHoraAtual2;
exports.returnHourMinute = returnHourMinute;
exports.readJsonClocks = readJsonClocks;
exports.exitProcess = exitProcess;
exports.currentDateHour = currentDateHour;
exports.currentLogTimeDate = currentLogTimeDate;
exports.formatDate = formatDate;
exports.formatHour = formatHour;
exports.currentDate = currentDate;
exports.listTxtFiles = listTxtFiles;
exports.clearScreen = clearScreen;
exports.readEachLine = readEachLine;
