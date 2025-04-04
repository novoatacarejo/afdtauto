require('dotenv').config('../.env');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { Logger } = require('../backend/middleware/Logger.middleware.js');

const SERVICE_NAME = 'database';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('database');

const { DATABASE_PATH, DATABASE_NAME } = process.env;

const dbPath = path.join(DATABASE_PATH, DATABASE_NAME);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('erro ao conectar ao banco de dados SQLite:', err.message);
  } else {
    console.log('conectado ao banco de dados SQLite.');
  }
});

const migrationsPath = path.join(__dirname, 'migrations');

fs.readdirSync(migrationsPath).forEach((file) => {
  const migration = require(path.join(migrationsPath, file));
  migration(db);
});

module.exports = db;
