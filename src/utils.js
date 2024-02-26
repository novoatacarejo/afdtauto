const { configure } = require('log4js');
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

  //return `${day}-${month}-${year}__${hours}h${minutes}m${seconds}s`;
  return `${day}-${month}-${year}`;
};

const returnAfdDate = () => {
  const date = new Date();
  const previousDate = new Date(date.setDate(date.getDate() - 1));
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
