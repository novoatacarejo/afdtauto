const { WFMDevService } = require('../backend/services/wfmdev.service');

// Executa a sincronização para o dia atual
(async () => {
  const today = new Date();
  const dia = String(today.getDate()).padStart(2, '0');
  const mes = String(today.getMonth() + 1).padStart(2, '0');
  const ano = today.getFullYear();
  const dataAtual = `${dia}/${mes}/${ano}`;
  console.log('Sincronizando dados para:', dataAtual);
  await WFMDevService.sendToStgWfm(dataAtual);
  console.log('Sincronização concluída!');
})();
