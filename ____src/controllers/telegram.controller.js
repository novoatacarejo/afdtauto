const { Telegraf } = require('telegraf');

const sendLogToTelegram = (logname) => {
  const telegram = {
    token: BOT_TOKEN,
    chatId: CHAT_ID
  };

  const bot = new Telegraf(telegram.token);

  const filename = `${logname}`;

  fs.readFile(filename, 'utf8', async (err, data) => {
    if (err) throw err;
    let file = 'File: ' + filename;
    let msg = `Integração Tlantic: \n\n\n${file} \n\n\n${data}`;

    await bot.telegram.sendMessage(telegram.chatId, msg);
  });

  logger.info(`[TELEGRAM] send log to Telegram Group`);
};
