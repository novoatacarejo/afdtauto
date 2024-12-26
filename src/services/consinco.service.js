const { assembleArrayObjects, getLogValue, totalRecords } = require('../utils/Utils.js');
const { OracleService } = require('./oracle.service.js');
const Logger = require('../middleware/Logger.middleware.js');

const SERVICE_NAME = 'ConsincoService';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('application');
class ConsincoService {
  static async getStationsInfo() {
    const name = this.getStationsInfo.name;
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
      logger.error(name, error);
    }
  }

  static async getPunchesByHour(enableLog = 'n') {
    const name = this.getPunchesByHour.name;
    const log = getLogValue(enableLog);

    try {
      const punchName = [{ name: 'codPessoa' }, { name: 'punchTime' }];

      const client = await OracleService.connect();

      const sql = `SELECT CODPESSOA, PUNCHTIME FROM WFM_DEV.DEV_VW_DATE_TEST`;

      const response = await client.execute(sql);

      const punches = assembleArrayObjects(punchName, response.rows);

      await OracleService.close(client);

      logger.info(name, totalRecords(punches, log));

      return punches;
    } catch (error) {
      logger.error(name, error);
    }
  }

  static async getPunchesByDate(date, enableLog = 'n') {
    const name = this.getPunchesByDate.name;
    const log = getLogValue(enableLog);

    try {
      const punchName = [{ name: 'codPessoa' }, { name: 'punchTime' }];

      const client = await OracleService.connect();

      const sql = `SELECT
                    A.CODPESSOA,
                    TO_CHAR(A.PUNCH, 'YYYY-MM-DD HH24:MI') AS PUNCHTIME
              FROM
                  WFM_DEV.DEV_RM_AFD         A,
                  WFM_DEV.DEV_RM_CODPESSOA    B,
                  WFM_DEV.DEV_RM_DEPARTAMENTO C
              WHERE 1 = 1
              AND A.CODPESSOA = B.CODPESSOA
              AND B.FILIALRM = C.FILIALRM
              AND B.CODDEPTRM = C.CODDEPTRM
              --AND C.INTEGRA_WFM = 1
              AND TO_DATE(A.DTABATIDA,'DD/MM/YYYY') = :a`;

      const bind = [date];

      const response = await client.execute(sql, bind);

      const punches = assembleArrayObjects(punchName, response.rows);

      await OracleService.close(client);

      logger.info(name, totalRecords(punches, log));

      return punches;
    } catch (error) {
      logger.error(name, error);
    }
  }

  static async getCodPessoa(idt) {
    const name = this.getCodPessoa.name;
    try {
      const client = await OracleService.connect();

      const newId = new String(idt);

      const sql = `SELECT CODPESSOA FROM WFM_DEV.DEV_RM_CODPESSOA H WHERE 1 = 1 AND CODPESSOA = '${newId}'`;

      const response1 = await client.execute(sql);

      const employeeId = new String(response1.rows);

      await OracleService.close(client);

      return employeeId;
    } catch (error) {
      logger.error(name, error);
    }
  }

  static async insertAfd(data) {
    const name = this.insertAfd.name;
    try {
      const client = await OracleService.connect();
      if (!data.codpessoa) {
        logger.info(name, `no data-usuario sem codpessoa: ${data}`);
      } else {
        const sql = `INSERT INTO WFM_DEV.DEV_AFD (DTAGERACAO, CODPESSOA, PUNCH) VALUES ( SYSDATE, :a, TO_DATE( :b, 'YYYY-MM-DD HH24:MI:SS') )`;

        const bind = [data.codpessoa, data.punch];

        const options = { autoCommit: true };

        const response = await client.execute(sql, bind, options);

        logger.info(name, `inserting ${response.rowsAffected} row succeded. rowId ${response.lastRowid}`);

        await OracleService.close(client);
      }
    } catch (error) {
      logger.error(name, error);
    }
  }

  static async insertOne(data) {
    const name = this.insertOne.name;
    try {
      const client = await OracleService.connect();

      client.callTimeout = 10 * 1000;

      if (!data.idNumber) {
        logger.info(name, `no data-usuario sem codpessoa: ${data}`);
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

        logger.info(name, `inserting ${response.rowsAffected} row succeded. rowId ${response.lastRowid}`);

        await OracleService.close(client);
      }
    } catch (error) {
      logger.error(name, error);
    }
  }

  /* static async deleteDuplicates(enableLog) {
    const name = this.deleteDuplicates.name;
    const log = getLogValue(enableLog);

    try {
      const client = await OracleService.connect();

      client.callTimeout = 60 * 1000;

      const sql = `
      BEGIN \
            DELETE \
            FROM DEV_RM_AFD A \
            WHERE 1 = 1  \
            AND A.DTABATIDA = TRUNC(SYSDATE) \
            AND NOT EXISTS \
            (SELECT 1 \
                  FROM (SELECT IDNUMBER, DTABATIDA, HHMM, MIN(T.ROWID) AS MINROWID \
                        FROM DEV_RM_AFD T \
                        WHERE 1 = 1 \
                        AND T.DTABATIDA = A.DTABATIDA \
                        AND T.IDNUMBER = A.IDNUMBER \
                        AND T.HHMM = A.HHMM \
                        AND T.DTABATIDA = TRUNC(SYSDATE) \
                        GROUP BY IDNUMBER, DTABATIDA, HHMM) B \
                  WHERE 1 = 1 \
                  AND B.MINROWID = A.ROWID) \
            OR A.CODPESSOA IS NULL; \
          COMMIT; \
      END;`;

      const response = await client.execute(sql);

      logger.info(name, `deleted duplicates`);

      await OracleService.close(client);

      log === 1 ? logger.info(name, `delete finished!`) : null;

      return response;
    } catch (error) {
      logger.error(name, error);
    }
  } */

  //
  static async deleteDuplicates(date, enableLog = 'n') {
    const name = this.deleteDuplicates.name;
    const log = getLogValue(enableLog);

    try {
      const client = await OracleService.connect();

      client.callTimeout = 60 * 1000;

      const sql = `
      BEGIN \
            DELETE \
            FROM DEV_RM_AFD A \
            WHERE 1 = 1  \
            AND A.DTABATIDA = TO_DATE(:a,'DD/MM/YYYY') \
            AND NOT EXISTS \
            (SELECT 1 \
                  FROM (SELECT IDNUMBER, DTABATIDA, HHMM, MIN(T.ROWID) AS MINROWID \
                        FROM DEV_RM_AFD T \
                        WHERE 1 = 1 \
                        AND T.DTABATIDA = A.DTABATIDA \
                        AND T.IDNUMBER = A.IDNUMBER \
                        AND T.HHMM = A.HHMM \
                        AND T.DTABATIDA = TO_DATE(:b,'DD/MM/YYYY') \
                        GROUP BY IDNUMBER, DTABATIDA, HHMM) B \
                  WHERE 1 = 1 \
                  AND B.MINROWID = A.ROWID) \
            OR A.CODPESSOA IS NULL; \
          COMMIT; \
      END;`;

      const binds = {
        a: date,
        b: date
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

      const response = await client.execute(sql, binds, options);

      logger.info(name, `deleted duplicates from ${date}`);

      await OracleService.close(client);

      log === 1 ? logger.info(name, `delete from ${date} finished!`) : null;

      return response;
    } catch (error) {
      logger.error(name, error);
    }
  }

  static async deleteDuplicatesRows(enableLog) {
    const name = this.deleteDuplicatesRows.name;
    const log = getLogValue(enableLog);

    try {
      const client = await OracleService.connect();

      client.callTimeout = 10 * 1000;

      const sql = `
      DECLARE
          rows_deleted NUMBER;
      BEGIN
          DELETE FROM DEV_RM_AFD A
          WHERE 1 = 1
          AND NOT EXISTS (
                SELECT 1
                FROM (SELECT IDNUMBER,
                              TRUNC(PUNCH) AS DTABATIDA,
                              HHMM,
                              COUNT(*) AS QTD_ROWS,
                              MIN(T.ROWID) AS MINROWID
                        FROM DEV_RM_AFD T
                        GROUP BY IDNUMBER, TRUNC(PUNCH), HHMM) B
                WHERE 1 = 1
                AND B.MINROWID = A.ROWID);
                
          rows_deleted := SQL%ROWCOUNT;

          COMMIT;
          :rows_deleted := rows_deleted;
      END;`;

      const binds = {
        rows_deleted: { dir: OracleService.BIND_OUT, type: OracleService.NUMBER }
      };

      const response = await client.execute(sql, binds);

      log === 1
        ? logger.info(name, `eliminated ${response.outBinds.rows_deleted} duplicate rows from DEV_RM_AFD`)
        : null;

      await OracleService.close(client);

      return response.outBinds.rows_deleted;
    } catch (error) {
      logger.error(name, error);
    }
  }

  static async insertMany(data, enableLog = 'n') {
    const name = this.insertMany.name;
    const log = getLogValue(enableLog);

    try {
      var content = [];

      const client = await OracleService.connect();

      client.callTimeout = 60 * 1000;

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

      log === 1 ? logger.info(name, `inserting rows: ${data.length}`) : null;

      await OracleService.close(client);

      return response;
    } catch (error) {
      logger.error(name, error);
    }
  }
}

module.exports = { ConsincoService };
