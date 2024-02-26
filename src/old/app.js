require('dotenv').config();
const axios = require('axios');
const { TlanticService } = require('./src/services/tlantic.service');
const { ConsincoService } = require('./src/services/consinco.service');
const log4js = require('log4js');

log4js.configure({
  appenders: {
    error: { type: 'file', filename: './src/log/error.log' },
    200: { type: 'file', filename: './src/log/success.log' }
  },
  categories: { default: { appenders: ['error'], level: 'error' }, sucess: { appenders: ['200'], level: 'info' } }
});

const logger = log4js.getLogger();
//ogger.level = "info";

const startApplication = async () => {
  const token = await TlanticService.getToken();
  const punches = await ConsincoService.getPunches();

  punches.forEach((item) => {
    const options = {
      method: 'POST',
      url: process.env.API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Tlan-Bff-name': process.env.TLANBFFNAME,
        'Tlan-Bff-enrolment-id': process.env.TLANBFFENROLMENTID,
        'Tlan-Bff-channel': process.env.TLANBFFCHANNEL,
        'Tlan-Bff-culture-code': process.env.TLANBFFCULTCODE,
        Authorization: 'Bearer ' + token
      },
      data: [
        {
          punch: {
            cardId: new String(item.cardId),
            punchSystemTimestamp: item.punchSystemTimestamp,
            punchUserTimestamp: item.punchUserTimestamp,
            punchType: new String(item.punchType)
          }
        }
      ]
    };

    axios
      .request(options)
      .then(function (response) {
        if (!response.data.success) {
          /*
          throw new Error(
           'error when trying to post data \nStatus: ' + response.data.data.result[0].status + '\nMessage: ' + response.data.data.result[0].message
          );
          */

          let result =
            'error when trying to post data \nStatus: ' +
            response.data.data.result[0].status +
            '\nMessage: ' +
            response.data.data.result[0].message;

          logger.error(result);
        } else {
          let result = response.data.data.result[0];

          logger.error(result);
        }
      })
      .catch(function (error) {
        logger.error(error);
      })
      .finally(() => {
        process.exit(1);
      });
  });
};

startApplication();
