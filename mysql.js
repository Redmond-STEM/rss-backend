const mysql = require('mysql2');

const connection = mysql.createConnection(process.env.APPSETTING_DATABASE_URL);

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL!');
});

module.exports = connection;