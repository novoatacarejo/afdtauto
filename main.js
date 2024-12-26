const { application } = require('./src/app.js');

const enableLog = 'n';
const executeApp = 0;

const main = () => {
  application.start(executeApp, enableLog);
};

main();
