const { Application } = require('../backend/app.js');

const executeApp = 1;
const minutes = -85;
const enableLog = 's';

const main = () => {
  Application.start(executeApp, minutes, enableLog);
};

main();
