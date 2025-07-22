/*
INSERT INTO clocks (
                       codFilial,
                       dtaGeracao,
                       empresaDir,
                       ip,
                       ipFinal,
                       item,
                       nomeEmpresa,
                       nroEmpresa,
                       piso,
                       portaria,
                       status,
                       userName,
                       userPass
                   )
                   VALUES (
                       'codFilial',
                       'dtaGeracao',
                       'empresaDir',
                       'ip',
                       'ipFinal',
                       'item',
                       'nomeEmpresa',
                       'nroEmpresa',
                       'piso',
                       'portaria',
                       'status',
                       'userName',
                       'userPass'
                   );
*/

INSERT INTO clocks (
    codFilial, dtaGeracao, empresaDir, ip, ipFinal, item, 
    nomeEmpresa, nroEmpresa, piso, portaria, status, userName, userPass
)
VALUES (
    42,
    datetime('now'),
    '42-ABREULIMA',
    '192.168.35.80',
    80,
    1,
    'ABREULIMA',
    35,
    1,
    671,
    'success',
    'admin',
    'admin'
),
(
    42,
    datetime('now'),
    '42-ABREULIMA',
    '192.168.35.81',
    81,
    2,
    'ABREULIMA',
    35,
    1,
    671,
    'success',
    'admin',
    'admin'
);