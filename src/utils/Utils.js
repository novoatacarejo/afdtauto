require('dotenv').config('../../.env');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const { CLOCKS_FILE, AFD_DIR, AFDDAY_DIR } = process.env;

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

const punchInterval = (punchDate, minutes = 0, enableLog = 'n') => {
  const name = punchInterval.name;
  const dta1 = new Date();
  const dta2 = new Date(punchDate);
  const mm = Number(minutes);

  dta1.setMinutes(dta1.getMinutes() + mm);

  if (enableLog === 1) {
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

    console.log(name, `punch: ${obj2} - baseDate: ${obj1} -- ${dta2 >= dta1}`);
  }

  return dta2 >= dta1;
};

const checkoutPunch = (obj, enableLog = 'n') => {
  const name = checkoutPunch.name;
  const log = getLogValue(enableLog);

  if (String(obj.id) !== '0' && obj.id !== null && obj.id !== undefined && [50, 38].includes(obj.lnLength)) {
    enableLog === 1 ? console.log(name, `punch: ${obj.id} - ${obj.lnLength} - true`) : null;
    return true;
  } else {
    return false;
  }
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

const writeAfdTxt = async (dirName, dirItem, dirIpFinal, arrayData) => {
  return new Promise((res, rej) => {
    try {
      /*       const { AFD_DIR } = process.env;
      if (!AFD_DIR) {
        throw new Error('AFD_DIR is not defined in the environment variables');
      } */
      const dir = path.join(AFD_DIR, `${dirName}`);
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

const writeAfdTxtDay = async (dirName, dirItem, dirIpFinal, arrayData) => {
  return new Promise((res, rej) => {
    try {
      const dir = path.join(AFDDAY_DIR, `${dirName}`);
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

const returnAfdDay = (days) => {
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

const returnAfdDate = (date) => {
  const [day, month, year] = date.split('/').map(Number);

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
    console.error(`[readEachLine][error]\n`, err);
    throw false;
  }
};

const readJsonClocks = async (success) => {
  if (!fs.existsSync(CLOCKS_FILE)) {
    fs.writeFileSync(CLOCKS_FILE, JSON.stringify([]));
  }
  try {
    const data = fs.readFileSync(CLOCKS_FILE, 'utf8');
    const parsedData = JSON.parse(data).data;

    const successRecords = parsedData.filter((record) => record.status === `${success}`);

    return successRecords;
  } catch (err) {
    console.log('[readJson][error] - error reading json clocks file:', err);
    return [];
  }
};

function getLogValue(enableLog = 'n') {
  const name = getLogValue.name;

  if (typeof enableLog !== 'string') {
    enableLog = String(enableLog);
  }

  const logValue = enableLog.toLowerCase();

  const log = ['01', '1', 's', 'sim', 'y', 'yes'].includes(logValue)
    ? 1
    : ['0', '02', '2', 'n', 'no', 'nao', 'não'].includes(logValue)
    ? 0
    : null;

  if (log === null) {
    throw new Error(`Utils.js: ${name} - invalid value for enableLog. Use 's' or 'n' (case-insensitive).`);
  }

  return log;
}

function totalRecords(data, log = 0) {
  return log === 1 ? `[total]:${data.length}` : null;
}

function readJsonClock(ip) {
  const name = readJsonClock.name;

  if (!fs.existsSync(CLOCKS_FILE)) {
    console.log(name, 'clocks file not found at: ', CLOCKS_FILE);
    return [];
  }

  try {
    const data = fs.readFileSync(CLOCKS_FILE, 'utf8');
    const parsedData = JSON.parse(data).data;

    const clock = parsedData.filter((record) => record.ip === `${ip}` && record.status === 'success');
    return clock[0];
  } catch (err) {
    console.log(name, err);
    return [];
  }
}

function convertUptime(uptime) {
  const timeToConvert = Number(uptime);

  const days = Math.floor(timeToConvert / (24 * 60 * 60));
  const hours = Math.floor((timeToConvert % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((timeToConvert % (60 * 60)) / 60);
  const seconds = timeToConvert % 60;

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

module.exports = {
  assembleArrayObjects,
  asyncForEach,
  makeChunk,
  returnAfdDay,
  returnAfdDate,
  writeAfdTxt,
  writeAfdTxtDay,
  returnObjCorrectType,
  returnJsonLine,
  subtractHours,
  dataHoraAtual,
  dataHoraAtual2,
  returnHourMinute,
  readJsonClocks,
  readJsonClock,
  currentDateHour,
  currentLogTimeDate,
  formatDate,
  formatHour,
  currentDate,
  listTxtFiles,
  clearScreen,
  readEachLine,
  getLogValue,
  totalRecords,
  convertUptime
};
