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
 * @param {string} RosefireToken - header
 */
app.get('/activeUsers', (req, res) => {
    // check id
    // get list
    // return list
    let roomId = req.query.roomId
    let rosefireToken = req.get('RosefireToken')

    async.waterfall([
        activeusersGetChecks(roomId, rosefireToken),
        getRoles,
        checkGetRoles,
        getActiveStudents(roomId)
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
                'message': `Successfully retrieved student list for room: ${roomId}`,
                'success': true,
                'data': result
            })
        }
    })
})

/**
 * @param {string} roomId - Query parameter for the room you want the active users from
 * @param {string} CardfireToken - header
 * @param {string} RosefireToken - header
 * @param {json} body - should contain a student object with the following fields
 *                      courses - an array of course objects
 *                      problemDescription - the string describing why the student is there                 
 */
app.post('/activeUsers', jsonParser, (req, res) => {
    // check params
    // other checks/ validation???
    // insert new user into the correct room's activeusers
    // return message
    let roomId = req.query.roomId
    let cardfireToken = req.get('CardfireToken')
    let rosefireToken = req.get('RosefireToken')
    let student = req.body
    let checkInTime = Date.now()

    async.waterfall([
        activeusersPostChecks(roomId, rosefireToken, cardfireToken),
        getRoles,
        checkPostRoles,
        insertStudent(checkInTime, student, roomId)
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
                'message': `Successfully added student to room: ${roomId}`,
                'success': true,
                'data': result
            })
        }
    })
})

/**
 * @param {string} username - query parameter of the students username you wish to remove
 * @param {string} roomId - query paramter for room the student is in, hopefully UI can get this, will be more work otherwise
 * @param {string} RosefireToken - header
 */
app.delete('/activeUsers', (req, res) => {
    // check params
    // validate users is in the room
    // remove user from room
    // trigger long-term storage/ logging of interaction
    // return message
    let username = req.query.username
    let roomId = req.query.roomId
    let rosefireToken = req.get('RosefireToken')
    let checkOutTime = Date.now()
    async.waterfall([
        activeusersDeleteChecks(username, roomId, rosefireToken),
        getRoles,
        checkDeleteRoles,
        getStudentOffset(roomId),
        removeStudent(roomId, checkOutTime)
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
                'message': `Successfully removed ${username} from ${roomId}`,
                'success': true,
                'data': result
            })
        }
    })
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

function activeusersGetChecks(roomId, rosefireToken) {
    return function(callback) {
        if (roomId == null) {
            console.log(`${getTimeString()}::activeusersGetChecks | Error: No roomId provided | RosefireToken: ${rosefireToken} | RoomId: ${roomId}`)
            callback('Error: No roomId provided', null)
        } else if (rosefireToken == null) {
            console.log(`${getTimeString()}::activeusersGetChecks | Error: Error: No RosefireToken provided | RosefireToken: ${rosefireToken} | RoomId: ${roomId}`)
            callback('Error: No RosefireToken provided', null)
        } else {
            console.log(`${getTimeString()}::activeusersGetChecks | Success | RosefireToken: ${rosefireToken} | RoomId: ${roomId}`)
            callback(null, rosefireToken)
        }
    }
}

function checkGetRoles(username, name, roles, callback) {
    if (roles.includes('Tutor')) {
        console.log(`${getTimeString()}::checkGetRoles | Success | Username: ${username} | Name: ${name} | Roles: ${roles}`)
        callback(null)
    } else {
        console.log(`${getTimeString()}::checkGetRoles | Success | Username: ${username} | Name: ${name} | Roles: ${roles}`)
        callback(`Error: User ${username} is not authorized to view active students`, null)
    }
}

function getActiveStudents(roomId) {
    return function(callback) {
        console.log(`${getTimeString()}::getActiveStudents | Attempting to get students | RoomId: ${roomId}`)
        rdb.table('rooms').get(roomId)('actives').run(app._rdbConn, callback)
    }
}

function activeusersPostChecks(roomId, rosefireToken, cardfireToken) {
    return function(callback) {
        if (roomId == null) {
            callback('Error: No roomId provided', null)
        } else if (rosefireToken != null) {
            callback(null, rosefireToken)
        } else if (cardfireToken != null) {
            callback(null, cardfireToken)
        } else {
            callback('Error: No token provided', null)
        }
    }
}

/**
 * This will contact the role service 
 */
function getRoles(token, callback) {
    const options = {
        url: "srtsignin-role-service/roles",
        method: 'GET',
        headers: {
            'RosefireToken': token
        }
    }
    request.get(options, function(err, response, body) {
        if (err) {
            console.log(`${getTimeString()}::getRoles | Error: ${err} | Options: ${options} | Token: ${token}`)
            callback(err, null)
        } else {
            console.log(`${getTimeString()}::getActiveStudents | InProgress: Unpacking response | Options: ${options} | Response: ${response} | Body ${body}`)
            let userInfo = JSON.parse(body)
            console.log(`${getTimeString()}::getActiveStudents | Success | UserInfo: ${userInfo}`)
            let roles = userInfo.roles
            let username = userInfo.user.username
            let name = userInfo.user.name
            callback(null, username, name, roles)
        }
    })
}

function checkPostRoles(username, name, roles, callback) {
    if (roles.includes('Student')) {
        callback(null, username, name)
    } else {
        callback(`Error: User ${username} is not authorized to check in`, null)
    }
}

/**
 * Insert the student into the proper
 * TODO: Should probably check if the user is already signed in
 */
function insertStudent(checkInTime, studentObj, roomId) {
    return function(username, name, callback) {
        student = {
            'username': username,
            'name': name,
            'checkInTime': checkInTime,
            'courses': studentObj.courses,
            'problemDescription': studentObj.problemDescription
        }
        rdb.table('rooms').get(roomId).update(
            {'actives': rdb.row('actives').append(student)}
        ).run(app._rdbConn, callback)
    }
}

function activeusersDeleteChecks(username, roomId, rosefireToken) {
    return function(callback) {
        if (username == null) {
            callback('Error: must provide a student username', null)
        } else if (roomId == null) {
            callback('Error: must provide a roomId', null)
        } else if (rosefireToken == null) {
            callback('Error: must provide a RosefireToken', null)
        } else {
            callback(null, rosefireToken)
        }
    }
}

function checkDeleteRoles(username, name, roles, callback) {
    if (roles.includes('Tutor')) {
        callback(null, username, name)
    } else {
        callback(`Error: User ${username} is not authorized to checkoff students`, null)
    }
}

/**
 * TODO: MAKE A GET FUNCTION SO WE CAN DO SOMETHING WITH IT BEFORE DELETING
 */
function getStudentOffset(roomId) {
    return function(username, name, callback) {
        rdb.table('rooms').get(roomId)('actives').offsetsOf(function(student) {
            return student('username').eq(username)
        }).run(app._rdbConn, function(err, offsetArray) {
            if (offsetArray == null || offsetArray.length != 1) {
                callback(`Error: Could not find ${username} in ${roomId}`, null)
            } else {
                callback(null, username, name, offsetArray[0])
            }
        })
    }
}

function removeStudent(roomId, checkOutTime) {
    return function(username, name, offset, callback) {
        rdb.table('rooms').get(roomId).update({
            actives: rdb.row('actives').deleteAt(offset)
        }).run(app._rdbConn, callback)
    }
}

/*** Utility Functions ***/

function getTimeString() {
    date = new Date()
    return date.toDateString()
}

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