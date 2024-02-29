require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const { ConsincoService } = require('../src/services/consinco.service');
const { delay } = require('../src/utils');
const { promisify } = require('util');

const filePath = `${__dirname}/afd_2-CARPINA_rlg1_ip_80.txt`;
//const filePath = `${__dirname}/afd_29-ARARIPINA_rlg1_ip_80.txt`;

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

const readLastSync = async (file) => {
  const readFileAsync = promisify(fs.readFile);

  try {
    const data = await readFileAsync(file);
    const result = data.toString();
    let arrayData = result.split('\r\n');

    arrayData = arrayData.map((item) => {
      return returnJsonLine(item);
    });

    for (const data of arrayData) {
      if (!data.id) {
        continue;
      }
      const codigo = await ConsincoService.getCodPessoa(data.id, data.lnLength);

      data.cardId = codigo;
      delete data.lnLength;
      delete data.id;

      //console.log({ ...data });
      return data;
    }
    return arrayData;
  } catch (err) {
    logger.error(err);
    throw false;
  }
};

const start = async () => {
  let result = await readLastSync(filePath);

  //return result;
  console.log(result);
};

start();
