'use strict';
const dbOp = require('../db/db-op');

// get reset mode for sequence, can be YEAR, MONTH, DAY, NONE 
const resetMode = !isEmpty(readEnv("RESET_MODE")) ? readEnv("RESET_MODE") : "NONE";
// get pattern for building identifier 
const pattern = !isEmpty(readEnv("PATTERN")) ? readEnv("PATTERN") : "PLANTYYYYDDMMLLNNNNN";
// The number base of the sequence portion of the numbering pattern, supported 10 for decimal and 16 for hexadecimal 
const numberBase = !isEmpty(readEnv("NUMBER_BASE")) ? readEnv("NUMBER_BASE") : "10";


async function generateNextNumber(db, req, res) {
    try {
        if (req) {
            let body = req.body;
            if (isEmpty(body)) {
                throw new Error("No request body found.");
            }
            let newIdentifiers = [];
            let extensionParameters = body.extensionParameters;
            let identifiers = body.identifiers;
            let workCenterParam;
            let plant;
            if (!isEmpty(extensionParameters)) {
                workCenterParam = extensionParameters["WORK_CENTER"];
                if (isEmpty(workCenterParam)) {
                    throw new Error("WORK_CENTER extension parameter is not found");
                }
                plant = extensionParameters["PLANT"] ? extensionParameters["PLANT"] : getPlantFromRouting(extensionParameters["ROUTING"]);
                if (isEmpty(plant)) {
                    throw new Error("PLANT extension parameter is not found");
                }
            } else {
                throw new Error("No extension parameters found");
            }
            if (!isEmpty(identifiers)) {
                for (let iter = 0; iter < identifiers.length; iter++) {
                    let newIdentifier = await buildNewIdentifier(db, workCenterParam, plant);
                    // add new identifier
                    newIdentifiers.push(newIdentifier);
                }
            }
            body.identifiers = newIdentifiers;
            res.status(200).json(req.body);

        }
    } catch (err) {
        console.error("an error occurred...", err);
        res.status(500).json({
            "message": "An error occurred during next number extension execution: ",
            "error": err.message,
            "causeMessage": err.message
        });
    }

}

async function buildNewIdentifier(db, workCenter, plant) {
    let sequenceData = await updateOrInsertSequence(db, workCenter, plant);
    let newIdentifier = replacePatternPlaceholders(workCenter, plant, sequenceData.nn_sequence);
    return newIdentifier;

}
async function updateOrInsertSequence(db, workCenter, plant) {
    let dateComposition = getDateComponents();
    let upsertData = {
        plant: plant,
        workCenter: workCenter,
        resetMode: resetMode,
        year: 0,
        month: 0,
        day: 0,
        sequence: 1
    };
    // define data model to be inserted/updated to NN_SEQUENCE table 
    switch (resetMode) {
        case 'NONE':
            // use default upsertData  
            break;
        case 'YEAR':
            upsertData.year = dateComposition.fullYear;
            break;
        case 'MONTH':
            upsertData.year = dateComposition.fullYear;
            upsertData.month = dateComposition.month;
            break;
        case 'DAY':
            upsertData.year = dateComposition.fullYear;
            upsertData.month = dateComposition.month;
            upsertData.day = dateComposition.day;
            break;
        default:
            // use default upsertData 
            break;
    }

    return await dbOp.upsert(db, upsertData);
}

// replace placeholders in pattern string with actual values 
function replacePatternPlaceholders(workCenter, plant, nextNum) {
    let newIndetifier = pattern;
    let dateComposition = getDateComponents();
    let placeholders = {
        "YYYY": dateComposition.fullYear,
        "YY": dateComposition.twoDigitYear,
        "MM": dateComposition.month,
        "DD": dateComposition.day,
        "LL": workCenter,
        "PLANT": plant,
        "NNNNN": numberToNumberBase(nextNum, numberBase, 5)
    }
    for (var placeholder in placeholders) {
        while (newIndetifier.indexOf(placeholder) > -1) {
            newIndetifier = newIndetifier.replace(placeholder, placeholders[placeholder])
        }
    }
    return newIndetifier;

}

function getDateComponents() {
    let today = new Date();
    let dd = today.getDate().toString().padStart(2, '0');
    let mm = (today.getMonth() + 1).toString().padStart(2, '0');
    let yyyy = today.getFullYear();
    let yy = today.getFullYear().toString().substr(-2);

    return {
        month: mm,
        day: dd,
        fullYear: yyyy,
        twoDigitYear: yy
    }
}

// convert number to hex if needed and add leading zeros. 
function numberToNumberBase(number, numberBase, padding) {
    if (numberBase === "16") {
        //hexdecimal
        number = Number(number).toString(16).toUpperCase();
    }
    //adding leading 0 to number
    number = String(number).padStart(padding, '0');

    return number;
}

// read Environment Variables
function readEnv(sEnv) {
    return process.env[sEnv];
}

function isEmpty(obj) {
    if (obj == null) return true;
    // Assume if it has a length property with a non-zero value that that property is correct.
    if (obj.length && obj.length > 0) return false;
    if (obj.length === 0) return true;
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }
    return true;
}

// extract Plant from Handle string
function getPlantFromRouting(routing) {
    //routing input example: "RouterStepBO:RouterBO:KYMA,ROUTER1,U,A,10;RouterStepBO:RouterBO:KYMA,ROUTER1,U,A,20"
    // we need to extract plant, for example, KYMA 
    if (!isEmpty(routing)) {
        let routingArr = routing.split(':');
        if (!isEmpty(routingArr)) {
            let routerBO = routingArr[2];
            if (!isEmpty(routerBO)) {
                let routerBOArr = routerBO.split(',');
                if (!isEmpty(routerBOArr)) {
                    return routerBOArr[0];
                }
            }
        }
    }
}


module.exports = {
    generateNextNumber: generateNextNumber
};
