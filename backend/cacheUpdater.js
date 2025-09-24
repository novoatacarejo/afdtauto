const redisClient = require('./services/redis.service.js');
const { WFMDevService, SqlLiteService } = require('./services/index.service.js');
const { Logger } = require('./middleware/Logger.middleware.js');

const SERVICE_NAME = 'CacheUpdater';

let logger = new Logger();
logger.service = SERVICE_NAME;
logger.configureDirLogService('cacheUpdater');

// Atualiza cache de chart3
async function updateChart3Cache() {
  const date = new Date().toISOString().split('T')[0]; // ou defina a data conforme sua lógica
  const cacheKey = `chart3:${date}`;
  try {
    const result = await WFMDevService.getAfdRtAllPunches(date, 'n');
    await redisClient.set(cacheKey, JSON.stringify(result), { EX: 5 });
    logger.info(SERVICE_NAME, `[cacheUpdater] chart3 atualizado`);
  } catch (err) {
    logger.error(SERVICE_NAME, '[cacheUpdater] chart3', err);
  }
}

// Atualiza cache de table1
async function updateTable1Cache() {
  const date = new Date().toISOString().split('T')[0];
  const cacheKey = `table1:${date}`;
  try {
    const result = await WFMDevService.getAfdRtPunches(date, 'n');
    await redisClient.set(cacheKey, JSON.stringify(result), { EX: 5 });
    logger.info(SERVICE_NAME, `[cacheUpdater] table1 atualizado`);
  } catch (err) {
    logger.error(SERVICE_NAME, '[cacheUpdater] table1', err);
  }
}

// Atualiza cache de table3
async function updateTable3Cache() {
  const cacheKey = `table3`;
  try {
    const sql = `SELECT a.loja, ip, ultima_hora, hoje, ultimos_7_dias, ultimos_15_dias, ultimos_30_dias, ultima_verificacao FROM clocks_vw_fato_falhas a`;
    const result = await SqlLiteService.queryDB(sql, []);
    await redisClient.set(cacheKey, JSON.stringify(result), { EX: 600 });
    logger.info(SERVICE_NAME, `[cacheUpdater] table3 atualizado`);
  } catch (err) {
    logger.error(SERVICE_NAME, '[cacheUpdater] table3', err);
  }
}

// Atualiza cache de clock1/2/3
async function updateClockCache() {
  try {
    const result1 = await SqlLiteService.clocksRoute1('n');
    await redisClient.set('clock1', JSON.stringify(result1), { EX: 5 });
    const result2 = await SqlLiteService.clocksRoute2('n');
    await redisClient.set('clock2', JSON.stringify(result2), { EX: 5 });
    const result3 = await SqlLiteService.clocksRoute3('n');
    await redisClient.set('clock3', JSON.stringify(result3), { EX: 5 });
    logger.info(SERVICE_NAME, `[cacheUpdater] clocks atualizados`);
  } catch (err) {
    logger.error(SERVICE_NAME, '[cacheUpdater] clocks', err);
  }
}

// Job principal
async function updateAllCache() {
  const start = Date.now();
  logger.info(SERVICE_NAME, `[cacheUpdater] Início ciclo: ${new Date().toLocaleString()}`);
  await updateChart3Cache();
  await updateTable1Cache();
  await updateTable3Cache();
  await updateClockCache();
  const end = Date.now();
  const duration = ((end - start) / 1000).toFixed(2);
  const mem = process.memoryUsage();
  const cpu = process.cpuUsage();
  logger.info(SERVICE_NAME, `[cacheUpdater] Fim ciclo: ${new Date().toLocaleString()} | Duração: ${duration}s`);
  logger.info(
    SERVICE_NAME,
    `[cacheUpdater] Memória: RSS ${(mem.rss / 1024 / 1024).toFixed(2)}MB, Heap ${(mem.heapUsed / 1024 / 1024).toFixed(
      2
    )}MB`
  );
  logger.info(
    SERVICE_NAME,
    `[cacheUpdater] CPU: user ${(cpu.user / 1000000).toFixed(2)}s, system ${(cpu.system / 1000000).toFixed(2)}s`
  );
}

setInterval(updateAllCache, 600000); // Atualiza a cada 10 minutos (600.000 ms)

logger.info(SERVICE_NAME, 'cacheUpdater rodando...');
