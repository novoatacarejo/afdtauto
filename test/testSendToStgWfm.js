const { WFMDevService } = require('../backend/services/wfmdev.service.js');

async function testSendToStgWfm() {
  // Cria objeto Date para 29/09/2025
  const date = new Date(2025, 8, 29); // mês começa em 0 (setembro = 8)
  try {
    console.log('Iniciando teste do método sendToStgWfm...');
    const result = await WFMDevService.sendToStgWfm(date, 'y');
    console.log('Resultado:', result);
    console.log('Teste concluído. Verifique os logs para detalhes do envio.');
  } catch (err) {
    console.error('Erro no teste:', err);
  }
}

testSendToStgWfm();
