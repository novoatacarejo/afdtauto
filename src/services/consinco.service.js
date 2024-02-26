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
       ITEM,
       IP,
       IPFINAL,
       USERNAME,
       USERPASS,
       PORTARIA
       FROM WFM_DEV.DEV_VW_RM_DEVICES
       WHERE 1=1
       AND CODFILIAL NOT IN (1)
       ORDER BY 1
       -- FETCH FIRST 1 ROWS ONLY
       `;

      const response = await client.execute(sql);

      const products = assembleArrayObjects(columnsName, response.rows);

      return products;
    } catch (error) {
      logger.error(CONSINCO_SERVICE_NAME, error);
    }
  };
}

exports.ConsincoService = ConsincoService;
