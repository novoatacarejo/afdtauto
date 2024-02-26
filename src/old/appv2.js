require('dotenv').config();
const axios = require('axios');
const { TlanticService } = require('../services/tlantic.service');
const { ConsincoService } = require('../services/consinco.service');
const log = console.log;

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
            cardId: new String( item.cardId ),
            punchSystemTimestamp: item.punchSystemTimestamp,
            punchUserTimestamp: item.punchUserTimestamp,
            punchType: new String( item.punchType )
          }
        }
      ]
    };

   axios
      .request(options)
      .then(function (response) {

        if (!response.data.success) {
          throw new Error(
            'error when trying to post data \nStatus:' + response.data.data.result[0].status + '\nMessage:',
            +response.data.data.result[0].message
          );
        } else {
          let result = response.data.data.result[0]
        //  'Status:' + response.data.data.result[0].status + '\ncardId:' + response.data.data.result[0].cardId + '\nPunch:' + response.data.data.result[0].punchSystemTimestamp ;
         log(result);
        }
        

        //log( response.status)
        //log( response.text)

      })
      .catch(function (error) {
        console.error(error);
      })
      .finally( ()=>{
        process.exit(1);
      }
      )
      
      ;
  });

 

};

startApplication();
