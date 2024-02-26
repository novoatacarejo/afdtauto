require('dotenv').config();
const oracledb = require('oracledb');
const axios = require('axios');
// var axios = require("axios").default;
const log = console.log


// Configure your Oracle DB connection details
const dbConfig = {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECTION_STRING
};


let optionsGetToken = {
  method: 'POST',
  url: process.env.API_URL_AUTH,
  headers: {
    domain: process.env.DOMAIN,
    'app-key': process.env.APPKEY,
    'Tlan-Bff-name': process.env.TLANBFFNAME,
    'Tlan-Bff-enrolment-id': process.env.TLANBFFENROLMENTID,
    'Tlan-Bff-channel': process.env.TLANBFFCHANNEL,
    'AuthenticationKey': process.env.TLANBFFAUTHKEY,
    'Tlan-Bff-culture-code': process.env.TLANBFFCULTCODE
  }
};

// Obter o token
axios.request(optionsGetToken).then(function (responseGetToken) {

  console.log(responseGetToken.data);

if ( responseGetToken.data.success === true) {

  let myToken = responseGetToken.data.data.token;
  log(`${myToken}`)

}
        else {
                console.log('Token Error')
               }

}).catch(function (error) {
  console.error(error);
});



var options = {
    method: 'POST',
    url: process.env.API_URL_AUTH,
    headers: {
      'Content-Type': 'application/json',
      'Tlan-Bff-name': process.env.TLANBFFNAME,
      'Tlan-Bff-enrolment-id': process.env.TLANBFFENROLMENTID,
      'Tlan-Bff-channel': process.env.TLANBFFCHANNEL,
      'Tlan-Bff-culture-code': process.env.TLANBFFCULTCODE,
       Authorization: 'Bearer ' + myToken
  },
  data: [
    {
      punch: {
        cardId: '2471',
        punchSystemTimestamp: '2024-01-27 22:45',
        punchUserTimestamp: '2024-01-27 22:45',
        punchType: '1'
      }
    }
  ]
};



axios.request(options).then(function (response) {
  console.log(response.data);
}).catch(function (error) {
  console.error(error);
});


/* Exemplo do Body
[
    {
        "punch": {
            "cardId": "2471",
            "punchSystemTimestamp": "2024-01-27 22:45",
            "punchUserTimestamp": "2024-01-27 22:45",
            "punchType": "1"            
           }
    }
]
*/

