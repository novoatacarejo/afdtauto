const { Logger } = require('../../backend/middleware/Logger.middleware.js');

const SERVICE_NAME = 'migrations';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('database');

module.exports = (db) => {
  db.serialize(() => {
    db.run(
      `
    CREATE TABLE IF NOT EXISTS clocks (
    codFilial INTEGER not null,
    dtaGeracao TEXT NOT NULL,
    empresaDir TEXT NOT NULL,
    ip TEXT NOT NULL PRIMARY KEY,
    ipFinal INTEGER NOT NULL,
    item INTEGER NOT NULL,
    nomeEmpresa TEXT NOT NULL,
    nroEmpresa INTEGER NOT NULL,
    piso INTEGER NOT NULL,
    portaria INTEGER NOT NULL,
    status TEXT NOT NULL,
    userName TEXT NOT NULL,
    userPass TEXT NOT NULL
);
    )
    `,
      (err) => {
        if (err) {
          logger.error(SERVICE_NAME, 'erro ao criar a tabela clocks:', err.message);
        } else {
          logger.info(SERVICE_NAME, 'tabela clocks criada ou já existe.');
        }
      }
    );
  });
};
