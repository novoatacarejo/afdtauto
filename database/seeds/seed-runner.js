require('dotenv').config('../../.env');
const fs = require('fs');
const path = require('path');
const { Logger } = require('../../backend/middleware/Logger.middleware.js');

const SERVICE_NAME = 'seeds';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('database');

const { DATABASE_PATH } = process.env;

const seedsDir = path.join(DATABASE_PATH, 'seeds');

fs.readdir(seedsDir, (err, files) => {
  if (err) {
    logger.error('erro ao ler a pasta seeds:', err);
    process.exit(1);
  }

  const seedFiles = files.filter((file) => file.endsWith('_seed.js'));

  if (seedFiles.length === 0) {
    logger.error('nenhum arquivo de seed encontrado.');
    process.exit(0);
  }

  logger.info('executando arquivos de seed:');
  seedFiles.forEach((file) => {
    console.log(`- ${file}`);
    require(path.join(seedsDir, file));
  });
});
