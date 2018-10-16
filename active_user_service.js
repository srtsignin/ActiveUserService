const rdb = require('rethinkdb')
const express = require('express')
const async = require('async')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()

const config = require('./config.json')
const jsonParser = bodyParser.json()
/**
 * Two usages for this route:
 *      /courses?search="queryString" - This returns a list of matching course strings,
 *                                      I currently use toUpperCase and match any location in the string
 *      /courses - This will return an exception, even an empty string must be provided
 */
app.get('/courses', (req, res) => {
    let queryString = req.query.search
    
    async.waterfall([
        checkQueryString(queryString),
        getFilterCourses(app._rdbConn),
        cursorToArray
    ], function (err, result) {
        if (err) {
            res.status(400)
            res.json({
                'message': err,
                'success': false,
                'data': null
            })
        } else {
            res.status(200)
            res.json({
                'message': `Receiving courses containing the following query string: ${queryString}`,
                'success': true,
                'data': result
            })
        }
    })
})

/**
 * This route requires the header StudentToken, returns a list of courses pertaining to the student
 * NOTE: This is currently only going to give back a hard coded list of courses until we have LDAP access
 */
app.get('/classes', (req, res) => {
    if (req.get('StudentToken') == null) {
        res.status(400)
        res.json({
            'message': 'Error: StudentToken not provided',
            'success': false,
            'data': null
        })
    } else {
        let testStudent = 'Connor Boyle'
        res.json({
            'message': `Returning courses for ${testStudent}`,
            'success': true,
            'data': [{
                "department": "CSSE",
                "name": "Senior Thesis I",
                "number": 494,
                "queryString": "CSSE494 Senior Thesis I"
            },
            {
                "department": "CSSE",
                "name": "Theory of Computation",
                "number": 474,
                "queryString": "CSSE474 Theory of Computation"
            },
            {
                "department": "CSSE",
                "name": "Computer Security",
                "number": 442,
                "queryString": "CSSE442 Computer Security"
            }]
        })
    }
})

/**
 * TODO Add the stuff from the spike about active students
 */

/**
 * @param {string} roomId - Query parameter for the room you want the active users from
 * @param {string} cardfireToken - header
 * @param {string} rosefireToken - header
 */
app.get('/activeUsers', (req, res) => {
    // check id
    // get list
    // return list
    let roomId = req.get('roomId')
    let cardfireToken = req.get('cardfireToken')
    let rosefireToken = req.get('rosefireToken')
})

/**
 * @param {string} roomId - Query parameter for the room you want the active users from
 * @param {string} cardfireToken - header
 * @param {string} rosefireToken - header
 * @param {json} body - should contain a student object with the following fields
 *                      courseList - an array of course objects
 *                      problemDescription - the string describing why the student is there                 
 */
app.post('/activeUsers', jsonParser, (req, res) => {
    // check params
    // other checks/ validation???
    // insert new user into the correct room's activeusers
    // return message
    let roomId = req.get('roomId')
    let cardfireToken = req.get('cardfireToken')
    let rosefireToken = req.get('rosefireToken')
    let student = req.body
    let timestamp = Date.now()
    async.waterfall([

    ], function(err, result) {
        if (err) {
            res.status(400)
            res.json({
                'message': err,
                'success': false,
                'data': null
            })
        } else {
            res.status(200)
            res.json({
                'message': `Receiving courses containing the following query string: ${queryString}`,
                'success': true,
                'data': result
            })
        }
    })
})

app.delete('/activeUsers', (req, res) => {
    // check params
    // validate users is in the room
    // remove user from room
    // trigger long-term storage/ logging of interaction
    // return message
})

/*** COURSES FUNCTIONS ***/

function checkQueryString(queryString) {
    return function(callback) {
        if (queryString == null) {
            callback('Error: No queryString provided', null)
        } else {
            callback(null, queryString)
        }
    }
}

function getFilterCourses(connection) {
    return function (queryString, callback) {
        rdb.table('courses').without('id').filter(function (course) {
            return course('queryString').match(queryString)
        }).run(connection, callback)
    }
}

function cursorToArray(array, callback) {
    array.toArray(callback)
}

/*** ACTIVEUSERS FUNCTIONS ***/

function activeusersPostChecks(roomId, rosefireToken, cardfireToken) {
    return function(callback) {
        if (roomId == null || (rosefireToken == null && cardfireToken == null)) {
            callback('Error: No roomId provided', null)
        } else {
            callback(null, roomId)
        }
    }
}

/**
 * This will actually need to actually get the username from either token at some point
 */
function validateTokens(rosefireToken, cardfireToken) {
    return function(callback) {
        if (rosefireToken) {
            callback(null, 'boylecj', 'Connor Boyle')
        } else if (cardfireToken) {
            callback(null, 'boylecj', 'Connor Boyle')
        } else {
            callback('Error: Neither a rosefireToken or a cardfireToken', false)
        }
    }
}

/**
 * This will contact the role service 
 */
function getRoles(username, fullName, callback) {
    roles = ['Student', 'Tutor']
    callback(null, username, fullName, roles)
}

/**
 * Insert the student into the proper 
 */
function insertStudent(time, studentObj, )

/*** INITIALIZATION FUNCTIONS ***/

function startExpress(connection) {
    app._rdbConn = connection
    app.listen(config.express.port, () => console.log(`Active User Service listening on port ${config.express.port}!`))
}

function connect(callback) {
    rdb.connect(config.rethinkdb, callback)
}

function checkForTables(connection, callback) {
    rdb.tableList().contains('courses').run(connection, function (err, result) {
        if (err == null && !result) {
            err = new Error('"courses" table does not exist!')
        }
        callback(err, connection)
    })
}

async.waterfall([
    // This would be the place to add any startup functions/checks on the db before exposing express
    connect,
    checkForTables
], function (err, connection) {
    if (err) {
        console.error(err)
        process.exit(1)
        return
    }
    startExpress(connection)
});