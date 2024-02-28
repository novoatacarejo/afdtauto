const fs = require('fs');
const readline = require('readline');
const { ConsincoService } = require('../src/services/consinco.service');

console.log(__dirname);

// Replace 'example.txt' with the path to your text file
const filePath = `${__dirname}/afd_2-CARPINA_rlg1_ip_80.txt`;
//const filePath = `${__dirname}/afd_29-ARARIPINA_rlg1_ip_80.txt`;

const returnJsonLine = async (ln) => {
  const lnLength = ln.length;
  const id = new String(ln.slice(23, 34));

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

  const cardId = await ConsincoService.getCodPessoa(id, lnLength);
  const punchSystemTimestamp = punchUserTimestamp;
  const punchType = parseInt(1);

  const result = {
    cardId,
    punchSystemTimestamp,
    punchUserTimestamp,
    punchType
  };

  return result;
};

// Create a readline interface
const rl = readline.createInterface({
  input: fs.createReadStream(filePath),
  output: process.stdout,
  terminal: false
});

let linesRead = 0;
let linesNotReaded = 0;
let total = 0;

// Event handler for each line read from the file
rl.on('line', async (line) => {
  total++;
  if (line.length === 38 || line.length === 50) {
    linesRead++;
    try {
      const newLine = await returnJsonLine(line);
      console.log(newLine);
    } catch (err) {
      console.log(`Error to get line from the TXT file.`, err);
    }
  } else {
    linesNotReaded++;
    console.warn('[WARNING]\nLine not consider:', line);
  }
});

// Event handler for when all lines have been read
rl.on('close', () => {
  console.log(
    `[FINISH]\nFile has been fully read.\nTotal lines:${total}\nLines readed: ${linesRead}\nLines not readed: ${linesNotReaded}`
  );
});
