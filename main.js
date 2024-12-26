const { application } = require('./src/app.js');

const enableLog = 's';
const executeApp = 1;

const main = () => {
  application.start(executeApp, enableLog);
};

main();
