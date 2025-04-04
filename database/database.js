require('dotenv').config('../.env');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const { DATABASE_PATH, DATABASE_NAME } = process.env;

// Caminho para o arquivo do banco de dados SQLite
const dbPath = path.join(DATABASE_PATH, DATABASE_NAME);

// Cria ou abre o banco de dados
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados SQLite:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite.');
  }
});

module.exports = db;
