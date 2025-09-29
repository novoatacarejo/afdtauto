const { OracleService } = require('../backend/services/oracle.service.js');

async function cleanInvalidCodPessoa() {
  const client = await OracleService.connect();
  try {
    // Busca registros inválidos
    const sqlSelect = `SELECT CODPESSOA FROM DEV_RM_AFD WHERE REGEXP_LIKE(CODPESSOA, '[^0-9]')`;
    const result = await client.execute(sqlSelect);
    if (result.rows.length === 0) {
      console.log('Nenhum CODPESSOA inválido encontrado.');
    } else {
      console.log('CODPESSOA inválidos encontrados:', result.rows);
      // Remove registros inválidos
      const sqlDelete = `DELETE FROM DEV_RM_AFD WHERE REGEXP_LIKE(CODPESSOA, '[^0-9]')`;
      const delResult = await client.execute(sqlDelete, [], { autoCommit: true });
      console.log('Registros removidos:', delResult.rowsAffected);
    }
    // Repita para CARD_ID na WFM.STG_PUNCH
    const sqlSelectCard = `SELECT CARD_ID FROM WFM.STG_PUNCH WHERE REGEXP_LIKE(CARD_ID, '[^0-9]')`;
    const resultCard = await client.execute(sqlSelectCard);
    if (resultCard.rows.length === 0) {
      console.log('Nenhum CARD_ID inválido encontrado.');
    } else {
      console.log('CARD_ID inválidos encontrados:', resultCard.rows);
      const sqlDeleteCard = `DELETE FROM WFM.STG_PUNCH WHERE REGEXP_LIKE(CARD_ID, '[^0-9]')`;
      const delResultCard = await client.execute(sqlDeleteCard, [], { autoCommit: true });
      console.log('Registros removidos em STG_PUNCH:', delResultCard.rowsAffected);
    }
  } catch (err) {
    console.error('Erro ao limpar dados inválidos:', err);
  } finally {
    await OracleService.close(client);
  }
}

cleanInvalidCodPessoa();
