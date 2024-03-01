const log = console.log;

const subtractHours = (date, hours) => {
  date.setHours(date.getHours() - hours);

  const hour = date.toLocaleTimeString();

  const etl = hour.split(':');

  return `${etl[0]}:${etl[1]}`;
};

// current Date
let currentDate = subtractHours(new Date(), 0);
//let currentDate = new Date();

// current Date - 1 Hour
let previousHour = subtractHours(new Date(), 1);

const test = previousHour < '19:00' ? true : false;

console.log(`\n
Current Date: ${currentDate}\n
Current Date - (1 Hour): ${previousHour}\n
${test} --> ${previousHour} < ${currentDate}\n
`);
