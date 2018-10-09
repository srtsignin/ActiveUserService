const rdb = require('rethinkdb')
const express = require('express')
const async = require('async')
const app = express()

const config = require('./config.json')

/**
 * Two usages for this route:
 *      /courses?search="queryString" - This returns a list of matching course strings,
 *                                      I currently use toUpperCase and match any location in the string
 *      /courses - This returns a json object where the department is the key
 *                 and the value is a list of json objects with course_name and common_name key/value pairs
 */
app.get('/courses', (req, res) => {
    let queryString = req.query.search
    if (queryString != null) {
        rdb.table('courses').filter(function(course) {
            return course('queryString').match(queryString)
        }).run(app._rdbConn, function(err, result) {
            if (err) {
                res.status(400)
                res.json({
                    'message': err,
                    'success': false,
                    'data': null
                })
            } else {
                result.toArray(function(err, array){
                    if (err) {
                        res.status(400)
                        res.json({
                            'message': err,
                            'success': false,
                            'data': null
                        })
                    } else {
                        console.log(array)
                        res.status(200)
                        res.json({
                            'message': `Receiving courses containing the following query string: ${queryString}`,
                            'success': true,
                            'data': array
                        })
                    }
                })
            }
        })  
    } else {
        res.json({
            'message': 'No query string specified, receiving courses by department name',
            'success': true,
            'data':coursesForMatch
        })
    }
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
            'data': ['MA211 (Differential Equations)', 'MA212 (Matrix Algebra & Systems of Differential Equations)',
                     'MA223 (Engineering Statistics I)', 'MA275 (Discrete & Combinatorial Algebra I)']
        })
    }
})

/**
 * TODO Add the stuff from the spike about active students
 */

function startExpress(connection) {
    app._rdbConn = connection
    app.listen(config.express.port, () => console.log(`Active User Service listening on port ${config.express.port}!`))
}

function connect(callback) {
    rdb.connect(config.rethinkdb, callback)
}

function checkForTables(connection, callback) {
    rdb.tableList().contains('courses').run(connection, function(err, result) {
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
], function(err, connection) {
    if (err) {
        console.error(err)
        process.exit(1)
        return
    }
    startExpress(connection)
});