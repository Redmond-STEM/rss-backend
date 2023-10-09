const mysql = require('mysql2');

const connection = mysql.createConnection("mysql://8ybjpskzv2rk1d2m4j29:pscale_pw_xxhPoSDQVLKyEIn3ioGofj21pkp8Fs9wVNgbN32VePn@aws.connect.psdb.cloud/rss?ssl={\"rejectUnauthorized\":true}");

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL!');
});

module.exports = connection;