require('dotenv').config({ path: '../.env' });
const sqlite3 = require('sqlite3').verbose();

const ENV_VARS = {
  sqlite3db: process.env.SQLITE3_DB,
  sqlite3dir: process.env.SQLITE3_DIR
};

const SQLITE3_SERVICE_NAME = 'SqlLite3Service';

class SqlLite3Service {
  static connectDB = async (newDb, sqlTxt) => {
    try {
      let db = new sqlite3.Database(`${ENV_VARS.sqlite3db}/${newDb}.db`);

      await db.run(sqlTxt);

      console.log(SQLITE3_SERVICE_NAME, `New Database created: ${newDb} at ${ENV_VARS.sqlite3db}/${newDb}.db!`);

      db.close();
    } catch (error) {
      console.log(SQLITE3_SERVICE_NAME, error);
    }
  };

  static newDB = async (newDb, sqlTxt) => {
    try {
      let db = new sqlite3.Database(`${ENV_VARS.sqlite3db}/${newDb}.db`);

      await db.run(sqlTxt);

      console.log(SQLITE3_SERVICE_NAME, `New Database created: ${newDb} at ${ENV_VARS.sqlite3db}/${newDb}.db!`);

      db.close();
    } catch (error) {
      console.log(SQLITE3_SERVICE_NAME, error);
    }
  };

  static insertDB = async (newDb, sqlTxt) => {
    try {
      let db = new sqlite3.Database(`${ENV_VARS.sqlite3db}/${newDb}.db`);

      await db.run(sqlTxt, [], (err) => {
        if (err) {
          return console.log(SQLITE3_SERVICE_NAME, err.message);
        }
        console.log(`Row ready ${this.lastID}`);
      });

      console.log(SQLITE3_SERVICE_NAME, `Inserting into ${newDb} at ${ENV_VARS.sqlite3db}/${newDb}.db!`);

      db.close();
    } catch (error) {
      console.log(SQLITE3_SERVICE_NAME, error);
    }
  };
}

exports.SqlLite3Service = SqlLite3Service;
