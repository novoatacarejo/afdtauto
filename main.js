const { application } = require('./src/app.js');

const executeApp = 1;
const minutes = -85;
const enableLog = 's';

const main = () => {
  application.start(executeApp, minutes, enableLog);
};

main();