/*

const sqlQuery = `
SELECT JSON_OBJECT('data' VALUE
                   JSON_ARRAY(JSON_OBJECT('status_id' VALUE STATUS_ID,
                                          'type_id' VALUE TYPE_ID,
                                          'punch_time' VALUE PUNCH_TIME,
                                          'punch_date' VALUE PUNCH_DATE,
                                          'station_id' VALUE STATION_ID,
                                          'card_id' VALUE CARD_ID,
                                          'time_stamp' VALUE TIME_STAMP))) AS "BODY"
FROM (SELECT 'DATA' AS DATA_BODY,
             CODFILIAL,
             CODSECAO,
             IDSECAO,
             CODFUNCAO,
             IDFUNCAO,
             CHAPA,
             CODPESSOA,
             DTABATIDA,
             TIPO_NATUREZA,
             NATUREZA_NOME,
             NATUREZA,
             STATUS_BATIDA,
             STATUS_NOME,
             BATIDA_HHMM,
             BATIDA_MIN,
             STATUS_ID,
             TYPE_ID,
             PUNCH_TIME,
             PUNCH_DATE,
             STATION_ID,
             CARD_ID,
             DATE_FORMAT,
             HOUR_FORMAT,
             TRUNC((TO_DATE((DATE_FORMAT || ' ' || HOUR_FORMAT),
                            'YYYY-MM-DD HH24:MI:SS') -
                   TO_DATE('1970-01-01', 'YYYY-MM-DD')) * 24 * 60 * 60) AS TIME_STAMP
      FROM (SELECT B.CODFILIAL,
                   B.CODSECAO,
                   D.ID AS IDSECAO,
                   B.CODFUNCAO,
                   C.ID AS IDFUNCAO,
                   A.CHAPA,
                   B.CODPESSOA,
                   A.DATAREFERENCIA AS DTABATIDA,
                   (CASE
                     WHEN A.NATUREZA = 0 THEN
                      'E'
                     ELSE
                      'S'
                   END) AS TIPO_NATUREZA,
                   DECODE(NATUREZA, 0, 'ENTRADA', 1, 'SAIDA', NATUREZA) AS NATUREZA_NOME,
                   A.NATUREZA,
                   STATUS AS STATUS_BATIDA,
                   DECODE(STATUS, 'C', 'COLETADA', 'D', 'DIGITADA', STATUS) AS STATUS_NOME,
                   NBIODS.NBIODSF_MINUTESTOHHMM(A.BATIDA) AS BATIDA_HHMM,
                   A.BATIDA AS BATIDA_MIN,
                   NULL AS "--->",
                   (CASE
                     WHEN A.NATUREZA = 0 THEN
                     -- Entrada
                      10
                     ELSE
                     -- Saída
                      20
                   END) AS STATUS_ID,
                   -- Normal, TS, Intervalo. Manter Fixo em 1
                   1 AS TYPE_ID,
                   -- Hora da picagem/batida HH24:MI
                   NBIODS.NBIODSF_MINUTESTOHHMM(A.BATIDA) AS PUNCH_TIME,
                   -- Data da Picagem/batida DD-MM-YYYY
                   TO_CHAR(A.DATAREFERENCIA, 'DD-MM-YYYY') AS PUNCH_DATE,
                   -- Identificador do terminal/relógio do ponto
                   B.CODFILIAL AS STATION_ID,
                   -- Matricula do Colaborador que fez a marcação da picagem/batida
                   B.CODPESSOA AS CARD_ID,
                   -- Data e Hora da picagem/batida em formato EPOCH - timestamp
                   TO_CHAR(A.DATAREFERENCIA, 'YYYY-MM-DD') AS DATE_FORMAT,
                   TO_CHAR(NBIODS.NBIODSF_MINUTESTOHHMM(TO_NUMBER(A.BATIDA)) ||
                           ':00') AS HOUR_FORMAT
            FROM NBISTG.NBISTG_RM_ABATFUN A,
                 NBISTG.NBISTG_RM_PFUNC   B,
                 NBISTG.NBISTG_RM_PFUNCAO C,
                 NBISTG.NBISTG_RM_PSECAO  D
            WHERE 1 = 1
            AND A.CODCOLIGADA = B.CODCOLIGADA
            AND A.CHAPA = B.CHAPA
            AND B.CODFUNCAO = C.CODIGO
            AND B.CODSECAO = D.CODIGO
            AND A.DATAREFERENCIA <= (CASE
                    WHEN B.CODSITUACAO = 'D' THEN
                     B.DATADEMISSAO
                    ELSE
                     TRUNC(SYSDATE)
                  END)
            AND BATIDA > 0))
            FETCH FIRST 10 ROWS ONLY
`
          cardId: '2471',
          punchSystemTimestamp: '2024-01-27 22:45',
          punchUserTimestamp: '2024-01-27 22:45',
          punchType: '1'
console.log(sqlQuery);

// Configure your API endpoint
// const apiUrl = 'https://your-api-endpoint'; // Original Code
const apiUrl = process.env.API_BASE_URL
// const apiUrlWithBody = process.env.API_BASE_URL_WITH_BODY

// API Production
// http://10.101.108.37:8080/App/execution/api/json/api.php?Class=APIPunchExt&Method=setPunchExt&v=2&SessionID=FixSessionIDtoEAIEXTPUNCH&json={"data":[{"status_id":0,"type_id":1,"punch_time":"17:41","time_stamp":1606930860,"punch_date":"02-12-2020","station_id":1234,"card_id":"53866"}]}


// Connect to Oracle DB
oracledb.getConnection(dbConfig, async (err, connection) => {
    if (err) {
        console.error('Error connecting to Oracle database:', err.message);
        return;
    }

    try {
        // Query data from the Oracle database
        const result = await connection.execute(sqlQuery);

        // Assuming result.rows contains your data, send it to the API
        // const response = await axios.post(apiUrl, result.rows); // Original code without body
        
        // Code with body
        // const response = await axios.post(apiUrl, { data: result.rows });
        // console.log('API Response:', response.data);


        // const jsonResult = JSON.stringify(result.rows);


        /*
        const jsonResult = result.rows.map(row => {
            const jsonRow = {};
            result.metaData.forEach((meta, index) => {
                jsonRow[meta.name] = row[index];
            });
            return jsonRow;
        });
        
  
        console.log(jsonResult);
        */

   
        /*
       result.rows.forEach((item)=>{
            console.log(apiUrl + JSON.stringify(item))
        })

       const response = await axios.post(apiUrl, { data: result.rows });
       console.log('API Response:', response.data);
    
        // console.log( result.rows);
        // console.log({ data: result.rows });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        // Release the Oracle DB connection
        connection.close();
    }
});

*/

