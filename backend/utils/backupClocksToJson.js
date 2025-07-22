import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });
import { currentDateHour, getLogValue } from './Utils.js';
import { SqlLiteService } from '../services/sqlite.service.js';
import { Logger } from '../middleware/Logger.middleware.js';
import fs from 'fs';

const SERVICE_NAME = 'backupClocksToJson';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('application');

const jsonFileOutput = process.env.CLOCKS_DB || 'clocks.json';

function validateArray(data, name) {
  if (!Array.isArray(data)) {
    logger.error(name, 'Os dados não são um array. Retornando um array vazio.');
    return [];
  }
  return data;
}

function logMessage(log, name, message) {
  if (log === 1) {
    logger.info(name, message);
  }
}

async function getClocksInfoExp(enableLog = 'n') {
  const name = getClocksInfoExp.name;
  const log = getLogValue(enableLog);

  try {
    const query = `SELECT * FROM clocks`;

    const rows = await SqlLiteService.queryDB(query);
    if (!validateArray(rows, name)) {
      logMessage(log, name, `nenhum dispositivo encontrado na tabela "clocks".`);
      return [];
    }

    logMessage(log, name, `Encontrados ${rows.length} dispositivos na tabela "clocks".`);
    return rows;
  } catch (error) {
    logger.error(name, `Erro ao buscar dispositivos: ${error.message}`);
    return [];
  }
}

logMessage('s', 'export', 'Iniciando exportação de dados dos dispositivos.', currentDateHour());

const clocks = await getClocksInfoExp('s');

if (!Array.isArray(clocks) || clocks.length === 0) {
  logger.error(SERVICE_NAME, 'Nenhum dispositivo encontrado para exportação.');
  process.exit(1);
}

// Converte os dados para JSON e salva em arquivo
fs.writeFile(jsonFileOutput, JSON.stringify(clocks, null, 2), (err) => {
  if (err) {
    console.error('Erro ao salvar arquivo JSON:', err.message);
  } else {
    console.log(`Exportação concluída. Arquivo salvo em: ${jsonFileOutput}`);
  }
});
