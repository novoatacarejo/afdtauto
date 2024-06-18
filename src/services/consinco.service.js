const { assembleArrayObjects } = require('../utils');
const { OracleService } = require('./oracle.service');
const { getLogger } = require('log4js');
let logger = getLogger('LOG');

const SERVICE_NAME = 'ConsincoService';

class ConsincoService {
  static async getStationsInfo() {
    try {
      const columnsName = [
        { name: 'codFilial' },
        { name: 'empresa' },
        { name: 'empresaDir' },
        { name: 'piso' },
        { name: 'item' },
        { name: 'ip' },
        { name: 'ipFinal' },
        { name: 'userName' },
        { name: 'userPass' },
        { name: 'portaria' }
      ];

      const client = await OracleService.connect();

      const sql = `SELECT CODFILIAL, EMPRESA, EMPRESADIR, PISO, TO_NUMBER(ITEM) AS ITEM, IP, TO_NUMBER(IPFINAL) AS IPFINAL, USERNAME, USERPASS, TO_NUMBER(PORTARIA) AS PORTARIA FROM WFM_DEV.DEV_VW_RM_DEVICES WHERE 1 = 1 AND CODFILIAL NOT IN (1, 8, 18, 38)`;

      const response = await client.execute(sql);

      const products = assembleArrayObjects(columnsName, response.rows);

      await OracleService.close(client);

      return products;
    } catch (error) {
      logger.error(`[${SERVICE_NAME}][getStationsInfo][error]\n`, error);
    }
  }

  static async getPunchesByHour() {
    try {
      const punchName = [{ name: 'codPessoa' }, { name: 'punchTime' }];

      const client = await OracleService.connect();

      const sql = `SELECT CODPESSOA, PUNCHTIME FROM WFM_DEV.DEV_VW_DATE_TEST`;

      const response = await client.execute(sql);

      const punches = assembleArrayObjects(punchName, response.rows);

      await OracleService.close(client);

      return punches;
    } catch (error) {
      logger.error(`[${SERVICE_NAME}][getPunchesByHour][error]\n`, error);
    }
  }

  static async getCodPessoa(idt, lng) {
    try {
      const client = await OracleService.connect();

      const tp = lng === 50 ? `CPF` : lng === 38 ? `PIS` : ``;
      const newId = new String(idt);

      const sql = `SELECT CODPESSOA FROM WFM_DEV.DEV_RM_CODPESSOA H WHERE 1 = 1 AND ${tp} = '${newId}'`;

      const response1 = await client.execute(sql);

      const employeeId = new String(response1.rows);

      await OracleService.close(client);

      return employeeId;
    } catch (error) {
      logger.error(`[${SERVICE_NAME}][getCodPessoa][error]\n`, error);
    }
  }

  static async insertAfd(data) {
    try {
      const client = await OracleService.connect();
      if (!data.codpessoa) {
        logger.info(`[${SERVICE_NAME}][insertAfd][no data] - Usuario sem codpessoa]: ${data}`);
      } else {
        const sql = `INSERT INTO WFM_DEV.DEV_AFD (DTAGERACAO, CODPESSOA, PUNCH) VALUES ( SYSDATE, :a, TO_DATE( :b, 'YYYY-MM-DD HH24:MI:SS') )`;

        const bind = [data.codpessoa, data.punch];

        const options = { autoCommit: true };

        const response = await client.execute(sql, bind, options);

        logger.info(
          `[${SERVICE_NAME}][insertAfd][inserting] - ${response.rowsAffected} row succeded. RowId ${response.lastRowid}`
        );

        await OracleService.close(client);
      }
    } catch (error) {
      logger.error(`[${SERVICE_NAME}][insertAfd][error]\n`, error);
    }
  }

  static async insertOne(data) {
    try {
      const client = await OracleService.connect();

      client.callTimeout = 10 * 1000;

      if (!data.idNumber) {
        logger.info(`[${SERVICE_NAME}][insertOne][no data] - Usuario sem codpessoa]: ${data}`);
      } else {
        const sql = `INSERT INTO WFM_DEV.DEV_RM_AFD (DTAGERACAO, IDNUMBER, IDLENGTH, PUNCH) VALUES ( SYSDATE, :a, :b, TO_DATE( :c, 'YYYY-MM-DD HH24:MI:SS') )`;

        const bind = {
          a: data.idNumber,
          b: parseInt(data.idLength),
          c: data.punch
        };

        const options = {
          autoCommit: true,
          fetchArraySize: 100,
          poolMax: 25,
          poolMin: 5,
          poolIncrement: 5,
          poolTimeout: 1800,
          poolPingInterval: 300
        };

        const response = await client.execute(sql, bind, options);

        logger.info(
          `[${SERVICE_NAME}][insertOne][inserting] - ${response.rowsAffected} row succeded. RowId ${response.lastRowid}`
        );

        await OracleService.close(client);
      }
    } catch (error) {
      logger.error(`[${SERVICE_NAME}][insertOne][error]\n`, error);
    }
  }

  static async deleteDuplicates() {
    try {
      const client = await OracleService.connect();

      client.callTimeout = 10 * 1000;

      const sql = `
      BEGIN \
          DELETE FROM DEV_RM_AFD A \
          WHERE 1 = 1 \
          AND NOT EXISTS ( \
                SELECT 1 \
                FROM (SELECT IDNUMBER, \
                              TRUNC(PUNCH) AS DTABATIDA, \
                              HHMM, \
                              COUNT(*) AS QTD_ROWS, \
                              MIN(T.ROWID) AS MINROWID \
                        FROM DEV_RM_AFD T \
                        GROUP BY IDNUMBER, TRUNC(PUNCH), HHMM) B \
                WHERE 1 = 1 \
                AND B.MINROWID = A.ROWID); \
          COMMIT; \
      END;`;

      const response = await client.execute(sql);

      logger.info(`[${SERVICE_NAME}][deleteDuplicates][deleting] - eliminate duplicate rows from WFM_DEV.DEV_RM_AFD]`);

      await OracleService.close(client);

      logger.info(`[${SERVICE_NAME}][deleteDuplicates][end] - Finished!`);

      return response;
    } catch (error) {
      logger.error(`[${SERVICE_NAME}]['deleteDuplicates'][error]\n`, error);
    }
  }

  static async insertMany(data) {
    try {
      var content = [];

      const client = await OracleService.connect();

      client.callTimeout = 10 * 1000;

      const sql = `INSERT INTO WFM_DEV.DEV_RM_AFD (DTAGERACAO, IDNUMBER, IDLENGTH, PUNCH) VALUES ( SYSDATE, :a, :b, TO_DATE( :c, 'YYYY-MM-DD HH24:MI:SS') )`;

      for (let i = 0; i < data.length; i++) {
        var temp = [];
        temp.push(data[i].idNumber);
        temp.push(parseInt(data[i].idLength));
        temp.push(data[i].punch);
        content.push(temp);
      }

      const options = {
        autoCommit: true,
        fetchArraySize: 100,
        poolMax: 25,
        poolMin: 5,
        poolIncrement: 5,
        poolTimeout: 1800,
        poolPingInterval: 300
      };

      const response = await client.executeMany(sql, content, options);

      logger.info(`[${SERVICE_NAME}][insertMany][inserting] - Rows qtd: ${data.length}`);

      await OracleService.close(client);

      return response;
    } catch (error) {
      logger.error(`[${SERVICE_NAME}][insertMany][error]\n`, error);
    }
  }
}

exports.ConsincoService = ConsincoService;
