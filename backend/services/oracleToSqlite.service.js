// Serviço para importar dados do Oracle e popular o SQLite
const { OracleService } = require('../services/oracle.service.js');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database/afdtauto.db');

async function importBatidasFromOracle(date) {
  // Busca dados no Oracle para a data
  const dataStr = date.toISOString().slice(0, 10);
  const batidasOracle = await OracleService.getBatidasPorData(dataStr);

  if (batidasOracle && batidasOracle.length > 0) {
    // Insere dados no SQLite
    const db = new sqlite3.Database(dbPath);
    await new Promise((resolve) => {
      db.serialize(() => {
        batidasOracle.forEach((row, idx) => {
          db.run(
            'INSERT INTO batidas (data, hora, loja, relogio_id) VALUES (?, ?, ?, ?)',
            [row.data, row.hora, row.loja, row.relogio_id],
            idx === batidasOracle.length - 1 ? resolve : undefined
          );
        });
      });
    });
    db.close();
    console.log('Dados batidas importados do Oracle para', dataStr);
  } else {
    console.log('Nenhum dado batidas encontrado no Oracle para', dataStr);
  }
}

async function importRelogiosFromOracle(date) {
  // Busca dados de relógios no Oracle para a data
  const dataStr = date.toISOString().slice(0, 10);
  const relogiosOracle = await OracleService.getRelogiosPorData(dataStr);

  if (relogiosOracle && relogiosOracle.length > 0) {
    // Insere dados no SQLite
    const db = new sqlite3.Database(dbPath);
    await new Promise((resolve) => {
      db.serialize(() => {
        relogiosOracle.forEach((row, idx) => {
          db.run(
            'INSERT INTO relogios (data, status) VALUES (?, ?)',
            [row.data, row.status],
            idx === relogiosOracle.length - 1 ? resolve : undefined
          );
        });
      });
    });
    db.close();
    console.log('Dados relogios importados do Oracle para', dataStr);
  } else {
    console.log('Nenhum dado relogios encontrado no Oracle para', dataStr);
  }
}

async function importLojasFromOracle(date) {
  // Busca dados de lojas no Oracle para a data
  const dataStr = date.toISOString().slice(0, 10);
  const lojasOracle = await OracleService.getLojasPorData(dataStr);

  if (lojasOracle && lojasOracle.length > 0) {
    // Insere dados no SQLite
    const db = new sqlite3.Database(dbPath);
    await new Promise((resolve) => {
      db.serialize(() => {
        lojasOracle.forEach((row, idx) => {
          db.run(
            'INSERT INTO lojas (data, tipo) VALUES (?, ?)',
            [row.data, row.tipo],
            idx === lojasOracle.length - 1 ? resolve : undefined
          );
        });
      });
    });
    db.close();
    console.log('Dados lojas importados do Oracle para', dataStr);
  } else {
    console.log('Nenhum dado lojas encontrado no Oracle para', dataStr);
  }
}

async function importAllFromOracle(date) {
  await importBatidasFromOracle(date);
  await importRelogiosFromOracle(date);
  await importLojasFromOracle(date);
}

module.exports = { importAllFromOracle };
