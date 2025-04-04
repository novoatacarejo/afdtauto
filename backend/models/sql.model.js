const getStationsInfo = `SELECT CODFILIAL, EMPRESA, EMPRESADIR, PISO, TO_NUMBER(ITEM) AS ITEM, IP, TO_NUMBER(IPFINAL) AS IPFINAL, USERNAME, USERPASS, TO_NUMBER(PORTARIA) AS PORTARIA FROM WFM_DEV.DEV_VW_RM_DEVICES WHERE 1 = 1 AND CODFILIAL NOT IN (1, 8, 18, 38)`;

const getPunchesByHour = `SELECT CODPESSOA, PUNCHTIME FROM WFM_DEV.DEV_VW_DATE_TEST`;

const getCodPessoa = `SELECT CODPESSOA FROM WFM_DEV.DEV_RM_CODPESSOA H WHERE 1 = 1 AND CODPESSOA = :a`;

const insertAfd = `INSERT INTO WFM_DEV.DEV_AFD (DTAGERACAO, CODPESSOA, PUNCH) VALUES ( SYSDATE, :a, TO_DATE( :b, 'YYYY-MM-DD HH24:MI:SS') )`;

const insertOne = `INSERT INTO WFM_DEV.DEV_RM_AFD (DTAGERACAO, IDNUMBER, IDLENGTH, PUNCH) VALUES ( SYSDATE, :a, :b, TO_DATE( :c, 'YYYY-MM-DD HH24:MI:SS') )`;

const insertMany = `INSERT INTO WFM_DEV.DEV_RM_AFD (DTAGERACAO, IDNUMBER, IDLENGTH, PUNCH) VALUES ( SYSDATE, :a, :b, TO_DATE( :c, 'YYYY-MM-DD HH24:MI:SS') )`;

const deleteDuplicates = `
      BEGIN \
            DELETE \
            FROM DEV_RM_AFD A \
            WHERE 1 = 1  \
            AND A.DTABATIDA = TO_DATE(:a,'DD/MM/YYYY') \
            AND NOT EXISTS \
            (SELECT 1 \
                  FROM (SELECT IDNUMBER, DTABATIDA, HHMM, MIN(T.ROWID) AS MINROWID \
                        FROM DEV_RM_AFD T \
                        WHERE 1 = 1 \
                        AND T.DTABATIDA = A.DTABATIDA \
                        AND T.IDNUMBER = A.IDNUMBER \
                        AND T.HHMM = A.HHMM \
                        AND T.DTABATIDA = TO_DATE(:b,'DD/MM/YYYY') \
                        GROUP BY IDNUMBER, DTABATIDA, HHMM) B \
                  WHERE 1 = 1 \
                  AND B.MINROWID = A.ROWID) \
            OR A.CODPESSOA IS NULL; \
          COMMIT; \
      END;`;

const deleteDuplicatesRows = `
      DECLARE
          rows_deleted NUMBER;
      BEGIN
          DELETE FROM DEV_RM_AFD A
          WHERE 1 = 1
          AND NOT EXISTS (
                SELECT 1
                FROM (SELECT IDNUMBER,
                              TRUNC(PUNCH) AS DTABATIDA,
                              HHMM,
                              COUNT(*) AS QTD_ROWS,
                              MIN(T.ROWID) AS MINROWID
                        FROM DEV_RM_AFD T
                        GROUP BY IDNUMBER, TRUNC(PUNCH), HHMM) B
                WHERE 1 = 1
                AND B.MINROWID = A.ROWID);
                
          rows_deleted := SQL%ROWCOUNT;

          COMMIT;
          :rows_deleted := rows_deleted;
      END;`;

const getPunchesByDate = `SELECT
                    A.CODPESSOA,
                    TO_CHAR(A.PUNCH, 'YYYY-MM-DD HH24:MI') AS PUNCHTIME
              FROM
                  WFM_DEV.DEV_RM_AFD         A,
                  WFM_DEV.DEV_RM_CODPESSOA    B,
                  WFM_DEV.DEV_RM_DEPARTAMENTO C
              WHERE 1 = 1
              AND A.CODPESSOA = B.CODPESSOA
              AND B.FILIALRM = C.FILIALRM
              AND B.CODDEPTRM = C.CODDEPTRM
              --AND C.INTEGRA_WFM = 1
              AND TO_DATE(A.DTABATIDA,'DD/MM/YYYY') = :a`;

const checkBatidas = `
SELECT C.DTA AS DTABATIDA,
       hora, 
       COUNT(D.BATIDA) AS QTD_ROWS,
       MIN(BATIDA) AS MIN_BATIDA,
       MAX(BATIDA) AS MAX_BATIDA
FROM DEV_C5_CALENDARIO C,
     (SELECT TO_DATE(A.DTABATIDA, 'DD/MM/YYYY') AS DTABATIDA, -- Corrigido: Usando o nome da coluna correto da tabela A
             B.CODPESSOA,
             A.HHMM AS BATIDA, 
						 SUBSTR( A.HHMM, 0, INSTR( A.HHMM, ':') -1 )     AS hora
      FROM WFM_DEV.DEV_RM_AFD A
      JOIN WFM_DEV.DEV_RM_CODPESSOA B
      ON A.CODPESSOA = B.CODPESSOA -- Join explícito para melhor clareza e performance
      WHERE 1 = 1
      AND A.IDNUMBER = DECODE(A.IDLENGTH, 38, B.PIS, 50, B.CPF, NULL) -- Verifica o tamanho do IDNUMBER para determinar se é PIS ou CPF
      --AND a.codpessoa =  16878
      -- 18491  
      ) D
WHERE 1 = 1
AND C.DTA = D.DTABATIDA(+)
AND C.DTA  = 
-- '02/01/2025'
TRUNC(SYSDATE)
GROUP BY C.DTA , hora
ORDER BY 1,2`;

const sql = {
  getStationsInfo,
  getPunchesByHour,
  getPunchesByDate,
  insertAfd,
  insertMany,
  insertOne,
  getCodPessoa,
  deleteDuplicates,
  deleteDuplicatesRows,
  checkBatidas
};

module.exports = sql;
