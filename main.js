const { Application } = require('./backend/app.js');
const { startServer } = require('./backend/server.js');

const executeApp = 0;
const minutes = -85;
const enableLog = 's';

const main = () => {
  startServer();
  Application.start(executeApp, minutes, enableLog);
};

main();
