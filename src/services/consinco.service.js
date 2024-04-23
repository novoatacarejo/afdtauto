const { assembleArrayObjects } = require('../utils');
const { OracleService } = require('./oracle.service');
const { getLogger } = require('log4js');
let logger = getLogger('LOG');

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

const punchName = [{ name: 'codPessoa' }, { name: 'punchTime' }];

const CONSINCO_SERVICE_NAME = 'ConsincoService';

class ConsincoService {
  static getStationsInfo = async () => {
    try {
      const client = await OracleService.connect();

      const sql = `SELECT CODFILIAL,
       EMPRESA,
       EMPRESADIR,
       PISO,
       TO_NUMBER(ITEM) AS ITEM,
       IP,
       TO_NUMBER(IPFINAL) AS IPFINAL,
       USERNAME,
       USERPASS,
       TO_NUMBER(PORTARIA) AS PORTARIA
       FROM
       WFM_DEV.DEV_VW_RM_DEVICES
       WHERE 1 = 1
       AND CODFILIAL NOT IN (1)
       -- and nroempresa = 33
       AND IP NOT IN ('192.168.26.81', '192.168.17.80', '10.1.10.80','192.168.4.81')`;

      const response = await client.execute(sql);

      const products = assembleArrayObjects(columnsName, response.rows);

      await OracleService.close(client);

      return products;
    } catch (error) {
      logger.error(CONSINCO_SERVICE_NAME, 'getStationsInfo', error);
    }
  };

  static getPunchesByHour = async () => {
    try {
      const client = await OracleService.connect();

      const sql = `SELECT CODPESSOA, PUNCHTIME FROM WFM_DEV.DEV_VW_DATE_TEST`;

      const response = await client.execute(sql);

      const punches = assembleArrayObjects(punchName, response.rows);

      await OracleService.close(client);

      return punches;
    } catch (error) {
      logger.error(CONSINCO_SERVICE_NAME, 'getPunchesByHour', error);
    }
  };

  static getCodPessoa = async (idt, lng) => {
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
      logger.error(CONSINCO_SERVICE_NAME, 'getCodPessoa', error);
    }
  };

  static insertAfd = async (data) => {
    try {
      const client = await OracleService.connect();
      if (!data.codpessoa) {
        logger.info(`[WARNING - Usuario sem codpessoa]: ${data}`);
      } else {
        const sql = `INSERT INTO WFM_DEV.DEV_AFD (DTAGERACAO, CODPESSOA, PUNCH) VALUES ( SYSDATE, :a, TO_DATE( :b, 'YYYY-MM-DD HH24:MI:SS') )`;

        const bind = [data.codpessoa, data.punch];

        const options = { autoCommit: true };

        const response = await client.execute(sql, bind, options);

        logger.info(`[INSERTING] ${response.rowsAffected} row succeded. RowId ${response.lastRowid}`);

        await OracleService.close(client);
      }
    } catch (error) {
      logger.error(CONSINCO_SERVICE_NAME, 'insertAfd', error);
    }
  };

  static insertwfmDevAfd = async (data) => {
    try {
      const client = await OracleService.connect();

      client.callTimeout = 10 * 1000;

      if (!data.idNumber) {
        logger.info(`[WARNING - Usuario sem codpessoa]: ${data}`);
      } else {
        const sql = `INSERT INTO WFM_DEV.DEV_RM_AFD (DTAGERACAO, IDNUMBER, IDLENGTH, PUNCH) VALUES ( SYSDATE, :a, :b, TO_DATE( :c, 'YYYY-MM-DD HH24:MI:SS') )`;

        const bind = {
          a: data.idNumber,
          b: parseInt(data.idLength),
          c: data.punch
        };

        const options = {
          autoCommit: true,
          poolMax: 25,
          poolMin: 5,
          poolIncrement: 5,
          poolTimeout: 1800,
          poolPingInterval: 300
        };

        const response = await client.execute(sql, bind, options);

        logger.info(`[INSERTING] ${response.rowsAffected} row succeded. RowId ${response.lastRowid}`);

        await OracleService.close(client);
      }
    } catch (error) {
      logger.error(CONSINCO_SERVICE_NAME, 'insertDevRmAfd', error);
    }
  };
}

exports.ConsincoService = ConsincoService;
