const { WFMDevService } = require('../backend/services/wfmdev.service');
const OracleService = require('../backend/services/oracle.service');
const SqlLiteService = require('../backend/services/sqlite.service');

describe('WFMDevService.sendToStgWfm', () => {
  beforeAll(() => {
    jest.spyOn(OracleService, 'connect').mockResolvedValue({
      execute: jest.fn().mockResolvedValue({}),
      callTimeout: 0
    });
    jest.spyOn(OracleService, 'close').mockResolvedValue();
    jest.spyOn(WFMDevService, 'syncAfdRtToSqlite').mockResolvedValue();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('deve executar o procedimento Oracle e sincronizar dados no SQLite', async () => {
    const date = '2025-09-29';
    const result = await WFMDevService.sendToStgWfm(date);
    expect(OracleService.connect).toHaveBeenCalled();
    expect(WFMDevService.syncAfdRtToSqlite).toHaveBeenCalledWith(date);
    // Você pode adicionar mais asserts conforme necessário
  });
});
