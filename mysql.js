const dotenv = require('dotenv').config()
const mysql = require('mysql2');

console.log(process.env.DATABASE_URL)

const connection = mysql.createConnection(process.env.DATABASE_URL);

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL!');
});

module.exports = connection;