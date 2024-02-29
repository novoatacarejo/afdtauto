const { configure } = require('log4js');
const { exec } = require('child_process');
const { promisify } = require('util');
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

  return `${day}-${month}-${year}`;
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

const configureLogService = async () => {
  return new Promise((res) => {
    configure({
      appenders: {
        logger: {
          type: 'file',
          filename: `logs/${returnCurrentDateAndTime()}.log`
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
    const dir = `afd/${dirName}/`;
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
      logger.info(`[CONNECT] Working on station: ${host}`);
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
          .concat(' ', ln.slice(18, 20).concat(':', ln.slice(21, 23)))
      : 0;

  const punchSystemTimestamp = punchUserTimestamp;
  const punchType = parseInt(1);

  const result = {
    id,
    punchSystemTimestamp,
    punchUserTimestamp,
    punchType,
    lnLength
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

exports.assembleArrayObjects = assembleArrayObjects;
exports.configureLogService = configureLogService;
exports.asyncForEach = asyncForEach;
exports.makeChunk = makeChunk;
exports.returnAfdDate = returnAfdDate;
exports.writeAfdTxt = writeAfdTxt;
exports.returnObjCorrectType = returnObjCorrectType;
exports.isDeviceOnline = isDeviceOnline;
exports.returnJsonLine = returnJsonLine;
