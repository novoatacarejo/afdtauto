require('dotenv').config('../.env');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { Logger } = require('../middleware/Logger.middleware.js');

const SERVICE_NAME = 'SqlLite3Service';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('sqlite');

const { DATABASE_PATH, DATABASE_NAME } = process.env;

class SqlLiteService {
  // Método para obter o caminho completo do banco de dados
  static getDBPath = () => {
    return path.join(DATABASE_PATH, DATABASE_NAME);
  };

  // Método para conectar ao banco de dados
  static connectDB = () => {
    const dbPath = this.getDBPath();
    return new sqlite3.Database(dbPath, (err) => {
      if (err) {
        logger.error(SERVICE_NAME, `Erro ao conectar ao banco de dados: ${err.message}`);
        throw new Error(`Erro ao conectar ao banco de dados: ${err.message}`);
      }
      // logger.info(SERVICE_NAME, `Conectado ao banco de dados: ${dbPath}`);
    });
  };

  // Método para executar comandos SQL (INSERT, UPDATE, DELETE)
  static executeSQL = (sqlTxt, params = []) => {
    const db = this.connectDB();
    return new Promise((resolve, reject) => {
      db.run(sqlTxt, params, function (err) {
        if (err) {
          logger.error(SERVICE_NAME, `Erro ao executar SQL: ${err.message}`);
          reject(err);
        } else {
          //logger.info(SERVICE_NAME, `Comando SQL executado com sucesso. ID: ${this.lastID}`);
          resolve(this.lastID);
        }
      });
    }).finally(() => {
      this.closeDB(db);
    });
  };

  // Método para executar consultas SQL (SELECT)
  static queryDB = (sqlTxt, params = []) => {
    const db = this.connectDB();
    return new Promise((resolve, reject) => {
      db.all(sqlTxt, params, (err, rows) => {
        if (err) {
          logger.error(SERVICE_NAME, `Erro ao executar consulta SQL: ${err.message}`);
          reject(err);
        } else {
          //logger.info(SERVICE_NAME, `Consulta SQL executada com sucesso. Linhas retornadas: ${rows.length}`);
          resolve(rows);
        }
      });
    }).finally(() => {
      this.closeDB(db);
    });
  };

  // Método para bulk insert de dados
  static bulkInsert = (tableName, columns, data) => {
    const db = this.connectDB();
    const name = this.bulkInsert.name;

    const placeholders = data.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');
    const sqlTxt = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${placeholders}`;

    const params = data.flat();

    return new Promise((resolve, reject) => {
      db.run(sqlTxt, params, function (err) {
        if (err) {
          logger.error(SERVICE_NAME, name, `Erro ao executar bulk insert na tabela ${tableName}: ${err.message}`);
          reject(err);
        } else {
          //logger.info(SERVICE_NAME, `Bulk insert executado com sucesso na tabela ${tableName}.`);
          resolve(this.changes);
        }
      });
    }).finally(() => {
      this.closeDB(db);
    });
  };

  // Método para fechar a conexão com o banco de dados
  static closeDB = (db) => {
    db.close((err) => {
      if (err) {
        logger.error(SERVICE_NAME, name, `Erro ao fechar o banco de dados: ${err.message}`);
      } else {
        //logger.info(SERVICE_NAME, `conexão com o banco de dados fechada.`);
        null;
      }
    });
  };

  static logMessage(log, name, message) {
    if (log === 1) {
      logger.info(name, message);
    }
  }

  static getLogValue(enableLog = 'n') {
    //const name = getLogValue.name;

    if (typeof enableLog !== 'string') {
      enableLog = String(enableLog);
    }

    const logValue = enableLog.toLowerCase();

    const log = ['01', '1', 's', 'sim', 'y', 'yes'].includes(logValue)
      ? 1
      : ['0', '02', '2', 'n', 'no', 'nao', 'não'].includes(logValue)
      ? 0
      : null;

    if (log === null) {
      throw new Error(`getLogValue - invalid value for enableLog. Use 's' or 'n' (case-insensitive).`);
    }

    return log;
  }

  static validateArray(data, name) {
    if (!Array.isArray(data)) {
      this.logMessage(log, name, 'Os dados não são um array. Retornando um array vazio.');
      return [];
    }
    return data;
  }

  static getClocksInfo = async (enableLog = 'n') => {
    const name = this.getClocksInfo.name;
    const log = this.getLogValue(enableLog);

    try {
      //this.logMessage(log, name, `obtendo dispositivos no banco de dados.`);

      const query = `SELECT ip, portaria, userName, userPass, nomeEmpresa, empresaDir, item, ipFinal FROM clocks a`;

      const rows = await this.queryDB(query);
      if (!this.validateArray(rows, name)) {
        this.logMessage(log, name, `nenhum dispositivo encontrado na tabela "clocks".`);
        return [];
      }

      //this.logMessage(log, name, `encontrados ${rows.length} dispositivos cadastrados.`);
      return rows;
    } catch (error) {
      logger.error(name, `erro ao buscar dispositivos: ${error.message}`);
      return [];
    }
  };

  static clocksRoute1 = async (enableLog = 'n') => {
    const name = this.clocksRoute1.name;
    const log = this.getLogValue(enableLog);

    try {
      //this.logMessage(log, name, `obtendo dispositivos no banco de dados.`);

      const query = `SELECT a.* FROM vw_clocks_route1 a`;

      const rows = await this.queryDB(query);
      if (!this.validateArray(rows, name)) {
        this.logMessage(log, name, `nenhum dispositivo encontrado na rota clocks/1.`);
        return [];
      }

      // this.logMessage(log, name, `encontrados ${rows.length} dispositivos cadastrados.`);
      return rows;
    } catch (error) {
      logger.error(name, `erro ao buscar dispositivos: ${error.message}`);
      return [];
    }
  };

  static clocksRoute2 = async (enableLog = 'n') => {
    const name = this.clocksRoute2.name;
    const log = this.getLogValue(enableLog);

    try {
      //this.logMessage(log, name, `obtendo dispositivos no banco de dados.`);

      const query = `select a.* from vw_clocks_route2 a`;

      const rows = await this.queryDB(query);
      if (!this.validateArray(rows, name)) {
        this.logMessage(log, name, `nenhum dispositivo encontrado na rota clocks/2.`);
        return [];
      }

      //this.logMessage(log, name, `encontrados ${rows.length} dispositivos cadastrados.`);
      return rows;
    } catch (error) {
      logger.error(name, `erro ao buscar dispositivos: ${error.message}`);
      return [];
    }
  };

  static clocksRoute3 = async (enableLog = 'n') => {
    const name = this.clocksRoute3.name;
    const log = this.getLogValue(enableLog);

    try {
      // this.logMessage(log, name, `obtendo dispositivos no banco de dados.`);

      const query = `select a.* from vw_clocks_route3 a`;

      const rows = await this.queryDB(query);
      if (!this.validateArray(rows, name)) {
        this.logMessage(log, name, `nenhum dispositivo encontrado na rota clocks/3.`);
        return [];
      }

      //this.logMessage(log, name, `encontrados ${rows.length} dispositivos cadastrados.`);
      return rows;
    } catch (error) {
      logger.error(name, `erro ao buscar dispositivos: ${error.message}`);
      return [];
    }
  };
}

module.exports = { SqlLiteService };
