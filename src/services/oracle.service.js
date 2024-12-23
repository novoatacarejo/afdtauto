require('dotenv').config({ path: '../../.env' });
const oracledb = require('oracledb');
const Logger = require('../middleware/Logger.middleware.js');

const SERVICE_NAME = 'OracleService';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('application');

const { ORACLE_LIB_DIR, ORACLE_CONNECTION_STRING, ORACLE_USER, ORACLE_PASSWORD } = process.env;

class OracleService {
  static async initOracleClient() {
    const name = this.initOracleClient.name;
    try {
      await oracledb.initOracleClient({ libDir: ORACLE_LIB_DIR });
    } catch (err) {
      logger.error(name, err);
      throw err;
    }
  }

  static async connect() {
    const name = this.connect.name;
    try {
      await this.initOracleClient();
      const propsConnect = {
        connectionString: ORACLE_CONNECTION_STRING,
        user: ORACLE_USER,
        password: ORACLE_PASSWORD
      };

      return await oracledb.getConnection(propsConnect);
    } catch (err) {
      logger.error(name, err);
      throw err;
    }
  }

  static async close(connection) {
    const name = this.close.name;
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        logger.error(name, err);
        throw err;
      }
    }
  }
}

OracleService.BIND_OUT = oracledb.BIND_OUT;
OracleService.NUMBER = oracledb.NUMBER;

module.exports = { OracleService };
