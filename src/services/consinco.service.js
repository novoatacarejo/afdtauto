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

const CONSINCO_SERVICE_NAME = 'ConsincoService';

class ConsincoService {
  static getStationsInfo = async () => {
    try {
      const client0 = await OracleService.connect();

      const sql0 = `SELECT
       CODFILIAL,
       EMPRESA,
       EMPRESADIR,
       PISO,
       TO_NUMBER(ITEM) AS ITEM,
       IP,
       TO_NUMBER(IPFINAL) AS IPFINAL,
       USERNAME,
       USERPASS,
       TO_NUMBER(PORTARIA) AS PORTARIA
       FROM WFM_DEV.DEV_VW_RM_DEVICES
       WHERE 1=1
       --AND CODFILIAL NOT IN (1,8,18)
       ORDER BY 1
       -- FETCH FIRST 4 ROWS ONLY
       `;

      const response0 = await client0.execute(sql0);

      const products = assembleArrayObjects(columnsName, response0.rows);

      return products;
    } catch (error) {
      logger.error(CONSINCO_SERVICE_NAME, 'getStationsInfo', error);
    }
  };

  static getCodPessoa = async (idt, lng) => {
    try {
      const client1 = await OracleService.connect();

      const tp = lng === 50 ? `CPF` : lng === 38 ? `PIS` : ``;
      const newId = new String(idt);

      const sql1 = `SELECT CODPESSOA FROM WFM_DEV.DEV_RM_CODPESSOA H WHERE 1 = 1 AND ${tp} = '${newId}'`;

      const response1 = await client1.execute(sql1);

      const employeeId = new String(response1.rows);

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
      }
    } catch (error) {
      logger.error(CONSINCO_SERVICE_NAME, 'insertAfd', error);
    }
  };

  /*

let sql = "INSERT ALL \n" +
              "  INTO nodb_tab_ia1 (id, content) VALUES (100, :a) \n" +
              "  INTO nodb_tab_ia1 (id, content) VALUES (200, :b) \n" +
              "  INTO nodb_tab_ia1 (id, content) VALUES (300, :c) \n" +
              "SELECT * FROM DUAL";
    let result = await conn.execute(
      sql,
      ['Changjie', 'Shelly', 'Chris']
    );
  */

  static insertAllAfd = async (data) => {
    try {
      const client = await OracleService.connect();

      //const sql = `INSERT ALL INTO WFM_DEV.DEV_AFD (DTAGERACAO, CODPESSOA, PUNCH) VALUES ( SYSDATE, :a, TO_DATE( :b, 'YYYY-MM-DD HH24:MI:SS') )`;

      const options = { autoCommit: true };

      let sql = 'INSERT ALL \n';
      let bindParams = [];
      for (let i = 0; i < data.length; i++) {
        sql += `  INTO WFM_DEV.DEV_AFD (DTAGERACAO, CODPESSOA, PUNCH) VALUES ( SYSDATE, :a${i}, TO_DATE(:b${i}, 'YYYY-MM-DD HH24:MI:SS') ) \n`;

        let codpessoa = data[i].punch.cardId;
        let punch = data[i].punch.punchUserTimestamp;

        bindParams.push([codpessoa, punch]);
      }
      sql += 'SELECT * FROM DUAL';

      console.log(bindParams);

      console.log(sql);

      const result = await client.execute(sql, bindParams, options);
      console.log(result);
    } catch (error) {
      logger.error(CONSINCO_SERVICE_NAME, 'insertAllAfd', error);
    }
  };
}

exports.ConsincoService = ConsincoService;
