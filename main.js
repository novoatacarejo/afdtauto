const { application } = require('./src/app.js');

const enableLog = 's';
const executeApp = 1;
const minutes = -85;

const main = () => {
  application.start(executeApp, minutes, enableLog);
};

main();
