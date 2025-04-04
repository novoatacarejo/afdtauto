require('dotenv').config('../../.env');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const db = require('../database.js');
const { Logger } = require('../../backend/middleware/Logger.middleware.js');

const SERVICE_NAME = 'seeds';

const { DATABASE_PATH } = process.env;

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('database');

function readClocksJson() {
  const filePath = path.join(DATABASE_PATH, 'clocks.json');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const jsonData = JSON.parse(fileContent);
  return jsonData.data;
}

const clocksData = readClocksJson();

db.serialize(() => {
  const stmt = db.prepare(`
    INSERT INTO clocks (
      codFilial, dtaGeracao, empresaDir, ip, ipFinal, item, nomeEmpresa,
      nroEmpresa, piso, portaria, status, userName, userPass
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  clocksData.forEach((clock) => {
    stmt.run(
      clock.codFilial,
      clock.dtaGeracao,
      clock.empresaDir,
      clock.ip,
      clock.ipFinal,
      clock.item,
      clock.nomeEmpresa,
      clock.nroEmpresa,
      clock.piso,
      clock.portaria,
      clock.status,
      clock.userName,
      clock.userPass
    );
    logger.info(SERVICE_NAME, `inserido: ${clock.ip} - ${clock.nomeEmpresa}`);
  });

  stmt.finalize();
});

db.close();
