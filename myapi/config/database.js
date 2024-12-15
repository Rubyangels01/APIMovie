const sql = require('mssql');

const config = {
    user: 'admin',
    password: '123',
    server: 'ADMIN-PC',
    database: 'QUANLYVEXEMPHIM',
    options: {
        encrypt: true, // Use this if you're on Windows Azure
        trustServerCertificate: true // Use this if you are connecting to a local MSSQL server instance
    }
};

const config2 = {
    user: 'user',
    password: '123',
    server: 'ADMIN-PC',
    database: 'QUANLYVEXEMPHIM',
    options: {
        encrypt: true, // Use this if you're on Windows Azure
        trustServerCertificate: true // Use this if you are connecting to a local MSSQL server instance
    }
};

// Connection pools for each config
const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to MSSQL with config1');
        return pool;
    })
    .catch(err => {
        console.error('Database Connection Failed for config1! Bad Config: ', err);
        throw err;
    });

const poolPromise2 = new sql.ConnectionPool(config2)
    .connect()
    .then(pool => {
        console.log('Connected to MSSQL with config2');
        return pool;
    })
    .catch(err => {
        console.error('Database Connection Failed for config2! Bad Config: ', err);
        throw err;
    });

// Export both connection pools
module.exports = {
    sql,
    poolPromise,
    poolPromise2
};
