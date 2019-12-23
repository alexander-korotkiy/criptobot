const mysql = require('mysql')
const config = require('configuration')

mysql.Promise = global.Promise

const host = config.get('DB_HOST')
const user = config.get('DB_USER')
const password = config.get('DB_PASSWORD')
const database = config.get('DB_NAME')

class Database {
  constructor() {
    this.connection = mysql.createConnection(
      {
        host: host,
        user: user,
        password: password,
        database: database
      });
  }

  query(sql, args) {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, args, (err, rows) => {
        if (err)
          return reject(err);
        resolve(rows);
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.connection.end(err => {
        if (err)
          return reject(err);
        resolve();
      });
    });
  }
}

module.exports = Database
