const dotenv = require('dotenv').config()
const mysql = require('mysql2');

const connection = mysql.createConnection(process.env.DATABASE_URL);

console.log(connection)

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL!');
});

module.exports = connection;