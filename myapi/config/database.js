const sql = require('mssql');

const config = {
    user: 'sa',
    password: '123',
    server: 'ADMIN-PC', 
    database: 'QUANLYVEXEMPHIM',
    options: {
        encrypt: true, // Use this if you're on Windows Azure
        trustServerCertificate: true // Use this if you are connecting to a local MSSQL server instance
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to MSSQL');
        return pool;
    })
    .catch(err => {
        console.error('Database Connection Failed! Bad Config: ', err);
        throw err;
    });

module.exports = {
    sql, poolPromise
};
