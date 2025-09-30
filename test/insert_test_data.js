// Script para inserir dados de teste nas tabelas de origem do SQLite
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database/afdtauto.db');
const dataStr = '2025-09-29';

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Inserir batidas
  db.run('INSERT INTO batidas (data, hora, loja, relogio_id) VALUES (?, ?, ?, ?)', [dataStr, '08', 'MATRIZ', 1]);
  db.run('INSERT INTO batidas (data, hora, loja, relogio_id) VALUES (?, ?, ?, ?)', [dataStr, '09', 'MATRIZ', 1]);
  db.run('INSERT INTO batidas (data, hora, loja, relogio_id) VALUES (?, ?, ?, ?)', [dataStr, '10', 'GOIANA', 2]);

  // Inserir relogios
  db.run('INSERT INTO relogios (data, status) VALUES (?, ?)', [dataStr, 'Online']);
  db.run('INSERT INTO relogios (data, status) VALUES (?, ?)', [dataStr, 'Offline']);

  // Inserir lojas
  db.run('INSERT INTO lojas (data, tipo) VALUES (?, ?)', [dataStr, 'Supermercado']);
  db.run('INSERT INTO lojas (data, tipo) VALUES (?, ?)', [dataStr, 'Atacado']);
});

db.close();

console.log('Dados de teste inseridos para', dataStr);
