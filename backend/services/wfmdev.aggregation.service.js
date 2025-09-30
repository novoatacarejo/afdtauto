// Serviço para agregação e atualização de tabelas otimizadas para o frontend
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database/afdtauto.db');

class WFMDevAggregationService {
  static async updateAllAggregations(date) {
    await this.updateBatidasPorHora(date);
    await this.updateBatidasPorLoja(date);
    await this.updateStatusRelogios(date);
    await this.updateLojasRelogios(date);
    // Adicione outros métodos conforme novos gráficos/tabelas
  }

  static async updateBatidasPorHora(date) {
    const db = new sqlite3.Database(dbPath);
    const dataStr = date.toISOString().slice(0, 10);
    // Exemplo: agregação de batidas por hora
    db.serialize(() => {
      db.run('DELETE FROM grafico_batidas_por_hora WHERE data = ?', [dataStr]);
      db.all(
        'SELECT hora, COUNT(*) as qtd_batidas FROM batidas WHERE data = ? GROUP BY hora',
        [dataStr],
        (err, rows) => {
          if (!err && rows) {
            rows.forEach((row) => {
              db.run('INSERT INTO grafico_batidas_por_hora (data, hora, qtd_batidas) VALUES (?, ?, ?)', [
                dataStr,
                row.hora,
                row.qtd_batidas
              ]);
            });
          }
        }
      );
    });
    db.close();
  }

  static async updateBatidasPorLoja(date) {
    const db = new sqlite3.Database(dbPath);
    const dataStr = date.toISOString().slice(0, 10);
    db.serialize(() => {
      db.run('DELETE FROM grafico_batidas_por_loja WHERE data = ?', [dataStr]);
      db.all(
        'SELECT loja, COUNT(DISTINCT relogio_id) as qtd_relogios, COUNT(*) as qtd_batidas FROM batidas WHERE data = ? GROUP BY loja',
        [dataStr],
        (err, rows) => {
          if (!err && rows) {
            rows.forEach((row) => {
              db.run(
                'INSERT INTO grafico_batidas_por_loja (data, loja, qtd_relogios, qtd_batidas) VALUES (?, ?, ?, ?)',
                [dataStr, row.loja, row.qtd_relogios, row.qtd_batidas]
              );
            });
          }
        }
      );
    });
    db.close();
  }

  static async updateStatusRelogios(date) {
    const db = new sqlite3.Database(dbPath);
    const dataStr = date.toISOString().slice(0, 10);
    db.serialize(() => {
      db.run('DELETE FROM grafico_status_relogios WHERE data = ?', [dataStr]);
      db.all(
        'SELECT status, COUNT(*) as quantidade FROM relogios WHERE data = ? GROUP BY status',
        [dataStr],
        (err, rows) => {
          if (!err && rows) {
            rows.forEach((row) => {
              db.run('INSERT INTO grafico_status_relogios (data, status, quantidade) VALUES (?, ?, ?)', [
                dataStr,
                row.status,
                row.quantidade
              ]);
            });
          }
        }
      );
    });
    db.close();
  }

  static async updateLojasRelogios(date) {
    const db = new sqlite3.Database(dbPath);
    const dataStr = date.toISOString().slice(0, 10);
    db.serialize(() => {
      db.run('DELETE FROM grafico_lojas_relogios WHERE data = ?', [dataStr]);
      db.all('SELECT tipo, COUNT(*) as quantidade FROM lojas WHERE data = ? GROUP BY tipo', [dataStr], (err, rows) => {
        if (!err && rows) {
          rows.forEach((row) => {
            db.run('INSERT INTO grafico_lojas_relogios (data, tipo, quantidade) VALUES (?, ?, ?)', [
              dataStr,
              row.tipo,
              row.quantidade
            ]);
          });
        }
      });
    });
    db.close();
  }
}

module.exports = { WFMDevAggregationService };
