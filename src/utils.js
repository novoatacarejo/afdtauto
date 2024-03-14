const { configure } = require('log4js');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
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
    ipFInal: parseInt(arrayObj.ipFinal)
  };

  return data;
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

const writeAfdTxt = async (dirName, dirItem, dirIpFinal, arrayData) => {
  return new Promise((res) => {
    const dir = `./afd/${dirName}/`;
    const filename = `afd_${dirName}_rlg${dirItem}_ip${dirIpFinal}.txt`;
    const outputFilePath = path.join(dir, filename);

    fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });

    fs.writeFileSync(outputFilePath, arrayData);

    res(true);
  });
};

const isDeviceOnline = async (host) => {
  return new Promise((resolve, reject) => {
    exec(`ping -n 10 ${host}`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return `[NETWORK-CHECK] Station ${host} error:\n${error}`;
      }
      if (stderr) {
        reject(stderr);
        return `[NETWORK-CHECK] Station ${host} is not accessible:\n${stderr}`;
      }
      logger.info(`[CONNECTING] Working on station: ${host}`);
      resolve(!stderr); // Device is online if there's no error
    });
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
          .concat(' ', new String(ln.slice(18, 20)).concat(':', new String(ln.slice(21, 22))))
      : '01/01/1900 00:00';

  let hour = lnLength === 50 ? ln.slice(21, 26) : lnLength === 38 ? ln.slice(18, 20).concat(':', ln.slice(21, 22)) : 0;

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

const currentDate = () => {
  const options = { timeZone: 'America/Recife' };
  let dataAtual = new Date();
  let dataHoraBrasil = dataAtual.toLocaleString('pt-BR', options);

  let date = dataHoraBrasil.slice(0, 10);

  return date;
};

const exitProcess = async (pid) => {
  let dataHorAtual = await dataHoraAtual('hhmm');
  logger.info(`[ENDING] Finalizando JOB pid: ${pid} em ${dataHorAtual}`);

  setTimeout((pid) => {
    process.kill(pid, 2);
  }, 180000);

  logger.info(`[ENDING] Finalizado!`);
};

const formatDate = (dateStr) => {
  // Split the date string into date and time parts
  const [datePart, timePart] = dateStr.split(' ');

  // Check if the time part contains a colon (:) indicating it's a time
  if (timePart.includes(':')) {
    // Split the time part into hours and minutes
    const [hours, minutes] = timePart.split(':');

    // Pad the minutes with a leading zero if it's a single-digit number
    const paddedMinutes = minutes.padStart(2, '0');

    // Reconstruct the time part with padded minutes
    const paddedTimePart = `${hours}:${paddedMinutes}`;

    // Reconstruct the date string with the updated time part
    const paddedDateString = `${datePart} ${paddedTimePart}`;

    return paddedDateString; // Output: 2024-03-12 22:06
  } else {
    // If it's a complete date, no modification is needed
    return dateString;
  }
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

exports.assembleArrayObjects = assembleArrayObjects;
exports.configureLogService = configureLogService;
exports.asyncForEach = asyncForEach;
exports.makeChunk = makeChunk;
exports.returnAfdDate = returnAfdDate;
exports.writeAfdTxt = writeAfdTxt;
exports.returnObjCorrectType = returnObjCorrectType;
exports.isDeviceOnline = isDeviceOnline;
exports.returnJsonLine = returnJsonLine;
exports.subtractHours = subtractHours;
exports.dataHoraAtual = dataHoraAtual;
exports.dataHoraAtual2 = dataHoraAtual2;
exports.returnHourMinute = returnHourMinute;
exports.exitProcess = exitProcess;
exports.currentDateHour = currentDateHour;
exports.formatDate = formatDate;
exports.currentDate = currentDate;
exports.listTxtFiles = listTxtFiles;
exports.clearScreen = clearScreen;
