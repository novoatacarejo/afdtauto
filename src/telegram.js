require('dotenv').config('../.env');
const fs = require('fs');
//const { get } = require('http');
const path = require('path');
const { Telegraf } = require('telegraf');

const telegram = {
  token: process.env.BOT_TOKEN,
  chatId: process.env.CHAT_ID
};

const bot = new Telegraf(telegram.token);

const dirPath = path.join(__dirname, '../logs');

console.log(dirPath);

const getNewestFile = (dir, regexp) => {
  newest = null;
  files = fs.readdirSync(dir);
  one_matched = 0;

  for (i = 0; i < files.length; i++) {
    if (regexp.test(files[i]) == false) continue;
    else if (one_matched == 0) {
      newest = files[i];
      one_matched = 1;
      continue;
    }

    f1_time = fs.statSync(files[i]).mtime.getTime();
    f2_time = fs.statSync(newest).mtime.getTime();
    if (f1_time > f2_time) newest[i] = files[i];
  }

  if (newest != null) return dir + newest;
  return null;
};

var filename = getNewestFile(dirPath, new RegExp('.*.log'));

console.log(filename);

const data =
  '%E2%9A%A0%20Erro%20%F0%9F%92%A9%20%F0%9F%92%A3%20%F0%9F%92%A5%20%F0%9F%98%A1%20%0A\n\nFollow the instructions provided by the BotFather to set a name and username for your bot.\nOnce you have created your bot, the BotFather will give you a token that you can use to authenticate with Telegrams servers.\n\n\nMake sure to save your bots token somewhere safe, as you will need it later.';
/* 
try {
  async () => {
    bot.telegram.sendMessage(telegram.chatId, data);
    await delay(60000); // sleep 1 minute so not to exceed the rate limit
  };
} catch (error) {
  async () => {
    if (error.response && error.response.statusCode === 429) {
      const retryAfterSeconds = error.response.headers['retry-after'] + 10 || 60;
      console.warn(`Too many requests, waiting for ${retryAfterSeconds} seconds before retrying...`);
      await new Promise((resolve) => setTimeout(resolve, retryAfterSeconds * 1000));
      console.log('Retrying...');
      i--; // Retry the same iteration
    } else {
      console.error('Failed to send media group:', error);
    }
  };
}
 */
