'use strict';
const xsenv = require('@sap/xsenv');
const pgp = require('pg-promise')();

const createTable =
    'CREATE TABLE IF NOT EXISTS NN_SEQUENCE \
        ( \
            ID serial PRIMARY KEY, \
            PLANT VARCHAR ,\
            WORK_CENTER VARCHAR ,\
            RESET_MODE VARCHAR ,\
            DAY INTEGER DEFAULT 0, \
            MONTH INTEGER DEFAULT 0, \
            YEAR INTEGER DEFAULT 0, \
            NN_SEQUENCE INTEGER DEFAULT 0, \
            unique(PLANT, WORK_CENTER, RESET_MODE, DAY, MONTH, YEAR ) \
        )';

function dbConnect(cb) {
    let connectionConf = {};
    if (process.env.VCAP_SERVICES) {
        // build connection details
        connectionConf = {
            host: xsenv.cfServiceCredentials('nn-postgre-database').hostname,
            port: xsenv.cfServiceCredentials('nn-postgre-database').port,
            database: xsenv.cfServiceCredentials('nn-postgre-database').dbname,
            user: xsenv.cfServiceCredentials('nn-postgre-database').username,
            password: xsenv.cfServiceCredentials('nn-postgre-database').password,
            ssl: {
                sslmode: 'require',
                rejectUnauthorized: false
            },
        };
    }
    else {
        // Example for connection string when setup SSH Tunnel to PostgreSQL from Terminal window
        // for example, cf ssh -L 63306:postgres-204c49c1-9ce3.amazonaws.com:4424 batch-next-number
        // Change database, username, password on values from External Access Key 
          connectionConf = {
            host: "localhost",
            port: "63306",
            database: "njzyqtfCidfl",
            user: "3404cebef68e",
            password: "dc7e24e7949f",
            ssl: {
                sslmode: 'require',
                rejectUnauthorized: false
            },
        };
    }
    // create NN_SEQUENCE table 
    const db = pgp(connectionConf);
        //console.log("connection configuration:" + JSON.stringify(connectionConf));
        db.query(createTable)
            .then(function () {
                //console.log('DB initialized: ' + db);
                cb(null, db);
                return;
            })
            .catch((err) => {
                console.error("DB not initialized - ERROR: " + err);
                cb(err, null);
                return;
            });
}

module.exports = {
    dbConnect: dbConnect
};