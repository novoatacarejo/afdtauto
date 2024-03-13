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
      const client = await OracleService.connect();

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
       AND CODFILIAL NOT IN (1,8,18)
       ORDER BY 1
       -- FETCH FIRST 4 ROWS ONLY
       `;

      const response = await client.execute(sql0);

      const products = assembleArrayObjects(columnsName, response.rows);

      return products;
    } catch (error) {
      logger.error(CONSINCO_SERVICE_NAME, error);
    }
  };

  static getCodPessoa = async (idt, lng) => {
    try {
      const client = await OracleService.connect();

      const tp = lng === 50 ? `CPF` : lng === 38 ? `PISPASEP` : ``;
      const codpessoa = new String(idt);

      const sql = `SELECT CODPESSOA FROM WFM_DEV.DEV_RM_FUNCIONARIO H WHERE 1 = 1 AND FILIALRM NOT IN (1,8,18) AND ${tp} = '${codpessoa}'`;

      const response1 = await client.execute(sql);

      const employeeId = new String(response1.rows);

      return employeeId;
    } catch (error) {
      logger.error(CONSINCO_SERVICE_NAME, error);
    }
  };

  static insertAfd = async (data) => {
    try {
      const client = await OracleService.connect();

      const sql = `INSERT INTO
      WFM_DEV.DEV_AFD (DTAGERACAO, CODPESSOA, PUNCH)
      VALUES (
      SYSDATE,
      :CODPESSOA,
      TO_DATE(:PUNCH, 'YYYY-MM-DD HH24:MI:SS')
      )`;

      const response1 = await client.execute(sql, data, (err, result) => {
        if (err) {
          console.log(CONSINCO_SERVICE_NAME, err);
        } else {
          client.commit();
          return result;
        }
      });

      return response1;
    } catch (error) {
      logger.error(CONSINCO_SERVICE_NAME, error);
    }
  };

  static closeConnection = async () => {
    await client.close();
    return;
  };
}

exports.ConsincoService = ConsincoService;
