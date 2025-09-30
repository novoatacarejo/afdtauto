// Migration para criar tabelas otimizadas para cada gráfico/tabela do frontend
module.exports = {
  up: async function (db) {
    await db.run(`CREATE TABLE IF NOT EXISTS grafico_batidas_por_hora (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT,
      hora TEXT,
      qtd_batidas INTEGER
    )`);
    await db.run(`CREATE TABLE IF NOT EXISTS grafico_batidas_por_loja (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT,
      loja TEXT,
      qtd_relogios INTEGER,
      qtd_batidas INTEGER
    )`);
    await db.run(`CREATE TABLE IF NOT EXISTS grafico_status_relogios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT,
      status TEXT,
      quantidade INTEGER
    )`);
    await db.run(`CREATE TABLE IF NOT EXISTS grafico_lojas_relogios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT,
      tipo TEXT,
      quantidade INTEGER
    )`);
    // Adicione outras tabelas conforme novos gráficos/tabelas
  },
  down: async function (db) {
    await db.run('DROP TABLE IF EXISTS grafico_batidas_por_hora');
    await db.run('DROP TABLE IF EXISTS grafico_batidas_por_loja');
    await db.run('DROP TABLE IF EXISTS grafico_status_relogios');
    await db.run('DROP TABLE IF EXISTS grafico_lojas_relogios');
  }
};

if (require.main === module) {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = require('path').resolve(__dirname, '../afdtauto.db');
  const db = new sqlite3.Database(dbPath);
  module.exports.up(db).then(() => {
    console.log('Tabelas criadas com sucesso!');
    db.close();
  });
}
