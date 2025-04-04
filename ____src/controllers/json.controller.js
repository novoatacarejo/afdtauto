require('dotenv').config('../../.env');
const fs = require('fs');
const path = require('path');

const { CLOCKS_FILE, LOG_DIR, AFD_DIR, AFDDAY_DIR } = process.env;

const jsonReadClocks = async (success) => {
  if (!fs.existsSync(CLOCKS_FILE)) {
    fs.writeFileSync(CLOCKS_FILE, JSON.stringify([]));
  }
  try {
    const data = fs.readFileSync(CLOCKS_FILE, 'utf8');
    const parsedData = JSON.parse(data).data;

    const successRecords = parsedData.filter((record) => record.status === `${success}`);

    return successRecords;
  } catch (err) {
    logger.error('[readJson][error] - error reading json clocks file:', err);
    return [];
  }
};

const jsonMakeChunk = (array, length) => {
  let chunks = [];
  let i = 0;

  while (i < array.length) {
    chunks.push(array.slice(i, (i += length)));
  }
  return chunks;
};

const jsonReturnLine = (ln) => {
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

const jsonAssembleArrayObj = (columnsName, lines) => {
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
