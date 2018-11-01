const rdb = require('rethinkdb')
const express = require('express')
const async = require('async')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()

const config = require('./config/active-users-config.json')
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
 * This route requires the header AuthToken, returns a list of courses pertaining to the student
 * NOTE: This is currently only going to give back a hard coded list of courses until we have LDAP access
 */
app.get('/classes', (req, res) => {
    if (req.get('AuthToken') == null) {
        res.status(400)
        res.json({
            'message': 'Error: AuthToken not provided',
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
 * @param {string} roomId - Query parameter for the room you want the active users from
 * @param {string} RosefireToken - header
 */
app.get('/activeUsers', (req, res) => {
    // check id
    // get list
    // return list
    let roomId = req.query.roomId
    let authToken = req.get('authToken')

    async.waterfall([
        activeusersGetChecks(roomId, authToken),
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
 * @param {string} AuthToken - header
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
    let authToken = req.get('AuthToken')
    let student = req.body
    let checkInTime = Date.now()

    async.waterfall([
        activeusersPostChecks(roomId, authToken),
        getRoles,
        checkPostRoles,
        checkStudentExistsAlready(roomId),
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
 * @param {string} AuthToken - header
 */
app.delete('/activeUsers', (req, res) => {
    // check params
    // validate users is in the room
    // remove user from room
    // trigger long-term storage/ logging of interaction
    // return message
    let username = req.query.username
    let roomId = req.query.roomId
    let authToken = req.get('AuthToken')
    let checkOutTime = Date.now()
    async.waterfall([
        activeusersDeleteChecks(username, roomId, authToken),
        getRoles,
        checkDeleteRoles,
        getStudent(roomId, username),
        removeStudent(roomId, checkOutTime, username),
        sendStudentToDataService(roomId, checkOutTime)
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

function activeusersGetChecks(roomId, authToken) {
    return function(callback) {
        if (roomId == null) {
            console.log(`${getTimeString()}::activeusersGetChecks | Error: No roomId provided | AuthToken: ${authToken} | RoomId: ${roomId}`)
            callback('Error: No roomId provided', null)
        } else if (authToken == null) {
            console.log(`${getTimeString()}::activeusersGetChecks | Error: Error: No AuthToken provided | AuthToken: ${authToken} | RoomId: ${roomId}`)
            callback('Error: No AuthToken provided', null)
        } else {
            console.log(`${getTimeString()}::activeusersGetChecks | Success | AuthToken: $authToken} | RoomId: ${roomId}`)
            callback(null, authToken)
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
        console.log(`${getTimeString()}::getActiveStudents | Attempting | RoomId: ${roomId}`)
        rdb.table('rooms').get(roomId)('actives').run(app._rdbConn, callback)
    }
}

function activeusersPostChecks(roomId, authToken) {
    return function(callback) {
        if (roomId == null) {
            console.log(`${getTimeString()}::activeusersPostChecks | Error: No roomId provided | AuthToken: ${authToken} | RoomId: ${roomId}`)
            callback('Error: No roomId provided', null)
        } else if (authToken != null) {
            console.log(`${getTimeString()}::activeusersPostChecks | Success: Using AuthToken | AuthToken: ${authToken} | RoomId: ${roomId}`)
            callback(null, authToken)
        } else {
            console.log(`${getTimeString()}::activeusersPostChecks | Error: No token provided | AuthToken: ${authToken} | RoomId: ${roomId}`)
            callback('Error: No token provided', null)
        }
    }
}

/**
 * This will contact the role service 
 */
function getRoles(authToken, callback) {
    const options = {
        url: config.rolesService.url + "/roles",
        method: 'GET',
        headers: {
            'AuthToken': authToken
        }
    }
    request.get(options, function(err, response, body) {
        if (err) {
            console.log(`${getTimeString()}::getRoles | Error: ${err} | Response: ${response && response.statusCode} | Body ${body} | AuthToken: ${authToken}`)
            callback(err, null)
        } else {
            console.log(`${getTimeString()}::getRoles | InProgress: Unpacking response | Response: ${response && response.statusCode} | Body ${body}`)
            let userInfo = JSON.parse(body)
            console.log(`${getTimeString()}::getRoles | Success | UserInfo: ${userInfo}`)
            let roles = userInfo.roles
            let username = userInfo.user.username
            let name = userInfo.user.name
            callback(null, username, name, roles)
        }
    })
}

function checkPostRoles(username, name, roles, callback) {
    if (roles.includes('Student')) {
        console.log(`${getTimeString()}::checkPostRoles | Success | Username: ${username} | Name: ${name} | Roles: ${roles}`)
        callback(null, username, name)
    } else {
        console.log(`${getTimeString()}::checkPostRoles | Error: User ${username} is not authorized to check in | Username: ${username} | Name: ${name} | Roles: ${roles}`)
        callback(`Error: User ${username} is not authorized to check in`, null)
    }
}


function checkStudentExistsAlready(roomId) {
    return function(username, name, callback) {
        console.log(`${getTimeString()}::checkStudentExistsAlready | Attempting | RoomId: ${roomId}`)
        rdb.table('rooms').get(roomId)('actives').filter(function(studentDoc) {
            return studentDoc('username').eq(username)
        }).run(app._rdbConn, function(err, result) {
            console.log(`${getTimeString()}::checkStudentExistsAlready | Attempting | RoomId: ${roomId} | FoundUser?: ${result}`)
            if (result && result.length == 0) {
                callback(null, username, name)
            } else {
                console.log(`${getTimeString()}::checkStudentExistsAlready | Error: Student already exists or RethinkDb died | RoomId: ${roomId} | FoundUser?: ${result}`)
                callback(`Error: Student already exists or RethinkDb died`, null)
            }
        })
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
        console.log(`${getTimeString()}::insertStudent | Attempting | Student: ${JSON.stringify(student)} | RoomId: ${roomId}`)
        rdb.table('rooms').get(roomId).update(
            {'actives': rdb.row('actives').append(student)}
        ).run(app._rdbConn, callback)
    }
}

function activeusersDeleteChecks(username, roomId, authToken) {
    return function(callback) {
        if (username == null) {
            console.log(`${getTimeString()}::activeusersDeleteChecks | Error: must provide a student username | Username: ${username} | RoomId: ${roomId} | AuthToken: ${authToken}`)
            callback('Error: must provide a student username', null)
        } else if (roomId == null) {
            console.log(`${getTimeString()}::activeusersDeleteChecks | Error: must provide a roomId | Username: ${username} | RoomId: ${roomId} | AuthToken: ${authToken}`)
            callback('Error: must provide a roomId', null)
        } else if (authToken == null) {
            console.log(`${getTimeString()}::activeusersDeleteChecks | Error: must provide a AuthToken | Username: ${username} | RoomId: ${roomId} | AuthToken: ${authToken}`)
            callback('Error: must provide a AuthToken', null)
        } else {
            console.log(`${getTimeString()}::activeusersDeleteChecks | Success | Username: ${username} | RoomId: ${roomId} | AuthToken: ${authToken}`)
            callback(null, authToken)
        }
    }
}

function checkDeleteRoles(username, name, roles, callback) {
    if (roles.includes('Tutor')) {
        console.log(`${getTimeString()}::checkDeleteRoles | Success | Username: ${username} | Roles: ${roles}`)
        callback(null, username, name)
    } else {
        console.log(`${getTimeString()}::checkDeleteRoles | Error: User ${username} is not authorized to checkoff students | Username: ${username} | Roles: ${roles}`)
        callback(`Error: User ${username} is not authorized to checkoff students`, null)
    }
}

function getStudent(roomId, studentUsername) {
    return function(username, name, callback) {
        console.log(`${getTimeString()}::getStudent | Attempting | Username: ${username} | Name: ${name} | RoomId: ${roomId}`)
        rdb.table('rooms').get(roomId)('actives').filter(function(studentDoc) {
            return studentDoc('username').eq(studentUsername)
        }).run(app._rdbConn, function(err, student) {
            if (err) {
                callback(err, null)
            } else {
                if (student.length != 1) {
                    callback(`Error: There was no student with the username ${studentUsername}`, null)
                } else {
                    callback(null, username, name, student[0])
                }
            }
        })
    }
}


function removeStudent(roomId, checkOutTime, studentUsername) {
    return function(username, name, student, callback) {
        console.log(`${getTimeString()}::removeStudent | Attempting | Username: ${username} | Name: ${name} | RoomId: ${roomId} | CheckOutTime: ${checkOutTime}`)
        rdb.table('rooms').get(roomId).replace(function(roomDoc) {
            return roomDoc.without('actives').merge({
                actives : roomDoc('actives').filter(function(user) {
                    return user('username').ne(studentUsername)
                })
            })
        }, {
            return_changes: true
        }).run(app._rdbConn, function(err, result) {
            if (result.errors) {
                callback(result.first_error, result)
            } else if (result.replaced != 1) {
                callback(`Error: something went wrong when replacing ${username}`, result)
            } else {    
                callback(null, username, name, student)
            }
        })
    }
}

function sendStudentToDataService(roomId, checkOutTime) {
    return function(username, name, student, callback) {
        console.log(`${getTimeString()}::sendStudentToDataservice | Sending | Student: ${JSON.stringify(student)}`)
        student.checkOutTime = checkOutTime
        student.tutorUsername = username
        student.tutorName = name
        student.roomId = roomId
        console.log(`DataService Payload: ${JSON.stringify(student)}`)
        const options = {
            url: config.dataService.url + "/store",
            method: 'POST',
            json: true,
            body: student
        }
        request(options, function(err, response, body) {
            if (err) {
                callback(err, body)
            }
            callback(null, body)
        })
    }
}
/*** Utility Functions ***/

function getTimeString() {
    date = new Date()
    return date.toISOString()
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