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
       AND CODFILIAL NOT IN (1)
       ORDER BY 1
       -- FETCH FIRST 4 ROWS ONLY
       `;

      const response = await client.execute(sql0);

      const products = assembleArrayObjects(columnsName, response.rows);

      await client.close();

      return products;
    } catch (error) {
      logger.error(CONSINCO_SERVICE_NAME, error);
    }
  };

  static getCodPessoa = async (idt, lng) => {
    try {
      const client1 = await OracleService.connect();

      const tp = lng === 50 ? `CPF` : lng === 38 ? `PISPASEP` : ``;
      const codpessoa = new String(idt);

      const sql1 = `SELECT CODPESSOA FROM WFM_DEV.DEV_RM_FUNCIONARIO H WHERE 1 = 1 AND FILIALRM NOT IN (1,8,18) AND ${tp} = '${codpessoa}'`;

      const response1 = await client1.execute(sql1);

      //await client1.close();

      const employeeId = new String(response1.rows);

      return employeeId;
    } catch (error) {
      console.log(idt, lng);
      console.log(CONSINCO_SERVICE_NAME, error);
    }
  };
}

exports.ConsincoService = ConsincoService;
