const { initOracleClient, getConnection } = require('oracledb');
const { getLogger } = require('log4js');
let logger = getLogger('LOG');

const ENV_VARS = {
  ORACLE_LIB_DIR: process.env.ORACLE_LIB_DIR,
  ORACLE_CONNECTION_STRING: process.env.ORACLE_CONNECTION_STRING,
  ORACLE_USER: process.env.ORACLE_USER,
  ORACLE_PASSWORD: process.env.ORACLE_PASSWORD
};

const ORACLE_SERVICE_NAME = 'OracleService';

class OracleService {
  static connection;

  static initOracleClient = async () => {
    try {
      const propsInitOracle = { configDir: ENV_VARS.ORACLE_LIB_DIR, libDir: ENV_VARS.ORACLE_LIB_DIR };

      initOracleClient(propsInitOracle);
    } catch (error) {
      logger.error(ORACLE_SERVICE_NAME, error);
    }
  };

  static connect = async () => {
    try {
      const propsConnect = {
        connectionString: ENV_VARS.ORACLE_CONNECTION_STRING,
        user: ENV_VARS.ORACLE_USER,
        password: ENV_VARS.ORACLE_PASSWORD
      };

      if (!this.connection) {
        this.connection = await getConnection(propsConnect);
      }

      return this.connection;
    } catch (error) {
      logger.error(ORACLE_SERVICE_NAME, error);
    }
  };
}

exports.OracleService = OracleService;
