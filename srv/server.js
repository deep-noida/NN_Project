'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const dbConn = require('../db/db-conn');
const dbOp = require('../db/db-op');
const nnGenFun = require('../srv/nn-gen-function');

var _db = undefined;

const app = express();
app.use(bodyParser.json());

// GET method to check that REST service deployed to CF 
app.get('/', function (request, res) {
    res.send('Generate Next Number method GET - deployed!');
});

// POST method to process request from generate new identifier for next number functionality 
app.post('/', async function (req, res) {
    nnGenFun.generateNextNumber(_db, req, res);
});

// read all records from NN_SEQUENCE table
app.get('/readAll', async function (req, res) {
    dbOp.getAll(_db, res);
});

// update sequence column by ID 
app.put('/updateSequence/:id&:sequence', function (req, res) {
    dbOp.updateSequence(_db, res, req.params.id, req.params.sequence);
});

// delete record by ID
app.delete('/delete/:id', function (req, res) {
    dbOp.deleteOne(_db, res, req.params.id);
});

var port = process.env.PORT || 3003;

app.listen(port, function () {
    console.log(' listening on port ' + port);
    // open connection to PostgreSQL
    dbConn.dbConnect(setDBCallback);
});

function setDBCallback(error, db) {
    if (error) {
        console.error('error when fetching the DB connection ' + JSON.stringify(error));
        return;
    }
    _db = db;
}