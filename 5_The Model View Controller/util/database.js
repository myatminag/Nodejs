const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'nodejs-complete',
    password: '#88Mma71azh'
});

module.exports = pool.promise();