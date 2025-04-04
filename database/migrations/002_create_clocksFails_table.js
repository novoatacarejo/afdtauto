const { Logger } = require('../../backend/middleware/Logger.middleware.js');

const SERVICE_NAME = 'migrations';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('database');

module.exports = (db) => {
  db.serialize(() => {
    db.run(
      `
    CREATE TABLE IF NOT EXISTS clocksFails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip TEXT,
      status TEXT,
      lastSyncTime TEXT,
      errorCode TEXT,
      errorMessage TEXT
    )
    `,
      (err) => {
        if (err) {
          logger.error(SERVICE_NAME, 'erro ao criar a tabela clocksFails:', err.message);
        } else {
          logger.info(SERVICE_NAME, 'tabela clocksFails criada ou já existe.');
        }
      }
    );
  });
};
