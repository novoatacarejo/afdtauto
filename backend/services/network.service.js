require('dotenv').config('../../.env');
const { currentDateHour, getLogValue } = require('../utils/Utils.js');
const { SqlLiteService } = require('./sqlite.service.js');
const { Logger } = require('../middleware/Logger.middleware.js');

const SERVICE_NAME = 'NetworkService';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('application');

class NetworkService {
  static validateArray(data, name) {
    if (!Array.isArray(data)) {
      logger.error(name, 'Os dados não são um array. Retornando um array vazio.');
      return [];
    }
    return data;
  }

  static logMessage(log, name, message) {
    if (log === 1) {
      logger.info(name, message);
    }
  }

  static getClocksInfo = async (enableLog = 'n') => {
    const name = this.getClocksInfo.name;
    const log = getLogValue(enableLog);

    try {
      // this.logMessage(log, name, `obtendo dispositivos da tabela "clocks" no banco de dados.`);

      const query = `SELECT nroEmpresa, ip, nomeEmpresa FROM clocks`;

      const rows = await SqlLiteService.queryDB(query);
      if (!this.validateArray(rows, name)) {
        this.logMessage(log, name, `nenhum dispositivo encontrado na tabela "clocks".`);
        return [];
      }

      // this.logMessage(log, name, `Encontrados ${rows.length} dispositivos na tabela "clocks".`);
      return rows;
    } catch (error) {
      logger.error(name, `Erro ao buscar dispositivos: ${error.message}`);
      return [];
    }
  };

  static testConnection = async (enableLog = 'n') => {
    const name = this.testConnection.name;
    const log = getLogValue(enableLog);

    try {
      const clocks = await this.getClocksInfo(log);
      if (!this.validateArray(clocks, name)) return;

      const testResults = [];

      //this.logMessage(log, name, `Iniciando testes de conectividade para ${clocks.length} dispositivos.`);

      for (const device of clocks) {
        const { ip } = device;
        const isOnline = await this.isDeviceOnline(ip, log);

        testResults.push([
          ip,
          isOnline ? 'online' : 'offline',
          currentDateHour(),
          isOnline ? null : 'SOCKET_ERROR',
          isOnline ? null : 'Falha ao conectar ao dispositivo'
        ]);
      }

      if (testResults.length > 0) {
        const tableName = 'clocksStatus';
        const columns = ['ip', 'status', 'lastSyncTime', 'errorCode', 'errorMessage'];

        await SqlLiteService.bulkInsert(tableName, columns, testResults);

        // this.logMessage(log, name, `${testResults.length} resultados registrados.`);
      }

      // this.logMessage(log, name, `Testes de conectividade concluídos para todos os dispositivos.`);
    } catch (error) {
      logger.error(name, `Erro ao testar conectividade: ${error.message}`);
    }
  };

  static async isDeviceOnline(host, enableLog = 'n', port = 80) {
    const name = this.isDeviceOnline.name;
    const log = getLogValue(enableLog);

    try {
      return new Promise((resolve) => {
        const net = require('net');
        const socket = new net.Socket();

        const timeout = 5000;
        socket.setTimeout(timeout);

        socket.connect(port, host, () => {
          //this.logMessage(log, name, `[online] - ${host}:${port}`);
          socket.destroy();
          resolve(true);
        });

        socket.on('error', (err) => {
          //this.logMessage(log, name, `[offline] - ${host}:${port} - ${err.message}`);
          socket.destroy();
          resolve(false);
        });

        socket.on('timeout', () => {
          //this.logMessage(log, name, `[offline] - ${host}:${port}`);
          socket.destroy();
          resolve(false);
        });
      });
    } catch (error) {
      logger.error(name, `erro ao verificar conectividade: ${error.message}`);
      return false;
    }
  }
}

module.exports = { NetworkService };
