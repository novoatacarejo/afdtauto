// Script para criar as tabelas de origem necessárias no SQLite
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database/afdtauto.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Tabela batidas
  db.run(`CREATE TABLE IF NOT EXISTS batidas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT,
    hora TEXT,
    loja TEXT,
    relogio_id INTEGER
  )`);

  // Tabela relogios
  db.run(`CREATE TABLE IF NOT EXISTS relogios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT,
    status TEXT
  )`);

  // Tabela lojas
  db.run(`CREATE TABLE IF NOT EXISTS lojas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT,
    tipo TEXT
  )`);
});

db.close();

console.log('Tabelas de origem criadas com sucesso!');
