const { Logger } = require('../../backend/middleware/Logger.middleware.js');

const SERVICE_NAME = 'migrations';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('database');

module.exports = (db) => {
  db.serialize(() => {
    db.run(
      `
      CREATE TABLE IF NOT EXISTS clocksStatus (
        nroEmpresa INTEGER,
        ip TEXT PRIMARY KEY,
        lastSyncDate TEXT,
        nomeEmpresa TEXT,
        status TEXT,
        errorCode TEXT,
        errorMessage TEXT
      )
      `,
      (err) => {
        if (err) {
          logger.error(SERVICE_NAME, 'erro ao criar a tabela clocksStatus:', err.message);
        } else {
          logger.info(SERVICE_NAME, 'tabela clocksStatus criada ou já existe.');
        }
      }
    );
  });
};
