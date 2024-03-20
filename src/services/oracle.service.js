require('dotenv').config({ path: '../../.env' });
const oracledb = require('oracledb');
const log4js = require('log4js');

log4js.configure({
  appenders: { console: { type: 'console' } },
  categories: { default: { appenders: ['console'], level: 'info' } }
});
const logger = log4js.getLogger('LOG');

const ENV_VARS = {
  ORACLE_LIB_DIR: process.env.ORACLE_LIB_DIR,
  ORACLE_CONNECTION_STRING: process.env.ORACLE_CONNECTION_STRING,
  ORACLE_USER: process.env.ORACLE_USER,
  ORACLE_PASSWORD: process.env.ORACLE_PASSWORD
};

class OracleService {
  static async initOracleClient() {
    try {
      await oracledb.initOracleClient({ libDir: ENV_VARS.ORACLE_LIB_DIR });
    } catch (error) {
      logger.error('OracleService', 'initOracleClient', error);
      throw error;
    }
  }

  static async connect() {
    try {
      await this.initOracleClient();
      const propsConnect = {
        connectionString: ENV_VARS.ORACLE_CONNECTION_STRING,
        user: ENV_VARS.ORACLE_USER,
        password: ENV_VARS.ORACLE_PASSWORD
      };

      return await oracledb.getConnection(propsConnect);
    } catch (error) {
      logger.error('OracleService', 'connect', error);
      throw error;
    }
  }

  static async close(connection) {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        logger.error('OracleService', 'close', err);
        throw err;
      }
    }
  }
}

exports.OracleService = OracleService;
