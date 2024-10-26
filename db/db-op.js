'use strict';

function getAll(db, res) {
    const query = 'SELECT * FROM NN_SEQUENCE';
    db.manyOrNone(query)
        .then(function (data) {
            res.status(200).json(data);
        })
        .catch(function (error) {
            console.error("ERROR:" + error);
            res.status(500);
            res.end('Error accessing DB: ' + JSON.stringify(error));
        });
}

async function upsert(db, upsertData) {
    let record = await db.one({
        name: 'upsert-NN_SEQUENCE',
        text: 'INSERT INTO NN_SEQUENCE (PLANT, WORK_CENTER, RESET_MODE, DAY, MONTH, YEAR, NN_SEQUENCE) \
         values ($1,$2,$3,$4,$5,$6,$7) \
         ON CONFLICT (PLANT, WORK_CENTER, RESET_MODE, DAY, MONTH, YEAR) \
         DO UPDATE SET NN_SEQUENCE = NN_SEQUENCE.NN_SEQUENCE + 1 \
         RETURNING NN_SEQUENCE.*',
        values: [upsertData.plant, upsertData.workCenter, upsertData.resetMode, upsertData.day, upsertData.month, upsertData.year, upsertData.sequence]
    })
        .then(data => {
            return data;
        })
        .catch(error => {
            console.error("upsert ERROR:" + error);
            throw new Error("upsert method error:" + error);
        });
    return record;
}


function updateSequence(db, res, id, sequence) {
    db.one({
        name: 'update-user',
        text: 'UPDATE NN_SEQUENCE set NN_SEQUENCE = $1 WHERE id = $2 RETURNING *',
        values: [sequence, id]
    })
        .then(data => {
            res.status(200).json(data);
        })
        .catch(error => {
            console.error("ERROR:" + error);
            res.status(500);
            res.end('Error accessing DB: ' + JSON.stringify(error));
        });
}

function deleteOne(db, res, id) {
    db.result({
        name: 'delete-user',
        text: 'DELETE FROM NN_SEQUENCE WHERE id = $1',
        values: [id]
    })
        .then(function () {
            res.status(200).end('OK');
        })
        .catch(error => {
            console.error("ERROR:" + error);
            res.status(500);
            res.end('Error accessing DB: ' + JSON.stringify(error));
        });
}

module.exports = {
    getAll: getAll,
    updateSequence: updateSequence,
    deleteOne: deleteOne,
    upsert: upsert
};