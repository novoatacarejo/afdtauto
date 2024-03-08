var cron = require('node-cron');
const options = { timeZone: 'America/Sao_Paulo' };
let dataAtual = new Date();
let dataHoraBrasil = dataAtual.toLocaleString('pt-BR', options);

console.log(`Iniciado em: ${dataHoraBrasil}`);

cron.schedule('* 1-16 * * *', () => {
  let dataAtual = new Date();
  let dataHoraBrasil = dataAtual.toLocaleString('pt-BR', options);

  console.log(`running every minute : ${dataHoraBrasil}`);
});

/*
Allowed values
-----------------
field	value
second	0-59 ( optional )
minute	0-59
hour	0-23
day of month	1-31
month	1-12 (or names)
day of week	0-7 (or names, 0 or 7 are sunday)
 */
