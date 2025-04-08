const { StationService } = require('./station.service.js');
const { TlanticService } = require('./tlantic.service.js');
const { WFMDevService } = require('./wfmdev.service.js');
const { OracleService } = require('./oracle.service.js');
const { NetworkService } = require('./network.service.js');
const { WebService } = require('./server.service.js');
const { SqlLiteService } = require('./sqlite.service.js');

module.exports = {
  StationService,
  TlanticService,
  WFMDevService,
  OracleService,
  NetworkService,
  WebService,
  SqlLiteService
};
