const AfdreadEachLine = async (file) => {
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

const AfdlistTxtFiles = (dir) => {
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

const AfdReturnDate = (date) => {
  const [day, month, year] = date.split('/').map(Number);

  return {
    year: `${year}`,
    month: `${month}`,
    day: `${day}`
  };
};

const AfdReturnDay = (days) => {
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

const AfdWriteTxt = async (dirName, dirItem, dirIpFinal, arrayData) => {
  return new Promise((res, rej) => {
    try {
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

const AfdWriteTxtDay = async (dirName, dirItem, dirIpFinal, arrayData) => {
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
