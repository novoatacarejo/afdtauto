const { Application } = require('./src/app.js');

const executeApp = 0;
const minutes = -85;
const enableLog = 's';

const main = () => {
  Application.start(executeApp, minutes, enableLog);
};

main();
