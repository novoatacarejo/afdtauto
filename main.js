const { application } = require('./src/app.js');

const executeApp = 0;
const minutes = -85;
const enableLog = 's';

const main = () => {
  application.start(executeApp, minutes, enableLog);
};

main();
