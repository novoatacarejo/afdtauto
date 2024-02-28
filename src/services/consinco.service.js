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

      const sql = `SELECT
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

      const response = await client.execute(sql);

      const products = assembleArrayObjects(columnsName, response.rows);

      return products;
    } catch (error) {
      logger.error(CONSINCO_SERVICE_NAME, error);
    }
  };

  static getCodPessoa = async (idt, lng) => {
    try {
      const client = await OracleService.connect();
      const tp = lng === 50 ? `H.CPF` : lng === 38 ? `H.PISPASEP` : ``;

      const sql = `SELECT H.CODPESSOA
      FROM WFM_DEV.DEV_RM_FUNCIONARIO H
      WHERE 1 = 1
      AND H.FILIALRM NOT IN (1,8,18)
      AND ${tp} = '${idt}'
      --FETCH FIRST 5 ROWS ONLY
      `;

      const response = await client.execute(sql);

      console.log(response);

      const codPessoa = assembleArrayObjects(columnsName, response.rows);

      return codPessoa;
    } catch (error) {
      logger.error(CONSINCO_SERVICE_NAME, error);
    }
  };
}

exports.ConsincoService = ConsincoService;
